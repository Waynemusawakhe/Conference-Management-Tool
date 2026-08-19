<?php

namespace App\Modules\Account\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Account\Actions\RegisterUserAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Modules\Account\Actions\LoginUserAction;
use App\Modules\Account\Actions\LogoutUserAction;
use App\Modules\Account\Actions\GetCurrentUserAction;

use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/v1/auth/register',
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password'],
                properties: [
                    new OA\Property(
                        property: 'name',
                        type: 'string',
                        example: 'Test User'
                    ),
                    new OA\Property(
                        property: 'email',
                        type: 'string',
                        format: 'email',
                        example: 'test@example.com'
                    ),
                    new OA\Property(
                        property: 'password',
                        type: 'string',
                        format: 'password',
                        example: 'password123'
                    ),
                    new OA\Property(
                        property: 'role',
                        type: 'string',
                        enum: ['author', 'reviewer', 'organiser', 'attendee', 'admin'],
                        example: 'author'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'User registered successfully'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
        ]
    )]
    public function register(
        Request $request,
        RegisterUserAction $registerUserAction
    ): JsonResponse {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['nullable', 'in:author,reviewer,organiser,attendee,admin'],
        ]);

        $user = $registerUserAction->execute($data);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully.',
            'data' => [
                'user' => $user,
            ],
        ], 201);
    }

    #[OA\Post(
    path: '/api/v1/auth/login',
    summary: 'Authenticate a user',
    tags: ['Authentication'],
    requestBody: new OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['email', 'password'],
            properties: [
                new OA\Property(
                    property: 'email',
                    type: 'string',
                    format: 'email',
                    example: 'test@example.com'
                ),
                new OA\Property(
                    property: 'password',
                    type: 'string',
                    format: 'password',
                    example: 'password123'
                ),
            ]
        )
    ),
    responses: [
        new OA\Response(
            response: 200,
            description: 'Login successful'
        ),
        new OA\Response(
            response: 401,
            description: 'Invalid credentials'
        ),
    ]
        )]
        public function login(
            Request $request,
            LoginUserAction $loginUserAction
        ): JsonResponse {
            $data = $request->validate([
                'email' => ['required', 'email'],
                'password' => ['required', 'string'],
            ]);

            $result = $loginUserAction->execute($data);

            return response()->json([
                'success' => true,
                'message' => 'Login successful.',
                'data' => $result,
            ]);
        }

    #[OA\Post(
    path: '/api/v1/auth/logout',
    summary: 'Log out the current user',
    tags: ['Authentication'],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Logout successful'
        ),
    ]
    )]
    public function logout(
        LogoutUserAction $logoutUserAction
    ): JsonResponse {
        $result = $logoutUserAction->execute();

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }

    #[OA\Get(
    path: '/api/v1/auth/me',
    summary: 'Get the current authenticated user',
    tags: ['Authentication'],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Current user returned successfully'
        ),
        new OA\Response(
            response: 401,
            description: 'Unauthenticated'
        ),
    ]
    )]
    public function me(
        GetCurrentUserAction $getCurrentUserAction
    ): JsonResponse {
        $user = $getCurrentUserAction->execute();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
            ],
        ]);
    }
}