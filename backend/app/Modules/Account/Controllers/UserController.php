<?php

namespace App\Modules\Account\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Account\Actions\GetUsersAction;
use App\Modules\Account\Actions\GetUserAction;
use App\Modules\Account\Actions\CreateUserAction;
use App\Modules\Account\Requests\CreateUserRequest;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    #[OA\Get(
        path: '/api/v1/users',
        tags: ['User Management'],
        summary: 'Get all users',
        description: 'Returns a list of all users.',
        responses: [
            new OA\Response(
                response: 200,
                description: 'Users retrieved successfully'
            )
        ]
    )]
    public function index(GetUsersAction $getUsersAction): JsonResponse
    {
        $users = $getUsersAction->execute();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    #[OA\Get(
        path: '/api/v1/users/{id}',
        tags: ['User Management'],
        summary: 'Get user by ID',
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'User ID',
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User retrieved successfully'
            ),
            new OA\Response(
                response: 404,
                description: 'User not found'
            )
        ]
    )]
    public function show(int $id, GetUserAction $getUserAction): JsonResponse
    {
        $user = $getUserAction->execute($id);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    #[OA\Post(
        path: '/api/v1/users',
        tags: ['User Management'],
        summary: 'Create a user',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password', 'password_confirmation', 'role'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'John Doe'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password123'),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'password123'),
                    new OA\Property(property: 'role', type: 'string', example: 'author'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'User created successfully'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(CreateUserRequest $request, CreateUserAction $createUserAction): JsonResponse
    {
        $user = $createUserAction->execute($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'User created successfully.',
            'data' => $user,
        ], 201);
    }
}