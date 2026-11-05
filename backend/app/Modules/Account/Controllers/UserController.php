<?php

namespace App\Modules\Account\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Account\Actions\AssignRoleAction;
use App\Modules\Account\Actions\GetReviewersAction;
use App\Modules\Account\Actions\GetUserAction;
use App\Modules\Account\Actions\GetUsersAction;
use App\Modules\Account\Requests\AssignRoleRequest;
use App\Modules\Account\Requests\UpdateManagedUserRequest;
use App\Modules\Audit\Actions\RecordAuditLogAction;
use App\Modules\Conferences\Models\Conference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    #[OA\Get(
        path: '/api/v1/users',
        tags: ['User Management'],
        summary: 'Get all users',
        description: 'Returns a list of all users. Admin only.',
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Users retrieved successfully'),
            new OA\Response(response: 403, description: 'Forbidden — admin role required'),
        ]
    )]
    public function index(GetUsersAction $getUsersAction): JsonResponse
    {
        $users = $getUsersAction->execute();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function reviewers(
        GetReviewersAction $action
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $action->execute(),
        ]);
    }

    #[OA\Get(
        path: '/api/v1/users/{id}',
        tags: ['User Management'],
        summary: 'Get user by ID',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'User ID',
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'User retrieved successfully'),
            new OA\Response(response: 404, description: 'User not found'),
            new OA\Response(response: 403, description: 'Forbidden — admin role required'),
        ]
    )]
    public function show(int $id, GetUserAction $getUserAction): JsonResponse
    {
        $user = $getUserAction->execute($id);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    #[OA\Patch(
        path: '/api/v1/users/{id}/role',
        tags: ['User Management'],
        summary: 'Assign a role to a user',
        description: 'Updates a user role. Admin only.',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'User ID',
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['role'],
                properties: [
                    new OA\Property(property: 'role', type: 'string', example: 'organiser'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Role assigned successfully'),
            new OA\Response(response: 403, description: 'Forbidden — admin role required'),
            new OA\Response(response: 404, description: 'User not found'),
            new OA\Response(response: 422, description: 'Validation Error'),
        ]
    )]
    public function assignRole(
        int $id,
        AssignRoleRequest $request,
        AssignRoleAction $action,
        GetUserAction $getUserAction,
        RecordAuditLogAction $audit
    ): JsonResponse {
        // Fetch the user first using the team's existing action
        $user = $getUserAction->execute($id);

        $this->assertMayManage($request->user(), $user);

        if (
            $user->role === 'admin'
            && $user->isAccountActive()
            && $request->validated()['role'] !== 'admin'
        ) {
            $this->assertAnotherActiveAdminExists($user);
        }

        $previousRole = $user->role;

        // Apply the new role
        $updatedUser = $action->execute(
            $user,
            $request->validated(),
            $request->user()
        );

        $audit->execute(
            $request->user(),
            $updatedUser,
            'user.role_updated',
            ['role' => $previousRole],
            ['role' => $updatedUser->role]
        );

        return response()->json([
            'success' => true,
            'message' => 'Role assigned successfully.',
            'data' => $updatedUser,
        ]);
    }

    public function update(
        int $id,
        UpdateManagedUserRequest $request,
        GetUserAction $getUserAction,
        RecordAuditLogAction $audit
    ): JsonResponse {
        $user = $getUserAction->execute($id);
        $oldValues = $user->only(['name', 'email']);
        $data = $request->validated();

        $user->fill($data);
        $user->save();

        $updatedUser = $user->refresh();

        $audit->execute(
            $request->user(),
            $updatedUser,
            'user.profile_updated',
            $oldValues,
            $updatedUser->only(['name', 'email'])
        );

        return response()->json([
            'success' => true,
            'message' => 'User details updated successfully.',
            'data' => $updatedUser,
        ]);
    }

    public function resetPassword(
        int $id,
        Request $request,
        GetUserAction $getUserAction,
        RecordAuditLogAction $audit
    ): JsonResponse {
        $user = $getUserAction->execute($id);

        if ($request->user()->is($user)) {
            return response()->json([
                'message' => 'Use your account settings to change your own password.',
            ], 422);
        }

        $status = Password::sendResetLink([
            'email' => $user->email,
        ]);

        if ($status !== Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Unable to send a password reset email at this time.',
            ], 422);
        }

        $audit->execute(
            $request->user(),
            $user,
            'user.password_reset_requested',
            null,
            ['reset_link_sent' => true]
        );

        return response()->json([
            'success' => true,
            'message' => 'A password reset link has been emailed to the user.',
        ]);
    }

    public function updateAccountStatus(
        int $id,
        Request $request,
        GetUserAction $getUserAction,
        RecordAuditLogAction $audit
    ): JsonResponse {
        $data = $request->validate([
            'account_status' => ['required', 'in:active,paused,blocked'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $getUserAction->execute($id);

        $this->assertMayManage($request->user(), $user);

        if (
            $user->role === 'admin'
            && $user->isAccountActive()
            && $data['account_status'] !== 'active'
        ) {
            $this->assertAnotherActiveAdminExists($user);
        }

        $oldValues = [
            'account_status' => $user->account_status,
            'account_status_reason' => $user->account_status_reason,
        ];

        $user->forceFill([
            'account_status' => $data['account_status'],
            'account_status_reason' => $data['reason'] ?? null,
            'account_status_changed_at' => now(),
            'account_status_changed_by' => $request->user()->id,
        ])->save();

        if ($data['account_status'] !== 'active') {
            $user->tokens()->delete();
        }

        $audit->execute(
            $request->user(),
            $user,
            'user.account_status_updated',
            $oldValues,
            [
                'account_status' => $user->account_status,
                'account_status_reason' => $user->account_status_reason,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Account status updated successfully.',
            'data' => $user->fresh(),
        ]);
    }

    public function destroy(
        int $id,
        Request $request,
        GetUserAction $getUserAction,
        RecordAuditLogAction $audit
    ): JsonResponse {
        $user = $getUserAction->execute($id);

        $this->assertMayManage($request->user(), $user);

        if ($user->role === 'admin' && $user->isAccountActive()) {
            $this->assertAnotherActiveAdminExists($user);
        }

        $ownsConferences = Conference::query()
            ->where('organiser_id', $user->id)
            ->exists();

        if ($ownsConferences) {
            throw ValidationException::withMessages([
                'account' => [
                    'This user cannot be deleted while they own conferences. Pause or block the account, or transfer their conferences first.',
                ],
            ]);
        }

        $user->tokens()->delete();

        $audit->execute(
            $request->user(),
            $user,
            'user.account_deleted',
            [
                'account_status' => $user->account_status,
                'role' => $user->role,
            ],
            [
                'deleted' => true,
            ]
        );

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account archived successfully.',
        ]);
    }

    private function assertMayManage(User $admin, User $target): void
    {
        if ($admin->is($target)) {
            throw ValidationException::withMessages([
                'account' => [
                    'Administrators cannot manage their own account from the user directory.',
                ],
            ]);
        }
    }

    private function assertAnotherActiveAdminExists(User $target): void
    {
        $anotherActiveAdminExists = User::query()
            ->where('role', 'admin')
            ->where('account_status', 'active')
            ->whereKeyNot($target->id)
            ->exists();

        if (! $anotherActiveAdminExists) {
            throw ValidationException::withMessages([
                'account' => [
                    'At least one active administrator account must remain.',
                ],
            ]);
        }
    }
}
