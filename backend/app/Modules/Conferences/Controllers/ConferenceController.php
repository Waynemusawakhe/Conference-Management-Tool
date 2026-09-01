<?php

namespace App\Modules\Conferences\Controllers;

use App\Modules\Conferences\Actions\CreateConference;
use App\Modules\Conferences\Actions\DeleteConference;
use App\Modules\Conferences\Actions\UpdateConference;
use App\Modules\Conferences\Actions\UpdateConferenceStatus;
use App\Modules\Conferences\Models\Conference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

class ConferenceController
{
    #[OA\Get(
        path: '/api/v1/conferences',
        summary: 'Get all conferences',
        tags: ['Conferences'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of conferences'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorised'
            ),
        ]
    )]
    public function index(): JsonResponse
    {
        $conferences = Conference::query()
            ->with('organiser:id,name,email')
            ->latest()
            ->paginate(15);

        return response()->json($conferences);
    }

    #[OA\Post(
        path: '/api/v1/conferences',
        summary: 'Create a conference',
        tags: ['Conferences'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['organiser_id', 'code', 'name', 'format', 'start_date', 'end_date'],
                properties: [
                    new OA\Property(property: 'organiser_id', type: 'integer', example: 1),
                    new OA\Property(property: 'code', type: 'string', example: 'CMT2026'),
                    new OA\Property(property: 'name', type: 'string', example: 'CMT Annual Conference'),
                    new OA\Property(property: 'description', type: 'string', example: 'Annual conference'),
                    new OA\Property(property: 'category', type: 'string', example: 'Technology'),
                    new OA\Property(
                        property: 'topics',
                        type: 'array',
                        items: new OA\Items(type: 'string'),
                        example: ['AI', 'Software Engineering']
                    ),
                    new OA\Property(property: 'format', type: 'string', enum: ['in_person', 'virtual', 'hybrid'], example: 'virtual'),
                    new OA\Property(property: 'submission_status', type: 'string', enum: ['open', 'closed'], example: 'open'),
                    new OA\Property(property: 'start_date', type: 'string', format: 'date', example: '2026-10-01'),
                    new OA\Property(property: 'end_date', type: 'string', format: 'date', example: '2026-10-03'),
                    new OA\Property(property: 'submission_deadline', type: 'string', format: 'date', nullable: true, example: '2026-09-01'),
                    new OA\Property(property: 'venue_name', type: 'string', nullable: true, example: 'CMT Convention Centre'),
                    new OA\Property(property: 'city', type: 'string', nullable: true, example: 'Johannesburg'),
                    new OA\Property(property: 'country', type: 'string', nullable: true, example: 'South Africa'),
                    new OA\Property(property: 'website_link', type: 'string', nullable: true, example: 'https://example.com'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Conference created successfully'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(
        Request $request,
        CreateConference $action
    ): JsonResponse {
        Gate::authorize('create', Conference::class);

        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:255',
                'unique:conferences,code',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'category' => [
                'nullable',
                'string',
                'max:255',
            ],

            'topics' => [
                'nullable',
                'array',
            ],

            'topics.*' => [
                'string',
                'max:255',
            ],

            'format' => [
                'required',
                Rule::in([
                    'in_person',
                    'virtual',
                    'hybrid',
                ]),
            ],

            'submission_status' => [
                'nullable',
                Rule::in([
                    'open',
                    'closed',
                ]),
            ],

            'start_date' => [
                'required',
                'date',
            ],

            'end_date' => [
                'required',
                'date',
                'after_or_equal:start_date',
            ],

            'submission_deadline' => [
                'nullable',
                'date',
                'before_or_equal:start_date',
            ],

            'venue_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'city' => [
                'nullable',
                'string',
                'max:255',
            ],

            'country' => [
                'nullable',
                'string',
                'max:255',
            ],

            'website_link' => [
                'nullable',
                'url',
                'max:255',
            ],
        ]);

        // The authenticated user is the organiser
        $data['organiser_id'] = $request->user()->id;

        $conference = $action->execute($data);

        return response()->json([
            'success' => true,
            'message' => 'Conference created successfully.',
            'data' => $conference,
        ], 201);
    }

    #[OA\Get(
        path: '/api/v1/conferences/{conference}',
        summary: 'Get a conference by ID',
        tags: ['Conferences'],
        parameters: [
            new OA\Parameter(
                name: 'conference',
                description: 'Conference ID',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Conference details'),
            new OA\Response(response: 404, description: 'Conference not found'),
        ]
    )]
    public function show(Conference $conference): JsonResponse
    {
        $conference->load('organiser:id,name,email');

        return response()->json([
            'data' => $conference,
        ]);
    }

    #[OA\Put(
        path: '/api/v1/conferences/{conference}',
        summary: 'Update a conference',
        tags: ['Conferences'],
        parameters: [
            new OA\Parameter(
                name: 'conference',
                description: 'Conference ID',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'CMT2026'),
                    new OA\Property(property: 'name', type: 'string', example: 'Updated Conference Name'),
                    new OA\Property(property: 'description', type: 'string'),
                    new OA\Property(property: 'category', type: 'string'),
                    new OA\Property(property: 'format', type: 'string', enum: ['in_person', 'virtual', 'hybrid']),
                    new OA\Property(property: 'submission_status', type: 'string', enum: ['open', 'closed']),
                    new OA\Property(property: 'start_date', type: 'string', format: 'date'),
                    new OA\Property(property: 'end_date', type: 'string', format: 'date'),
                    new OA\Property(property: 'submission_deadline', type: 'string', format: 'date', nullable: true),
                    new OA\Property(property: 'venue_name', type: 'string', nullable: true),
                    new OA\Property(property: 'city', type: 'string', nullable: true),
                    new OA\Property(property: 'country', type: 'string', nullable: true),
                    new OA\Property(property: 'website_link', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Conference updated successfully'),
            new OA\Response(response: 404, description: 'Conference not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function update(
        Request $request,
        Conference $conference,
        UpdateConference $action
    ): JsonResponse {
        Gate::authorize('update', $conference);
        $data = $request->validate([
            'code' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('conferences', 'code')->ignore($conference->id),
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'topics' => ['nullable', 'array'],
            'topics.*' => ['string'],
            'format' => ['sometimes', Rule::in(['in_person', 'virtual', 'hybrid'])],
            'submission_status' => ['sometimes', Rule::in(['open', 'closed'])],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date'],
            'submission_deadline' => ['nullable', 'date'],
            'venue_name' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'website_link' => ['nullable', 'url', 'max:255'],
        ]);

        $updated = $action->execute($conference, $data);

        return response()->json([
            'message' => 'Conference updated successfully.',
            'data' => $updated,
        ]);
    }

    #[OA\Delete(
        path: '/api/v1/conferences/{conference}',
        summary: 'Delete a conference',
        tags: ['Conferences'],
        parameters: [
            new OA\Parameter(
                name: 'conference',
                description: 'Conference ID',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Conference deleted successfully'),
            new OA\Response(response: 404, description: 'Conference not found'),
        ]
    )]
    public function destroy(
        Conference $conference,
        DeleteConference $action
    ): JsonResponse {
        Gate::authorize('delete', $conference);
        $action->execute($conference);

        return response()->json([
            'message' => 'Conference deleted successfully.',
        ]);
    }

    #[OA\Patch(
        path: '/api/v1/conferences/{conference}/status',
        summary: 'Update conference submission status',
        tags: ['Conferences'],
        parameters: [
            new OA\Parameter(
                name: 'conference',
                description: 'Conference ID',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(
                        property: 'status',
                        type: 'string',
                        enum: ['open', 'closed'],
                        example: 'closed'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Status updated successfully'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function updateStatus(
        Request $request,
        Conference $conference,
        UpdateConferenceStatus $action
    ): JsonResponse {
        Gate::authorize('updateStatus', $conference);
        $data = $request->validate([
            'status' => ['required', Rule::in(['open', 'closed'])],
        ]);

        $updated = $action->execute($conference, $data['status']);

        return response()->json([
            'message' => 'Conference status updated successfully.',
            'data' => $updated,
        ]);
    }

    #[OA\Get(
        path: '/api/v1/conferences/{conference}/submissions',
        summary: 'Get all submissions for a conference',
        tags: ['Conferences'],
        parameters: [
            new OA\Parameter(
                name: 'conference',
                description: 'Conference ID',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Conference submissions'),
            new OA\Response(response: 404, description: 'Conference not found'),
        ]
    )]
    public function submissions(Conference $conference): JsonResponse
    {
        $submissions = DB::table('submissions')
            ->where('conference_id', $conference->id)
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json($submissions);
    }

    #[OA\Get(
        path: '/api/v1/conferences/{conference}/registrations',
        summary: 'Get all registrations for a conference',
        tags: ['Conferences'],
        parameters: [
            new OA\Parameter(
                name: 'conference',
                description: 'Conference ID',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Conference registrations'),
            new OA\Response(response: 404, description: 'Conference not found'),
        ]
    )]
    public function registrations(Conference $conference): JsonResponse
    {
        $registrations = DB::table('conference_registrations')
            ->where('conference_id', $conference->id)
            ->orderByDesc('registered_at')
            ->paginate(15);

        return response()->json($registrations);
    }

    #[OA\Get(
        path: '/api/v1/conferences/{conference}/sessions',
        summary: 'Get all sessions for a conference',
        tags: ['Conferences'],
        parameters: [
            new OA\Parameter(
                name: 'conference',
                description: 'Conference ID',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Conference sessions'),
            new OA\Response(response: 404, description: 'Conference not found'),
        ]
    )]
    public function sessions(Conference $conference): JsonResponse
    {
        $sessions = DB::table('conference_sessions')
            ->where('conference_id', $conference->id)
            ->orderBy('scheduled_time')
            ->paginate(15);

        return response()->json($sessions);
    }
}
