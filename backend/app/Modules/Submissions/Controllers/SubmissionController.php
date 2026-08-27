<?php

namespace App\Modules\Submissions\Controllers;

use App\Http\Requests\UpdateSubmissionStatusRequest;
use App\Modules\Submissions\Actions\CreateSubmissionAction;
use App\Modules\Submissions\Actions\DeleteSubmissionAction;
use App\Modules\Submissions\Actions\GetSubmissionAction;
use App\Modules\Submissions\Actions\GetSubmissionsAction;
use App\Modules\Submissions\Actions\UpdateSubmissionAction;
use App\Modules\Submissions\Actions\UpdateSubmissionStatusAction;
use App\Modules\Submissions\Actions\WithdrawSubmissionAction;
use App\Modules\Submissions\Models\Submission;
use App\Modules\Submissions\Requests\StoreSubmissionRequest;
use App\Modules\Submissions\Requests\UpdateSubmissionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use OpenApi\Attributes as OA;

class SubmissionController
{
    public function __construct(
        private readonly CreateSubmissionAction $createSubmission,
        private readonly GetSubmissionsAction $getSubmissions,
        private readonly GetSubmissionAction $getSubmission,
        private readonly UpdateSubmissionAction $updateSubmission,
        private readonly DeleteSubmissionAction $deleteSubmission,
        private readonly WithdrawSubmissionAction $withdrawSubmission,
        private readonly UpdateSubmissionStatusAction $updateSubmissionStatus,
    ) {}

    #[OA\Get(
        path: '/api/v1/submissions',
        tags: ['Submissions'],
        summary: 'List submissions',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'conference_id',
                in: 'query',
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'status',
                in: 'query',
                schema: new OA\Schema(type: 'string')
            ),
            new OA\Parameter(
                name: 'track',
                in: 'query',
                schema: new OA\Schema(type: 'string')
            ),
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list of submissions'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $submissions = $this->getSubmissions->execute(
            $request->user(),
            $request->only([
                'conference_id',
                'status',
                'track',
                'per_page',
            ])
        );

        return response()->json($submissions);
    }

    #[OA\Post(
        path: '/api/v1/submissions',
        tags: ['Submissions'],
        summary: 'Create a submission',
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: [
                        'conference_id',
                        'title',
                        'abstract',
                    ],
                    properties: [
                        new OA\Property(
                            property: 'conference_id',
                            type: 'integer'
                        ),
                        new OA\Property(
                            property: 'title',
                            type: 'string',
                            maxLength: 255
                        ),
                        new OA\Property(
                            property: 'track',
                            type: 'string',
                            maxLength: 255
                        ),
                        new OA\Property(
                            property: 'abstract',
                            type: 'string',
                            maxLength: 5000
                        ),
                        new OA\Property(
                            property: 'file',
                            type: 'string',
                            format: 'binary'
                        ),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Submission created'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
        ]
    )]
    public function store(StoreSubmissionRequest $request): JsonResponse
    {
        Gate::authorize('create', Submission::class);

        $submission = $this->createSubmission->execute(
            $request->user(),
            $request->validated(),
            $request->file('file')
        );

        return response()->json($submission, 201);
    }

    #[OA\Get(
        path: '/api/v1/submissions/{submission}',
        tags: ['Submissions'],
        summary: 'Get a single submission',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'submission',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Submission detail'
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden'
            ),
            new OA\Response(
                response: 404,
                description: 'Not found'
            ),
        ]
    )]
    public function show(int $submission): JsonResponse
    {
        $model = $this->getSubmission->execute($submission);

        Gate::authorize('view', $model);

        return response()->json($model);
    }

    #[OA\Put(
        path: '/api/v1/submissions/{submission}',
        tags: ['Submissions'],
        summary: 'Update a submission (author only, while pending)',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'submission',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Submission updated'
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
    public function update(
        UpdateSubmissionRequest $request,
        Submission $submission
    ): JsonResponse {
        Gate::authorize('update', $submission);

        $updated = $this->updateSubmission->execute(
            $submission,
            $request->validated(),
            $request->file('file')
        );

        return response()->json($updated);
    }

    #[OA\Delete(
        path: '/api/v1/submissions/{submission}',
        tags: ['Submissions'],
        summary: 'Delete a submission (author only, while pending)',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'submission',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 204,
                description: 'Submission deleted'
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden'
            ),
        ]
    )]
    public function destroy(Submission $submission): JsonResponse
    {
        Gate::authorize('delete', $submission);

        $this->deleteSubmission->execute($submission);

        return response()->json(null, 204);
    }

    #[OA\Post(
        path: '/api/v1/submissions/{submission}/withdraw',
        tags: ['Submissions'],
        summary: 'Withdraw a submission',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'submission',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Submission withdrawn successfully'
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden'
            ),
            new OA\Response(
                response: 404,
                description: 'Submission not found'
            ),
        ]
    )]
    public function withdraw(Submission $submission): JsonResponse
    {
        Gate::authorize('update', $submission);

        $withdrawn = $this->withdrawSubmission->execute($submission);

        return response()->json([
            'message' => 'Submission withdrawn successfully.',
            'data' => $withdrawn,
        ]);
    }

    #[OA\Patch(
        path: '/api/v1/submissions/{submission}/status',
        tags: ['Submissions'],
        summary: 'Update submission status',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'submission',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
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
                        enum: [
                            'pending',
                            'under_review',
                            'accepted',
                            'rejected',
                            'revision_requested',
                            'withdrawn',
                        ]
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Submission status updated'
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden'
            ),
            new OA\Response(
                response: 404,
                description: 'Submission not found'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
        ]
    )]
    public function updateStatus(
        UpdateSubmissionStatusRequest $request,
        Submission $submission
    ): JsonResponse {
        Gate::authorize('decide', $submission);

        $updated = $this->updateSubmissionStatus->execute(
            $request->user(),
            $submission,
            $request->validated('status')
        );

        return response()->json($updated);
    }
}
