<?php

namespace App\Modules\Sessions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Sessions\Actions\CreateSessionAction;
use App\Modules\Sessions\Actions\DeleteSessionAction;
use App\Modules\Sessions\Actions\GetSessionsAction;
use App\Modules\Sessions\Actions\UpdateSessionAction;
use App\Modules\Sessions\Requests\StoreSessionRequest;
use App\Modules\Sessions\Requests\UpdateSessionRequest;
use App\Modules\Submissions\Models\ConferenceSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use OpenApi\Attributes as OA;

class SessionController extends Controller
{
    #[OA\Get(
        path: '/api/v1/sessions',
        summary: 'Get conference programme sessions',
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(
                name: 'conference_id',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                required: false,
                schema: new OA\Schema(
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                    default: 15
                )
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Sessions retrieved successfully'
            ),
            new OA\Response(
                response: 422,
                description: 'Invalid query parameter'
            ),
        ]
    )]
    public function index(
        Request $request,
        GetSessionsAction $action
    ): JsonResponse {
        $validated = $request->validate([
            'conference_id' => [
                'nullable',
                'integer',
                'exists:conferences,id',
            ],
            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $sessions = $action->execute(
            isset($validated['conference_id'])
                ? (int) $validated['conference_id']
                : null,
            (int) ($validated['per_page'] ?? 15)
        );

        return response()->json([
            'success' => true,
            'data' => $sessions->items(),
            'meta' => [
                'current_page' => $sessions->currentPage(),
                'per_page' => $sessions->perPage(),
                'total' => $sessions->total(),
                'last_page' => $sessions->lastPage(),
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/v1/sessions/{session}',
        summary: 'Get a programme session',
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(
                name: 'session',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Session retrieved successfully'
            ),
            new OA\Response(
                response: 404,
                description: 'Session not found'
            ),
        ]
    )]
    public function show(
        ConferenceSession $session
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $session->load([
                'conference',
                'submission',
            ]),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/sessions',
        summary: 'Create a programme session',
        description: 'Only an admin or the organiser who owns the conference may create a session.',
        tags: ['Sessions'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [
                    'conference_id',
                    'scheduled_time',
                ],
                properties: [
                    new OA\Property(
                        property: 'conference_id',
                        type: 'integer',
                        example: 1
                    ),
                    new OA\Property(
                        property: 'submission_id',
                        type: 'integer',
                        nullable: true,
                        example: 1
                    ),
                    new OA\Property(
                        property: 'title',
                        type: 'string',
                        nullable: true,
                        example: 'Opening Keynote'
                    ),
                    new OA\Property(
                        property: 'track',
                        type: 'string',
                        nullable: true,
                        example: 'General'
                    ),
                    new OA\Property(
                        property: 'room',
                        type: 'string',
                        nullable: true,
                        example: 'Main Hall'
                    ),
                    new OA\Property(
                        property: 'scheduled_time',
                        type: 'string',
                        format: 'date-time'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Session created successfully'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
        ]
    )]
    public function store(
        StoreSessionRequest $request,
        CreateSessionAction $action
    ): JsonResponse {
        $conference = Conference::findOrFail(
            $request->integer('conference_id')
        );

        Gate::authorize(
            'create',
            [ConferenceSession::class, $conference]
        );

        $session = $action->execute(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Session created successfully.',
            'data' => $session,
        ], 201);
    }

    #[OA\Put(
        path: '/api/v1/sessions/{session}',
        summary: 'Update a programme session',
        description: 'Only an admin or the organiser who owns the conference may update a session.',
        tags: ['Sessions'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'session',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Session updated successfully'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden'
            ),
            new OA\Response(
                response: 404,
                description: 'Session not found'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
        ]
    )]
    public function update(
        UpdateSessionRequest $request,
        ConferenceSession $session,
        UpdateSessionAction $action
    ): JsonResponse {
        Gate::authorize('update', $session);

        $updated = $action->execute(
            $session,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Session updated successfully.',
            'data' => $updated,
        ]);
    }

    #[OA\Delete(
        path: '/api/v1/sessions/{session}',
        summary: 'Delete a programme session',
        description: 'Only an admin or the organiser who owns the conference may delete a session.',
        tags: ['Sessions'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'session',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 204,
                description: 'Session deleted successfully'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden'
            ),
            new OA\Response(
                response: 404,
                description: 'Session not found'
            ),
        ]
    )]
    public function destroy(
        ConferenceSession $session,
        DeleteSessionAction $action
    ): JsonResponse {
        Gate::authorize('delete', $session);

        $action->execute($session);

        return response()->json(null, 204);
    }
}