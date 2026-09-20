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
use OpenApi\Attributes as OA;

class RegistrationController extends Controller
{
    use AuthorizesRequests;

    #[OA\Get(
        path: '/api/v1/registrations',
        tags: ['Registrations'],
<<<<<<< HEAD
        summary: 'Get all registrations',
=======
        summary: 'Get registrations visible to the authenticated user',
        description: 'Admins see all registrations, organisers see registrations for their conferences, and regular users see only their own registrations.',
>>>>>>> origin/main
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'conference_id',
                in: 'query',
                description: 'Filter by conference ID',
                required: false,
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'user_id',
                in: 'query',
                description: 'Filter by user ID',
                required: false,
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'status',
                in: 'query',
<<<<<<< HEAD
                description: 'Filter by status',
=======
                description: 'Filter by registration status',
>>>>>>> origin/main
                required: false,
                schema: new OA\Schema(
                    type: 'string',
                    enum: ['registered', 'cancelled']
                )
            ),
            new OA\Parameter(
<<<<<<< HEAD
                name: 'per_page',
                in: 'query',
                description: 'Items per page',
                required: false,
                schema: new OA\Schema(
                    type: 'integer',
=======
                name: 'registered_from',
                in: 'query',
                description: 'Filter registrations from this date',
                required: false,
                schema: new OA\Schema(
                    type: 'string',
                    format: 'date'
                )
            ),
            new OA\Parameter(
                name: 'registered_to',
                in: 'query',
                description: 'Filter registrations up to this date',
                required: false,
                schema: new OA\Schema(
                    type: 'string',
                    format: 'date'
                )
            ),
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                description: 'Number of registrations per page',
                required: false,
                schema: new OA\Schema(
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
>>>>>>> origin/main
                    default: 15
                )
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
<<<<<<< HEAD
                description: 'Successful operation'
=======
                description: 'Registrations retrieved successfully'
>>>>>>> origin/main
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
<<<<<<< HEAD
=======
            new OA\Response(
                response: 422,
                description: 'Invalid query parameter'
            ),
>>>>>>> origin/main
        ]
    )]
    public function index(
        Request $request,
        GetRegistrationsAction $action
    ): JsonResponse {
<<<<<<< HEAD
=======
        $validated = $request->validate([
            'conference_id' => [
                'nullable',
                'integer',
                'exists:conferences,id',
            ],
            'user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
            'status' => [
                'nullable',
                'in:registered,cancelled',
            ],
            'registered_from' => [
                'nullable',
                'date',
            ],
            'registered_to' => [
                'nullable',
                'date',
                'after_or_equal:registered_from',
            ],
            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

>>>>>>> origin/main
        $filters = $request->only([
            'conference_id',
            'user_id',
            'status',
            'registered_from',
            'registered_to',
        ]);

<<<<<<< HEAD
        $perPage = $request->input('per_page', 15);

        $registrations = $action->execute($filters, $perPage);
=======
        $perPage = (int) ($validated['per_page'] ?? 15);

        $registrations = $action->execute(
            $request->user(),
            $filters,
            $perPage
        );
>>>>>>> origin/main

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

    #[OA\Get(
        path: '/api/v1/registrations/{id}',
        tags: ['Registrations'],
        summary: 'Get a specific registration',
<<<<<<< HEAD
=======
        description: 'Admins may view any registration, organisers may view registrations for their conferences, and users may view their own registrations.',
>>>>>>> origin/main
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
<<<<<<< HEAD
=======
                description: 'Registration ID',
>>>>>>> origin/main
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
<<<<<<< HEAD
                description: 'Successful operation'
=======
                description: 'Registration retrieved successfully'
>>>>>>> origin/main
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
            new OA\Response(
<<<<<<< HEAD
=======
                response: 403,
                description: 'Forbidden'
            ),
            new OA\Response(
>>>>>>> origin/main
                response: 404,
                description: 'Registration not found'
            ),
        ]
    )]
    public function show(
        int $id,
        GetRegistrationAction $action
    ): JsonResponse {
        $registration = $action->execute($id);

        $this->authorize('view', $registration);

        return response()->json([
            'success' => true,
            'data' => $registration,
        ]);
    }

    #[OA\Post(
        path: '/api/v1/registrations',
        tags: ['Registrations'],
<<<<<<< HEAD
        summary: 'Create a new registration',
=======
        summary: 'Register the authenticated user for a conference',
        description: 'The user ID and registration status are derived by the backend and cannot be selected by the client.',
>>>>>>> origin/main
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
<<<<<<< HEAD
                required: ['conference_id', 'user_id'],
=======
                required: ['conference_id'],
>>>>>>> origin/main
                properties: [
                    new OA\Property(
                        property: 'conference_id',
                        type: 'integer',
                        example: 1
                    ),
<<<<<<< HEAD
                    new OA\Property(
                        property: 'user_id',
                        type: 'integer',
                        example: 1
                    ),
                    new OA\Property(
                        property: 'status',
                        type: 'string',
                        enum: ['registered', 'cancelled'],
                        example: 'registered'
                    ),
=======
>>>>>>> origin/main
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Registration created successfully'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
            new OA\Response(
                response: 422,
<<<<<<< HEAD
                description: 'Validation error'
            ),
            new OA\Response(
                response: 409,
                description: 'Already registered'
=======
                description: 'Validation error or duplicate registration'
>>>>>>> origin/main
            ),
        ]
    )]
    public function store(
        CreateRegistrationRequest $request,
        CreateRegistrationAction $action
    ): JsonResponse {
        $this->authorize('create', Registration::class);

        $data = $request->validated();

<<<<<<< HEAD
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
=======
        // The authenticated user can only register themselves.
        $data['user_id'] = $request->user()->id;

        // New registrations always begin as registered.
        $data['status'] = 'registered';

        $registration = $action->execute($data);

        return response()->json([
            'success' => true,
            'message' => 'Registration created successfully.',
            'data' => $registration,
        ], 201);
>>>>>>> origin/main
    }

    #[OA\Put(
        path: '/api/v1/registrations/{id}',
        tags: ['Registrations'],
<<<<<<< HEAD
        summary: 'Update a registration',
=======
        summary: 'Update a registration status',
>>>>>>> origin/main
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
<<<<<<< HEAD
=======
                description: 'Registration ID',
>>>>>>> origin/main
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
<<<<<<< HEAD
                        property: 'conference_id',
                        type: 'integer',
                        example: 1
                    ),
                    new OA\Property(
                        property: 'user_id',
                        type: 'integer',
                        example: 1
                    ),
                    new OA\Property(
=======
>>>>>>> origin/main
                        property: 'status',
                        type: 'string',
                        enum: ['registered', 'cancelled'],
                        example: 'cancelled'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Registration updated successfully'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
            new OA\Response(
<<<<<<< HEAD
=======
                response: 403,
                description: 'Forbidden'
            ),
            new OA\Response(
>>>>>>> origin/main
                response: 404,
                description: 'Registration not found'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
        ]
    )]
    public function update(
        UpdateRegistrationRequest $request,
        int $id,
        UpdateRegistrationAction $action
    ): JsonResponse {
<<<<<<< HEAD
        $registration = (new GetRegistrationAction)->execute($id);

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
=======
        $registration = (new GetRegistrationAction())->execute($id);

        $this->authorize('update', $registration);

        $updatedRegistration = $action->execute(
            $id,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Registration updated successfully.',
            'data' => $updatedRegistration,
        ]);
>>>>>>> origin/main
    }

    #[OA\Delete(
        path: '/api/v1/registrations/{id}',
        tags: ['Registrations'],
<<<<<<< HEAD
        summary: 'Cancel/delete a registration',
=======
        summary: 'Cancel a registration',
        description: 'The registration is retained for reporting and its status is changed to cancelled.',
>>>>>>> origin/main
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
<<<<<<< HEAD
=======
                description: 'Registration ID',
>>>>>>> origin/main
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Registration cancelled successfully'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
            new OA\Response(
<<<<<<< HEAD
=======
                response: 403,
                description: 'Forbidden'
            ),
            new OA\Response(
>>>>>>> origin/main
                response: 404,
                description: 'Registration not found'
            ),
        ]
    )]
    public function destroy(
        int $id,
        DeleteRegistrationAction $action
    ): JsonResponse {
<<<<<<< HEAD
        $registration = (new GetRegistrationAction)->execute($id);

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
=======
        $registration = (new GetRegistrationAction())->execute($id);

        $this->authorize('delete', $registration);

        $action->execute($id);

        return response()->json([
            'success' => true,
            'message' => 'Registration cancelled successfully.',
        ]);
    }
}
>>>>>>> origin/main
