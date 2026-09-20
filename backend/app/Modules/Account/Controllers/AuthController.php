<?php

namespace App\Modules\Account\Controllers;

use App\Http\Controllers\Controller;
<<<<<<< HEAD
use App\Module\Account\Requests\ResetPasswordRequest;
=======
use App\Modules\Account\Actions\ChangePasswordAction;
>>>>>>> origin/main
use App\Modules\Account\Actions\CreateUserAction;
use App\Modules\Account\Actions\ForgotPasswordAction;
use App\Modules\Account\Actions\LoginAction;
use App\Modules\Account\Actions\LogoutAction;
use App\Modules\Account\Actions\ResetPasswordAction;
<<<<<<< HEAD
use App\Modules\Account\Requests\CreateUserRequest;
use App\Modules\Account\Requests\ForgotPasswordRequest;
use App\Modules\Account\Requests\LoginRequest;
// use Illuminate\Support\Facades\Password;
=======
use App\Modules\Account\Actions\UpdateProfileAction;
use App\Modules\Account\Requests\ChangePasswordRequest;
use App\Modules\Account\Requests\CreateUserRequest;
use App\Modules\Account\Requests\ForgotPasswordRequest;
use App\Modules\Account\Requests\LoginRequest;
use App\Modules\Account\Requests\ResetPasswordRequest;
use App\Modules\Account\Requests\UpdateProfileRequest;
>>>>>>> origin/main
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/v1/auth/register',
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
<<<<<<< HEAD
                required: ['name', 'email', 'password', 'password_confirmation', 'role'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'John Doe'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password123'),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'password123'),
                    new OA\Property(property: 'role', type: 'string', example: 'author'),
=======
                required: [
                    'name',
                    'email',
                    'password',
                    'password_confirmation',
                    'role',
                ],
                properties: [
                    new OA\Property(
                        property: 'name',
                        type: 'string',
                        example: 'John Doe'
                    ),
                    new OA\Property(
                        property: 'email',
                        type: 'string',
                        format: 'email',
                        example: 'john@example.com'
                    ),
                    new OA\Property(
                        property: 'password',
                        type: 'string',
                        format: 'password',
                        example: 'Password123'
                    ),
                    new OA\Property(
                        property: 'password_confirmation',
                        type: 'string',
                        format: 'password',
                        example: 'Password123'
                    ),
                    new OA\Property(
                        property: 'role',
                        type: 'string',
                        example: 'author'
                    ),
>>>>>>> origin/main
                ]
            )
        ),
        responses: [
<<<<<<< HEAD
            new OA\Response(response: 201, description: 'User registered successfully'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function register(CreateUserRequest $request, CreateUserAction $createUserAction): JsonResponse
    {
=======
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
        CreateUserRequest $request,
        CreateUserAction $createUserAction
    ): JsonResponse {
>>>>>>> origin/main
        $user = $createUserAction->execute($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully.',
            'data' => $user,
        ], 201);
    }

    #[OA\Post(
        path: '/api/v1/auth/login',
        tags: ['Authentication'],
        summary: 'Log in and receive an API token',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
<<<<<<< HEAD
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password123'),
=======
                    new OA\Property(
                        property: 'email',
                        type: 'string',
                        format: 'email',
                        example: 'john@example.com'
                    ),
                    new OA\Property(
                        property: 'password',
                        type: 'string',
                        format: 'password',
                        example: 'Password123'
                    ),
>>>>>>> origin/main
                ]
            )
        ),
        responses: [
<<<<<<< HEAD
            new OA\Response(response: 200, description: 'Login successful'),
            new OA\Response(response: 401, description: 'Invalid credentials'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function login(LoginRequest $request, LoginAction $loginAction): JsonResponse
    {
=======
            new OA\Response(
                response: 200,
                description: 'Login successful'
            ),
            new OA\Response(
                response: 401,
                description: 'Invalid credentials'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
        ]
    )]
    public function login(
        LoginRequest $request,
        LoginAction $loginAction
    ): JsonResponse {
>>>>>>> origin/main
        $result = $loginAction->execute($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => $result['user'],
                'token' => $result['token'],
                'token_type' => 'Bearer',
            ],
        ]);
    }

    #[OA\Post(
        path: '/api/v1/auth/logout',
        tags: ['Authentication'],
        summary: 'Revoke the current API token',
        security: [['sanctum' => []]],
        responses: [
<<<<<<< HEAD
            new OA\Response(response: 200, description: 'Logged out successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function logout(Request $request, LogoutAction $logoutAction): JsonResponse
    {
=======
            new OA\Response(
                response: 200,
                description: 'Logged out successfully'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
        ]
    )]
    public function logout(
        Request $request,
        LogoutAction $logoutAction
    ): JsonResponse {
>>>>>>> origin/main
        $logoutAction->execute($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    #[OA\Get(
        path: '/api/v1/auth/me',
        tags: ['Authentication'],
        summary: 'Get the currently authenticated user',
        security: [['sanctum' => []]],
        responses: [
<<<<<<< HEAD
            new OA\Response(response: 200, description: 'Authenticated user returned'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
=======
            new OA\Response(
                response: 200,
                description: 'Authenticated user returned'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
>>>>>>> origin/main
        ]
    )]
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $request->user(),
        ]);
    }

<<<<<<< HEAD
=======
    #[OA\Patch(
        path: '/api/v1/auth/me',
        tags: ['Authentication'],
        summary: 'Update the authenticated user profile',
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'name',
                        type: 'string',
                        example: 'John Smith'
                    ),
                    new OA\Property(
                        property: 'email',
                        type: 'string',
                        format: 'email',
                        example: 'john.smith@example.com'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Profile updated successfully'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
        ]
    )]
    public function updateProfile(
        UpdateProfileRequest $request,
        UpdateProfileAction $action
    ): JsonResponse {
        $user = $action->execute(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => $user,
        ]);
    }

    #[OA\Put(
        path: '/api/v1/auth/password',
        tags: ['Authentication'],
        summary: 'Change the authenticated user password',
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [
                    'current_password',
                    'password',
                    'password_confirmation',
                ],
                properties: [
                    new OA\Property(
                        property: 'current_password',
                        type: 'string',
                        format: 'password',
                        example: 'OldPassword123'
                    ),
                    new OA\Property(
                        property: 'password',
                        type: 'string',
                        format: 'password',
                        example: 'NewPassword123'
                    ),
                    new OA\Property(
                        property: 'password_confirmation',
                        type: 'string',
                        format: 'password',
                        example: 'NewPassword123'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Password changed successfully'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
        ]
    )]
    public function changePassword(
        ChangePasswordRequest $request,
        ChangePasswordAction $action
    ): JsonResponse {
        $action->execute(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }

>>>>>>> origin/main
    #[OA\Post(
        path: '/api/v1/auth/forgot-password',
        tags: ['Authentication'],
        summary: 'Send a password reset link',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email'],
                properties: [
                    new OA\Property(
                        property: 'email',
                        type: 'string',
                        format: 'email',
                        example: 'john@example.com'
                    ),
                ]
            )
        ),
        responses: [
<<<<<<< HEAD
            new OA\Response(response: 200, description: 'Password reset link sent'),
            new OA\Response(response: 422, description: 'Validation error'),
=======
            new OA\Response(
                response: 200,
                description: 'Password reset link sent'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
>>>>>>> origin/main
        ]
    )]
    public function forgotPassword(
        ForgotPasswordRequest $request,
        ForgotPasswordAction $forgotPasswordAction
    ): JsonResponse {
<<<<<<< HEAD
        $result = $forgotPasswordAction->execute($request->validated());

        return response()->json([
            'success' => true,
            'message' => $result['message'] ?? 'Password reset link sent successfully.',
=======
        $result = $forgotPasswordAction->execute(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => $result['message']
                ?? 'Password reset link sent successfully.',
>>>>>>> origin/main
        ]);
    }

    #[OA\Post(
        path: '/api/v1/auth/reset-password',
        tags: ['Authentication'],
        summary: 'Reset the user password',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
<<<<<<< HEAD
                required: ['token', 'email', 'password', 'password_confirmation'],
=======
                required: [
                    'token',
                    'email',
                    'password',
                    'password_confirmation',
                ],
>>>>>>> origin/main
                properties: [
                    new OA\Property(
                        property: 'token',
                        type: 'string',
                        example: 'reset-token-here'
                    ),
                    new OA\Property(
                        property: 'email',
                        type: 'string',
                        format: 'email',
                        example: 'john@example.com'
                    ),
                    new OA\Property(
                        property: 'password',
                        type: 'string',
                        format: 'password',
                        example: 'NewPassword123'
                    ),
                    new OA\Property(
                        property: 'password_confirmation',
                        type: 'string',
                        format: 'password',
                        example: 'NewPassword123'
                    ),
                ]
            )
        ),
        responses: [
<<<<<<< HEAD
            new OA\Response(response: 200, description: 'Password reset successfully'),
            new OA\Response(response: 422, description: 'Validation error'),
=======
            new OA\Response(
                response: 200,
                description: 'Password reset successfully'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
>>>>>>> origin/main
        ]
    )]
    public function resetPassword(
        ResetPasswordRequest $request,
        ResetPasswordAction $resetPasswordAction
    ): JsonResponse {
<<<<<<< HEAD
        $result = $resetPasswordAction->execute($request->validated());

        return response()->json([
            'success' => true,
            'message' => $result['message'] ?? 'Password reset successfully.',
        ]);
    }
}
=======
        $result = $resetPasswordAction->execute(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => $result['message']
                ?? 'Password reset successfully.',
        ]);
    }
}
>>>>>>> origin/main
