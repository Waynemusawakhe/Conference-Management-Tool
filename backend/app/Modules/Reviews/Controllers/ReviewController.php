<?php

namespace App\Modules\Reviews\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Reviews\Actions\CreateReviewAction;
use App\Modules\Reviews\Actions\DeleteReviewAction;
use App\Modules\Reviews\Actions\GetReviewAction;
use App\Modules\Reviews\Actions\GetReviewsAction;
use App\Modules\Reviews\Actions\LockReviewAction;
use App\Modules\Reviews\Actions\SubmitReviewAction;
use App\Modules\Reviews\Models\SubmissionReview;
use App\Modules\Reviews\Requests\CreateReviewRequest;
use App\Modules\Reviews\Requests\SubmitReviewRequest;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;
use Throwable;

class ReviewController extends Controller
{
    use AuthorizesRequests;

    #[OA\Get(
        path: '/api/v1/reviews',
        summary: 'Get all reviews',
        tags: ['Reviews'],
        parameters: [
            new OA\Parameter(
                name: 'submission_id',
                in: 'query',
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'reviewer_id',
                in: 'query',
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'recommendation',
                in: 'query',
                schema: new OA\Schema(
                    type: 'string',
                    enum: [
                        'accept',
                        'reject',
                        'revise',
                    ]
                )
            ),
            new OA\Parameter(
                name: 'locked',
                in: 'query',
                schema: new OA\Schema(type: 'boolean')
            ),
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                schema: new OA\Schema(
                    type: 'integer',
                    default: 15
                )
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of reviews'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
        ]
    )]
    public function index(
        Request $request,
        GetReviewsAction $action
    ): JsonResponse {
        $this->authorize(
            'viewAny',
            SubmissionReview::class
        );

        $filters = $request->only([
            'submission_id',
            'reviewer_id',
            'recommendation',
            'locked',
        ]);

        $perPage = (int) $request->input(
            'per_page',
            15
        );

        // Prevent excessively large API responses.
        $perPage = max(
            1,
            min($perPage, 100)
        );

        $reviews = $action->execute(
            $filters,
            $perPage,
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),

                'per_page' => $reviews->perPage(),

                'total' => $reviews->total(),

                'last_page' => $reviews->lastPage(),
            ],
        ]);
    }

    /**
     * Return the authenticated reviewer's
     * assignments that have not yet been submitted.
     */
    public function pending(
        Request $request
    ): JsonResponse {
        abort_unless(
            $request->user()->role === 'reviewer',
            403,
            'Only reviewers can access pending reviews.'
        );

        $reviews = SubmissionReview::query()
            ->with([
                'submission',
                'reviewer',
            ])
            ->where(
                'reviewer_id',
                $request->user()->id
            )
            ->whereNull('submitted_at')
            ->where('locked', false)
            ->latest('assigned_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $reviews,
        ]);
    }

    #[OA\Get(
        path: '/api/v1/reviews/{id}',
        summary: 'Get a specific review',
        tags: ['Reviews'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer'
                )
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Review details'
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
                description: 'Review not found'
            ),
        ]
    )]
    public function show(
        int $id,
        GetReviewAction $action
    ): JsonResponse {
        $review = $action->execute($id);

        $this->authorize(
            'view',
            $review
        );

        return response()->json([
            'success' => true,
            'data' => $review,
        ]);
    }

    #[OA\Post(
        path: '/api/v1/reviews',
        summary: 'Assign a reviewer to a submission',
        tags: ['Reviews'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [
                    'submission_id',
                    'reviewer_id',
                ],
                properties: [
                    new OA\Property(
                        property: 'submission_id',
                        type: 'integer',
                        example: 1
                    ),
                    new OA\Property(
                        property: 'reviewer_id',
                        type: 'integer',
                        example: 1
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Reviewer assigned successfully'
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
            new OA\Response(
                response: 500,
                description: 'Server error'
            ),
        ]
    )]
    public function store(
        CreateReviewRequest $request,
        CreateReviewAction $action
    ): JsonResponse {
        $data = $request->validated();

        $submission = Submission::with(
            'conference'
        )->findOrFail(
            $data['submission_id']
        );

        $reviewDraft = new SubmissionReview(
            $data
        );

        $reviewDraft->setRelation(
            'submission',
            $submission
        );

        $this->authorize(
            'create',
            $reviewDraft
        );

        /*
         * Ensure that the supplied reviewer ID
         * actually belongs to a reviewer account.
         */
        $reviewer = User::findOrFail(
            $data['reviewer_id']
        );

        if ($reviewer->role !== 'reviewer') {
            return response()->json([
                'success' => false,
                'message' => 'The selected user is not a reviewer.',
                'errors' => [
                    'reviewer_id' => [
                        'The selected user must have the reviewer role.',
                    ],
                ],
            ], 422);
        }

        try {
            $review = $action->execute(
                $data
            );

            return response()->json([
                'success' => true,
                'message' => 'Reviewer assigned successfully.',
                'data' => $review,
            ], 201);
        } catch (ValidationException $exception) {
            /*
             * Preserve Laravel validation responses.
             */
            throw $exception;
        } catch (Throwable $exception) {
            /*
             * Log the real exception internally,
             * but never expose it to the client.
             */
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Unable to assign the reviewer at this time.',
            ], 500);
        }
    }

    #[OA\Post(
        path: '/api/v1/reviews/{id}/submit',
        summary: 'Submit a review (score, comments, recommendation)',
        tags: ['Reviews'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer'
                )
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [
                    'score',
                    'comments',
                    'recommendation',
                ],
                properties: [
                    new OA\Property(
                        property: 'score',
                        type: 'integer',
                        minimum: 1,
                        maximum: 5,
                        example: 4
                    ),
                    new OA\Property(
                        property: 'comments',
                        type: 'string',
                        example: 'Solid methodology, needs more related work.'
                    ),
                    new OA\Property(
                        property: 'recommendation',
                        type: 'string',
                        enum: [
                            'accept',
                            'reject',
                            'revise',
                        ],
                        example: 'revise'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Review submitted successfully'
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
                description: 'Review not found'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error or review already locked'
            ),
            new OA\Response(
                response: 500,
                description: 'Server error'
            ),
        ]
    )]
    public function submit(
        SubmitReviewRequest $request,
        int $id,
        SubmitReviewAction $action
    ): JsonResponse {
        $review = (new GetReviewAction)
            ->execute($id);

        $this->authorize(
            'submit',
            $review
        );

        try {
            $updatedReview = $action->execute(
                $id,
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Review submitted successfully.',
                'data' => $updatedReview,
            ]);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Unable to submit the review at this time.',
            ], 500);
        }
    }

    #[OA\Post(
        path: '/api/v1/reviews/{id}/lock',
        summary: 'Lock a submitted review to prevent further edits',
        tags: ['Reviews'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer'
                )
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Review locked successfully'
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
                description: 'Review not found'
            ),
            new OA\Response(
                response: 422,
                description: 'Review already locked or not yet submitted'
            ),
            new OA\Response(
                response: 500,
                description: 'Server error'
            ),
        ]
    )]
    public function lock(
        int $id,
        LockReviewAction $action
    ): JsonResponse {
        $review = (new GetReviewAction)
            ->execute($id);

        $this->authorize(
            'lock',
            $review
        );

        try {
            $lockedReview = $action->execute(
                $id
            );

            return response()->json([
                'success' => true,
                'message' => 'Review locked successfully.',
                'data' => $lockedReview,
            ]);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Unable to lock the review at this time.',
            ], 500);
        }
    }

    #[OA\Delete(
        path: '/api/v1/reviews/{id}',
        summary: 'Remove a review assignment',
        tags: ['Reviews'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer'
                )
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Review assignment removed'
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
                description: 'Review not found'
            ),
            new OA\Response(
                response: 422,
                description: 'Cannot delete a submitted review'
            ),
            new OA\Response(
                response: 500,
                description: 'Server error'
            ),
        ]
    )]
    public function destroy(
        int $id,
        DeleteReviewAction $action
    ): JsonResponse {
        $review = (new GetReviewAction)
            ->execute($id);

        $this->authorize(
            'delete',
            $review
        );

        try {
            $action->execute(
                $id
            );

            return response()->json([
                'success' => true,
                'message' => 'Review assignment removed.',
            ]);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Unable to remove the review assignment at this time.',
            ], 500);
        }
    }
}
