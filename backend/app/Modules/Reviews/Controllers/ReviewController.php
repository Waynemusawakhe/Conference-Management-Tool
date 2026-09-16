<?php

namespace App\Modules\Reviews\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reviews\Actions\CreateReviewAction;
use App\Modules\Reviews\Actions\DeleteReviewAction;
use App\Modules\Reviews\Actions\GetReviewAction;
use App\Modules\Reviews\Actions\GetReviewsAction;
use App\Modules\Reviews\Actions\LockReviewAction;
use App\Modules\Reviews\Actions\SubmitReviewAction;
use App\Modules\Reviews\Models\SubmissionReview;
use App\Modules\Reviews\Requests\CreateReviewRequest;
use App\Modules\Reviews\Requests\SubmitReviewRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ReviewController extends Controller
{
    use AuthorizesRequests;

    #[OA\Get(
        path: '/api/v1/reviews',
        summary: 'Get all reviews',
        tags: ['Reviews'],
        parameters: [
            new OA\Parameter(name: 'submission_id', in: 'query', schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'reviewer_id', in: 'query', schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'recommendation', in: 'query', schema: new OA\Schema(type: 'string', enum: ['accept', 'reject', 'revise'])),
            new OA\Parameter(name: 'locked', in: 'query', schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 15)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of reviews'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(Request $request, GetReviewsAction $action): JsonResponse
    {
        $this->authorize('viewAny', SubmissionReview::class);

        $filters = $request->only(['submission_id', 'reviewer_id', 'recommendation', 'locked']);
        $perPage = $request->input('per_page', 15);

        $reviews = $action->execute($filters, $perPage);

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

    #[OA\Get(
        path: '/api/v1/reviews/{id}',
        summary: 'Get a specific review',
        tags: ['Reviews'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Review details'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Review not found'),
        ]
    )]
    public function show(int $id, GetReviewAction $action): JsonResponse
    {
        $review = $action->execute($id);
        $this->authorize('view', $review);

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
                required: ['submission_id', 'reviewer_id'],
                properties: [
                    new OA\Property(property: 'submission_id', type: 'integer', example: 1),
                    new OA\Property(property: 'reviewer_id', type: 'integer', example: 1),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Reviewer assigned successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 422, description: 'Validation error'),
            new OA\Response(response: 409, description: 'Reviewer already assigned to this submission'),
        ]
    )]
    public function store(CreateReviewRequest $request, CreateReviewAction $action): JsonResponse
    {
        $this->authorize('create', SubmissionReview::class);

        $data = $request->validated();

        try {
            $review = $action->execute($data);

            return response()->json([
                'success' => true,
                'message' => 'Reviewer assigned successfully.',
                'data' => $review,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign reviewer.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    #[OA\Post(
        path: '/api/v1/reviews/{id}/submit',
        summary: 'Submit a review (score, comments, recommendation)',
        tags: ['Reviews'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['score', 'comments', 'recommendation'],
                properties: [
                    new OA\Property(property: 'score', type: 'integer', example: 8),
                    new OA\Property(property: 'comments', type: 'string', example: 'Solid methodology, needs more related work.'),
                    new OA\Property(property: 'recommendation', type: 'string', enum: ['accept', 'reject', 'revise'], example: 'revise'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Review submitted successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Review not found'),
            new OA\Response(response: 422, description: 'Validation error or review already locked'),
        ]
    )]
    public function submit(SubmitReviewRequest $request, int $id, SubmitReviewAction $action): JsonResponse
    {
        $review = (new GetReviewAction)->execute($id);
        $this->authorize('submit', $review);

        $data = $request->validated();

        try {
            $updatedReview = $action->execute($id, $data);

            return response()->json([
                'success' => true,
                'message' => 'Review submitted successfully.',
                'data' => $updatedReview,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit review.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    #[OA\Post(
        path: '/api/v1/reviews/{id}/lock',
        summary: 'Lock a submitted review to prevent further edits',
        tags: ['Reviews'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Review locked successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Review not found'),
            new OA\Response(response: 422, description: 'Review already locked or not yet submitted'),
        ]
    )]
    public function lock(int $id, LockReviewAction $action): JsonResponse
    {
        $review = (new GetReviewAction)->execute($id);
        $this->authorize('lock', $review);

        try {
            $lockedReview = $action->execute($id);

            return response()->json([
                'success' => true,
                'message' => 'Review locked successfully.',
                'data' => $lockedReview,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to lock review.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    #[OA\Delete(
        path: '/api/v1/reviews/{id}',
        summary: 'Remove a review assignment',
        tags: ['Reviews'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Review assignment removed'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Review not found'),
            new OA\Response(response: 422, description: 'Cannot delete a submitted review'),
        ]
    )]
    public function destroy(int $id, DeleteReviewAction $action): JsonResponse
    {
        $review = (new GetReviewAction)->execute($id);
        $this->authorize('delete', $review);

        try {
            $action->execute($id);

            return response()->json([
                'success' => true,
                'message' => 'Review assignment removed.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove review assignment.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
