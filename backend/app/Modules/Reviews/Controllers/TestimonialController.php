<?php

namespace App\Modules\Reviews\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reviews\Actions\CreateTestimonialAction;
use App\Modules\Reviews\Actions\DeleteTestimonialAction;
use App\Modules\Reviews\Actions\GetTestimonialAction;
use App\Modules\Reviews\Actions\GetTestimonialsAction;
use App\Modules\Reviews\Actions\UpdateTestimonialAction;
use App\Modules\Reviews\Requests\CreateTestimonialRequest;
use App\Modules\Reviews\Requests\UpdateTestimonialRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class TestimonialController extends Controller
{
    #[OA\Get(
        path: '/api/v1/testimonials',
        tags: ['Testimonials'],
        summary: 'Get all testimonials',
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Testimonials retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(GetTestimonialsAction $action): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $action->execute(),
        ]);
    }

    #[OA\Get(
        path: '/api/v1/testimonials/{id}',
        tags: ['Testimonials'],
        summary: 'Get testimonial by ID',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Testimonial ID',
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Testimonial retrieved successfully'),
            new OA\Response(response: 404, description: 'Testimonial not found'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function show(int $id, GetTestimonialAction $action): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $action->execute($id),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/testimonials',
        tags: ['Testimonials'],
        summary: 'Create a testimonial',
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['conference_id', 'rating', 'content'],
                properties: [
                    new OA\Property(
                        property: 'conference_id',
                        type: 'integer',
                        example: 1
                    ),
                    new OA\Property(
                        property: 'rating',
                        type: 'integer',
                        minimum: 1,
                        maximum: 5,
                        example: 5
                    ),
                    new OA\Property(
                        property: 'content',
                        type: 'string',
                        example: 'Excellent conference.'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Testimonial created successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(
        CreateTestimonialRequest $request,
        CreateTestimonialAction $action
    ): JsonResponse {
        $testimonial = $action->execute([
            'user_id' => $request->user()->id,
            ...$request->validated(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Testimonial created successfully.',
            'data' => $testimonial,
        ], 201);
    }

    #[OA\Put(
        path: '/api/v1/testimonials/{id}',
        tags: ['Testimonials'],
        summary: 'Update a testimonial',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Testimonial ID',
                schema: new OA\Schema(type: 'integer')
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['rating', 'content'],
                properties: [
                    new OA\Property(
                        property: 'rating',
                        type: 'integer',
                        minimum: 1,
                        maximum: 5,
                        example: 4
                    ),
                    new OA\Property(
                        property: 'content',
                        type: 'string',
                        example: 'Very good conference.'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Testimonial updated successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Testimonial not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function update(
        int $id,
        UpdateTestimonialRequest $request,
        GetTestimonialAction $getAction,
        UpdateTestimonialAction $updateAction
    ): JsonResponse {
        $testimonial = $getAction->execute($id);

        if ($testimonial->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to update this testimonial.',
            ], 403);
        }

        $testimonial = $updateAction->execute(
            $testimonial,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Testimonial updated successfully.',
            'data' => $testimonial,
        ]);
    }

    #[OA\Delete(
        path: '/api/v1/testimonials/{id}',
        tags: ['Testimonials'],
        summary: 'Delete a testimonial',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Testimonial ID',
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Testimonial deleted successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Testimonial not found'),
        ]
    )]


    public function destroy(
        int $id,
        Request $request,
        GetTestimonialAction $getAction,
        DeleteTestimonialAction $deleteAction
    ): JsonResponse {
        $testimonial = $getAction->execute($id);

        if ($testimonial->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this testimonial.',
            ], 403);
        }

        $deleteAction->execute($testimonial);

        return response()->json([
            'success' => true,
            'message' => 'Testimonial deleted successfully.',
        ]);
    }
}