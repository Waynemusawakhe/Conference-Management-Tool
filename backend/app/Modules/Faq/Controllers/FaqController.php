<?php

namespace App\Modules\Faq\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Faq\Actions\CreateFaqAction;
use App\Modules\Faq\Actions\DeleteFaqAction;
use App\Modules\Faq\Actions\GetFaqAction;
use App\Modules\Faq\Actions\GetFaqsAction;
use App\Modules\Faq\Actions\UpdateFaqAction;
use App\Modules\Faq\Models\Faq;
use App\Modules\Faq\Requests\CreateFaqRequest;
use App\Modules\Faq\Requests\UpdateFaqRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class FaqController extends Controller
{
    use AuthorizesRequests;

    #[OA\Get(
        path: '/api/v1/faqs',
        summary: 'Get all FAQs',
        tags: ['FAQs'],
        parameters: [
            new OA\Parameter(name: 'category', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 15)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of FAQs'),
        ]
    )]
    public function index(Request $request, GetFaqsAction $action): JsonResponse
    {
        $filters = $request->only(['category']);
        $perPage = $request->input('per_page', 15);

        $faqs = $action->execute($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => $faqs->items(),
            'meta' => [
                'current_page' => $faqs->currentPage(),
                'per_page' => $faqs->perPage(),
                'total' => $faqs->total(),
                'last_page' => $faqs->lastPage(),
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/v1/faqs/{id}',
        summary: 'Get a specific FAQ',
        tags: ['FAQs'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'FAQ details'),
            new OA\Response(response: 404, description: 'FAQ not found'),
        ]
    )]
    public function show(int $id, GetFaqAction $action): JsonResponse
    {
        $faq = $action->execute($id);

        return response()->json([
            'success' => true,
            'data' => $faq,
        ]);
    }

    #[OA\Post(
        path: '/api/v1/faqs',
        summary: 'Create a new FAQ',
        tags: ['FAQs'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['question', 'answer'],
                properties: [
                    new OA\Property(property: 'question', type: 'string', example: 'How do I register?'),
                    new OA\Property(property: 'answer', type: 'string', example: 'Go to the Registration tab and follow the steps.'),
                    new OA\Property(property: 'category', type: 'string', example: 'Registration'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'FAQ created successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(CreateFaqRequest $request, CreateFaqAction $action): JsonResponse
    {
        $this->authorize('create', Faq::class);

        $data = $request->validated();
        $faq = $action->execute($data);

        return response()->json([
            'success' => true,
            'message' => 'FAQ created successfully.',
            'data' => $faq,
        ], 201);
    }

    #[OA\Put(
        path: '/api/v1/faqs/{id}',
        summary: 'Update an FAQ',
        tags: ['FAQs'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'question', type: 'string', example: 'How do I register?'),
                    new OA\Property(property: 'answer', type: 'string', example: 'Go to the Registration tab and follow the steps.'),
                    new OA\Property(property: 'category', type: 'string', example: 'Registration'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'FAQ updated successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'FAQ not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function update(UpdateFaqRequest $request, int $id, UpdateFaqAction $action): JsonResponse
    {
        $this->authorize('update', Faq::class);

        $data = $request->validated();
        $faq = $action->execute($id, $data);

        return response()->json([
            'success' => true,
            'message' => 'FAQ updated successfully.',
            'data' => $faq,
        ]);
    }

    #[OA\Delete(
        path: '/api/v1/faqs/{id}',
        summary: 'Delete an FAQ',
        tags: ['FAQs'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'FAQ deleted successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'FAQ not found'),
        ]
    )]
    public function destroy(int $id, DeleteFaqAction $action): JsonResponse
    {
        $this->authorize('delete', Faq::class);

        $action->execute($id);

        return response()->json([
            'success' => true,
            'message' => 'FAQ deleted successfully.',
        ]);
    }
}