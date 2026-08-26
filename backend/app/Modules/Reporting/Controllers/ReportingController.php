<?php

namespace App\Modules\Reporting\Controllers;

use App\Modules\Reporting\Actions\GetSubmissionStatisticsAction;
use App\Modules\Reporting\Requests\ReportingFilterRequest;
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
    #[OA\Get(
    path: '/api/v1/reports/submissions',
    tags: ['Reporting'],
    summary: 'Get submission statistics',
    description: 'Returns submission statistics grouped by status with optional conference, status and date range filters.',
    security: [['sanctum' => []]],
    parameters: [
        new OA\Parameter(
            name: 'conference_id',
            in: 'query',
            required: false,
            description: 'Filter submissions by conference ID',
            schema: new OA\Schema(type: 'integer')
        ),
        new OA\Parameter(
            name: 'status',
            in: 'query',
            required: false,
            description: 'Filter submissions by status',
            schema: new OA\Schema(
                type: 'string',
                enum: [
                    'pending',
                    'under_review',
                    'accepted',
                    'rejected',
                    'revision_requested'
                ]
            )
        ),
        new OA\Parameter(
            name: 'date_from',
            in: 'query',
            required: false,
            description: 'Return submissions created on or after this date',
            schema: new OA\Schema(
                type: 'string',
                format: 'date'
            )
        ),
        new OA\Parameter(
            name: 'date_to',
            in: 'query',
            required: false,
            description: 'Return submissions created on or before this date',
            schema: new OA\Schema(
                type: 'string',
                format: 'date'
            )
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Submission statistics retrieved successfully'
        ),
        new OA\Response(
            response: 403,
            description: 'Forbidden'
        ),
        new OA\Response(
            response: 422,
            description: 'Validation error'
        ),
    ]
)]
public function submissions(
    ReportingFilterRequest $request,
    GetSubmissionStatisticsAction $getSubmissionStatisticsAction
): JsonResponse {
    $statistics = $getSubmissionStatisticsAction->execute($request);

    return response()->json([
        'success' => true,
        'data' => $statistics,
    ]);
}
}