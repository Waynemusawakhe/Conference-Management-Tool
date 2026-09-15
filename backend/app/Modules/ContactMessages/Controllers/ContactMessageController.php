<?php

namespace App\Modules\ContactMessages\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ContactMessages\Actions\CreateContactMessageAction;
use App\Modules\ContactMessages\Actions\DeleteContactMessageAction;
use App\Modules\ContactMessages\Actions\GetContactMessageAction;
use App\Modules\ContactMessages\Actions\GetContactMessagesAction;
use App\Modules\ContactMessages\Actions\UpdateContactMessageStatusAction;
use App\Modules\ContactMessages\Models\ContactMessage;
use App\Modules\ContactMessages\Requests\CreateContactMessageRequest;
use App\Modules\ContactMessages\Requests\UpdateContactMessageStatusRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ContactMessageController extends Controller
{
    use AuthorizesRequests;

    #[OA\Get(
        path: '/api/v1/contact-messages',
        summary: 'Get all contact messages (admin only)',
        tags: ['Contact Messages'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', schema: new OA\Schema(type: 'string', enum: ['new', 'in_progress', 'resolved'])),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 15)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of contact messages'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function index(Request $request, GetContactMessagesAction $action): JsonResponse
    {
        $this->authorize('viewAny', ContactMessage::class);

        $filters = $request->only(['status']);
        $perPage = $request->input('per_page', 15);
        $messages = $action->execute($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => $messages->items(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
                'last_page' => $messages->lastPage(),
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/v1/contact-messages/{id}',
        summary: 'Get a specific contact message (admin only)',
        tags: ['Contact Messages'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Contact message details'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Contact message not found'),
        ]
    )]
    public function show(int $id, GetContactMessageAction $action): JsonResponse
    {
        $message = $action->execute($id);
        $this->authorize('view', $message);

        return response()->json([
            'success' => true,
            'data' => $message,
        ]);
    }

    #[OA\Post(
        path: '/api/v1/contact-messages',
        summary: 'Submit a contact message',
        tags: ['Contact Messages'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'message'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Jane Doe'),
                    new OA\Property(property: 'email', type: 'string', example: 'jane@example.com'),
                    new OA\Property(property: 'message', type: 'string', example: 'How do I register for the conference?'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Message submitted successfully'),
            new OA\Response(response: 422, description: 'Validation error'),
            new OA\Response(response: 429, description: 'Too many requests'),
        ]
    )]
    public function store(CreateContactMessageRequest $request, CreateContactMessageAction $action): JsonResponse
    {
        $data = $request->validated();
        $userId = $request->user('sanctum')?->id;

        $message = $action->execute($data, $userId);

        return response()->json([
            'success' => true,
            'message' => 'Your message has been submitted successfully.',
            'data' => $message,
        ], 201);
    }

    #[OA\Patch(
        path: '/api/v1/contact-messages/{id}/status',
        summary: 'Update a contact message status (admin only)',
        tags: ['Contact Messages'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', enum: ['new', 'in_progress', 'resolved'], example: 'resolved'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Status updated successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Contact message not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function updateStatus(UpdateContactMessageStatusRequest $request, int $id, UpdateContactMessageStatusAction $action): JsonResponse
    {
        $this->authorize('updateStatus', ContactMessage::class);

        $status = $request->validated('status');
        $message = $action->execute($id, $status);

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully.',
            'data' => $message,
        ]);
    }

    #[OA\Delete(
        path: '/api/v1/contact-messages/{id}',
        summary: 'Delete a contact message (admin only)',
        tags: ['Contact Messages'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Contact message deleted successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Contact message not found'),
        ]
    )]
    public function destroy(int $id, DeleteContactMessageAction $action): JsonResponse
    {
        $message = (new GetContactMessageAction)->execute($id);
        $this->authorize('delete', $message);

        $action->execute($id);

        return response()->json([
            'success' => true,
            'message' => 'Contact message deleted successfully.',
        ]);
    }
}