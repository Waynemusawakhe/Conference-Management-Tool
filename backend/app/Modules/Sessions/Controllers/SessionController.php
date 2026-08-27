<?php

namespace App\Modules\Sessions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Sessions\Models\Session;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class SessionController extends Controller
{
    #[OA\Get(
        path: '/api/v1/sessions',
        summary: 'Get all sessions',
        tags: ['Sessions'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Sessions retrieved successfully'
            )
        ]
    )]
    public function index(): JsonResponse
    {
        $sessions = Session::all();

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    #[OA\Get(
        path: '/api/v1/sessions/{id}',
        summary: 'Get a session by ID',
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                description: 'Session ID',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Session retrieved successfully'
            ),
            new OA\Response(
                response: 404,
                description: 'Session not found'
            )
        ]
    )]
    public function show(int $id): JsonResponse
    {
        $session = Session::find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $session,
        ]);
    }

    #[OA\Post(
        path: '/api/v1/sessions',
        summary: 'Create a session',
        tags: ['Sessions'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['title', 'start_time', 'end_time'],
                properties: [
                    new OA\Property(
                        property: 'title',
                        type: 'string',
                        example: 'Opening Keynote'
                    ),
                    new OA\Property(
                        property: 'description',
                        type: 'string',
                        example: 'Opening presentation for the conference.'
                    ),
                    new OA\Property(
                        property: 'start_time',
                        type: 'string',
                        format: 'date-time',
                        example: '2026-09-01T09:00:00'
                    ),
                    new OA\Property(
                        property: 'end_time',
                        type: 'string',
                        format: 'date-time',
                        example: '2026-09-01T10:00:00'
                    ),
                    new OA\Property(
                        property: 'location',
                        type: 'string',
                        example: 'Main Auditorium'
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
                response: 422,
                description: 'Validation error'
            )
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $session = Session::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Session created successfully.',
            'data' => $session,
        ], 201);
    }

    #[OA\Put(
        path: '/api/v1/sessions/{id}',
        summary: 'Update a session',
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                description: 'Session ID',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Session updated successfully'
            ),
            new OA\Response(
                response: 404,
                description: 'Session not found'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            )
        ]
    )]
    public function update(Request $request, int $id): JsonResponse
    {
        $session = Session::find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found.',
            ], 404);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'start_time' => ['sometimes', 'date'],
            'end_time' => ['sometimes', 'date', 'after:start_time'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $session->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Session updated successfully.',
            'data' => $session->fresh(),
        ]);
    }

    #[OA\Delete(
        path: '/api/v1/sessions/{id}',
        summary: 'Delete a session',
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                description: 'Session ID',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Session deleted successfully'
            ),
            new OA\Response(
                response: 404,
                description: 'Session not found'
            )
        ]
    )]
    public function destroy(int $id): JsonResponse
    {
        $session = Session::find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found.',
            ], 404);
        }

        $session->delete();

        return response()->json([
            'success' => true,
            'message' => 'Session deleted successfully.',
        ]);
    }
}