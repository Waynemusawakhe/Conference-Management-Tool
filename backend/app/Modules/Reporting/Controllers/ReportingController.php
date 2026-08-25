<?php

namespace App\Modules\Reporting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\GetDashboardSummaryAction;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class ReportingController extends Controller
{
    #[OA\Get(
        path: '/api/v1/reports/dashboard',
        tags: ['Reporting'],
        summary: 'Get dashboard summary',
        description: 'Returns summary statistics for users, conferences, submissions, reviews and registrations.',
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Dashboard statistics retrieved successfully'
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden'
            ),
            new OA\Response(
                response: 500,
                description: 'Server error'
            ),
        ]
    )]
    public function dashboard(
        GetDashboardSummaryAction $getDashboardSummaryAction
    ): JsonResponse {
        $summary = $getDashboardSummaryAction->execute();

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }
}