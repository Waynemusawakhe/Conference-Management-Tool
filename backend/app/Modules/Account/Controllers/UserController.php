<?php

namespace App\Modules\Account\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Account\Actions\GetUserAction;
use App\Modules\Account\Actions\GetUsersAction;
use App\Modules\Account\Actions\GetReviewersAction;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use App\Modules\Account\Actions\AssignRoleAction;
use App\Modules\Account\Requests\AssignRoleRequest;

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
                    new OA\Property(property: 'role', type: 'string', example: 'organiser')
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Role assigned successfully'),
            new OA\Response(response: 403, description: 'Forbidden — admin role required'),
            new OA\Response(response: 404, description: 'User not found'),
            new OA\Response(response: 422, description: 'Validation Error')
        ]
    )]
    public function assignRole(
        int $id,
        AssignRoleRequest $request,
        AssignRoleAction $action,
        GetUserAction $getUserAction
    ): JsonResponse {
        // Fetch the user first using the team's existing action
        $user = $getUserAction->execute($id);

        // Apply the new role
        $updatedUser = $action->execute($user, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Role assigned successfully.',
            'data' => $updatedUser,
        ]);
    }
}
