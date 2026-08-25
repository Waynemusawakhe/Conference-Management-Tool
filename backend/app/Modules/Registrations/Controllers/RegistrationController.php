<?php

namespace App\Modules\Registrations\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Registrations\Actions\CreateRegistrationAction;
use App\Modules\Registrations\Actions\DeleteRegistrationAction;
use App\Modules\Registrations\Actions\GetRegistrationAction;
use App\Modules\Registrations\Actions\GetRegistrationsAction;
use App\Modules\Registrations\Actions\UpdateRegistrationAction;
use App\Modules\Registrations\Models\Registration;
use App\Modules\Registrations\Requests\CreateRegistrationRequest;
use App\Modules\Registrations\Requests\UpdateRegistrationRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Registrations",
 *     description="Conference attendee registration management"
 * )
 */
class RegistrationController extends Controller
{
    use AuthorizesRequests;

    /**
     * @OA\Get(
     *     path="/api/v1/registrations",
     *     summary="Get all registrations",
     *     tags={"Registrations"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="conference_id",
     *         in="query",
     *         description="Filter by conference ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="user_id",
     *         in="query",
     *         description="Filter by user ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="status",
     *         in="query",
     *         description="Filter by status (registered/cancelled)",
     *         @OA\Schema(type="string", enum={"registered", "cancelled"})
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Items per page",
     *         @OA\Schema(type="integer", default=15)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="array",
     *                 @OA\Items(ref="#/components/schemas/Registration")
     *             ),
     *             @OA\Property(property="meta", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function index(Request $request, GetRegistrationsAction $action): JsonResponse
    {
        $filters = $request->only(['conference_id', 'user_id', 'status', 'registered_from', 'registered_to']);
        $perPage = $request->input('per_page', 15);

        $registrations = $action->execute($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => $registrations->items(),
            'meta' => [
                'current_page' => $registrations->currentPage(),
                'per_page' => $registrations->perPage(),
                'total' => $registrations->total(),
                'last_page' => $registrations->lastPage(),
            ],
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/registrations/{id}",
     *     summary="Get a specific registration",
     *     tags={"Registrations"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Registration ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Registration")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated"),
     *     @OA\Response(response=404, description="Registration not found")
     * )
     */
    public function show(int $id, GetRegistrationAction $action): JsonResponse
    {
        $registration = $action->execute($id);
        $this->authorize('view', $registration);

        return response()->json([
            'success' => true,
            'data' => $registration,
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/registrations",
     *     summary="Create a new registration",
     *     tags={"Registrations"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"conference_id", "user_id"},
     *             @OA\Property(property="conference_id", type="integer", example=1),
     *             @OA\Property(property="user_id", type="integer", example=1),
     *             @OA\Property(property="status", type="string", enum={"registered", "cancelled"}, example="registered")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Registration created successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Registration created successfully."),
     *             @OA\Property(property="data", ref="#/components/schemas/Registration")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated"),
     *     @OA\Response(response=422, description="Validation error"),
     *     @OA\Response(response=409, description="Already registered")
     * )
     */
    public function store(CreateRegistrationRequest $request, CreateRegistrationAction $action): JsonResponse
    {
        $this->authorize('create', Registration::class);

        $data = $request->validated();

        try {
            $registration = $action->execute($data);

            return response()->json([
                'success' => true,
                'message' => 'Registration created successfully.',
                'data' => $registration,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create registration.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/v1/registrations/{id}",
     *     summary="Update a registration",
     *     tags={"Registrations"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Registration ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="conference_id", type="integer", example=1),
     *             @OA\Property(property="user_id", type="integer", example=1),
     *             @OA\Property(property="status", type="string", enum={"registered", "cancelled"}, example="cancelled")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Registration updated successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Registration updated successfully."),
     *             @OA\Property(property="data", ref="#/components/schemas/Registration")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated"),
     *     @OA\Response(response=404, description="Registration not found"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function update(UpdateRegistrationRequest $request, int $id, UpdateRegistrationAction $action): JsonResponse
    {
        $registration = (new GetRegistrationAction())->execute($id);
        $this->authorize('update', $registration);

        $data = $request->validated();

        try {
            $updatedRegistration = $action->execute($id, $data);

            return response()->json([
                'success' => true,
                'message' => 'Registration updated successfully.',
                'data' => $updatedRegistration,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update registration.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/v1/registrations/{id}",
     *     summary="Cancel/delete a registration",
     *     tags={"Registrations"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Registration ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Registration cancelled successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Registration cancelled successfully.")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated"),
     *     @OA\Response(response=404, description="Registration not found")
     * )
     */
    public function destroy(int $id, DeleteRegistrationAction $action): JsonResponse
    {
        $registration = (new GetRegistrationAction())->execute($id);
        $this->authorize('delete', $registration);

        try {
            $action->execute($id);

            return response()->json([
                'success' => true,
                'message' => 'Registration cancelled successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel registration.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
