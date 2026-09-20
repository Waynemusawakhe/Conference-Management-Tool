<?php

namespace App\Modules\Account\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Account\Actions\GetUserAction;
use App\Modules\Account\Actions\GetUsersAction;
<<<<<<< HEAD
=======
use App\Modules\Account\Actions\GetReviewersAction;
>>>>>>> origin/main
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    #[OA\Get(
        path: '/api/v1/users',
        tags: ['User Management'],
        summary: 'Get all users',
        description: 'Returns a list of all users. Admin only.',
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Users retrieved successfully'),
            new OA\Response(response: 403, description: 'Forbidden — admin role required'),
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

<<<<<<< HEAD
=======
    public function reviewers(
        GetReviewersAction $action
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $action->execute(),
        ]);
    }

>>>>>>> origin/main
    #[OA\Get(
        path: '/api/v1/users/{id}',
        tags: ['User Management'],
        summary: 'Get user by ID',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'User ID',
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'User retrieved successfully'),
            new OA\Response(response: 404, description: 'User not found'),
            new OA\Response(response: 403, description: 'Forbidden — admin role required'),
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
}
