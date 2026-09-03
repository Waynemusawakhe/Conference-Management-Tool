<?php

namespace App\Modules\Reporting\Controllers;

use App\Modules\Reporting\Actions\GetSubmissionStatisticsAction;
use App\Modules\Reporting\Requests\ReportingFilterRequest;
use App\Http\Controllers\Controller;
use App\Modules\Reporting\Actions\GetDashboardSummaryAction;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use App\Modules\Reporting\Actions\GetReviewStatisticsAction;
use App\Modules\Reporting\Actions\GetRegistrationStatisticsAction;
use App\Modules\Reporting\Requests\RegistrationStatisticsRequest;
use App\Modules\Reporting\Actions\GetConferenceStatisticsAction;


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
    
    #[OA\Get(
    path: '/api/v1/reports/reviews',
    tags: ['Reporting'],
    summary: 'Get review statistics',
    description: 'Returns review progress and statistics including total, submitted, pending and locked reviews, average score and recommendation distribution.',
    security: [['sanctum' => []]],
    parameters: [
        new OA\Parameter(
            name: 'conference_id',
            in: 'query',
            required: false,
            description: 'Filter reviews by conference ID',
            schema: new OA\Schema(type: 'integer', minimum: 1)
        ),
        new OA\Parameter(
            name: 'date_from',
            in: 'query',
            required: false,
            description: 'Include reviews created on or after this date',
            schema: new OA\Schema(type: 'string', format: 'date')
        ),
        new OA\Parameter(
            name: 'date_to',
            in: 'query',
            required: false,
            description: 'Include reviews created on or before this date',
            schema: new OA\Schema(type: 'string', format: 'date')
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Review statistics retrieved successfully'
        ),
        new OA\Response(
            response: 401,
            description: 'Unauthenticated'
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
    public function reviews(
        ReportingFilterRequest $request,
        GetReviewStatisticsAction $getReviewStatisticsAction
    ): JsonResponse {
        $statistics = $getReviewStatisticsAction->execute($request);

        return response()->json([
            'success' => true,
            'data' => $statistics,
        ]);
    }

        #[OA\Get(
        path: '/api/v1/reports/registrations',
        tags: ['Reporting'],
        summary: 'Get registration statistics',
        description: 'Returns registration statistics with optional conference, status and date filters.',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'conference_id',
                in: 'query',
                required: false,
                description: 'Filter registrations by conference ID',
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'status',
                in: 'query',
                required: false,
                description: 'Filter registrations by status',
                schema: new OA\Schema(
                    type: 'string',
                    enum: ['registered', 'cancelled']
                )
            ),
            new OA\Parameter(
                name: 'date_from',
                in: 'query',
                required: false,
                description: 'Return registrations created on or after this date',
                schema: new OA\Schema(
                    type: 'string',
                    format: 'date'
                )
            ),
            new OA\Parameter(
                name: 'date_to',
                in: 'query',
                required: false,
                description: 'Return registrations created on or before this date',
                schema: new OA\Schema(
                    type: 'string',
                    format: 'date'
                )
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Registration statistics retrieved successfully'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden'
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error'
            ),
            new OA\Response(
                response: 500,
                description: 'Server error'
            ),
        ]
    )]
    public function registrations(
        RegistrationStatisticsRequest $request,
        GetRegistrationStatisticsAction $getRegistrationStatisticsAction
    ): JsonResponse {
        $statistics = $getRegistrationStatisticsAction->execute($request);

        return response()->json([
            'success' => true,
            'data' => $statistics,
        ]);
    }

    #[OA\Get(
    path: '/api/v1/reports/conferences',
    tags: ['Reporting'],
    summary: 'Get conference statistics',
    description: 'Returns statistics for conferences, including submission status, format and category.',
    security: [['sanctum' => []]],
    parameters: [
        new OA\Parameter(
            name: 'date_from',
            in: 'query',
            required: false,
            description: 'Filter conferences starting on or after this date.',
            schema: new OA\Schema(type: 'string', format: 'date')
        ),
        new OA\Parameter(
            name: 'date_to',
            in: 'query',
            required: false,
            description: 'Filter conferences starting on or before this date.',
            schema: new OA\Schema(type: 'string', format: 'date')
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Conference statistics retrieved successfully'
        ),
        new OA\Response(
            response: 401,
            description: 'Unauthenticated'
        ),
        new OA\Response(
            response: 422,
            description: 'Validation failed'
        ),
        new OA\Response(
            response: 500,
            description: 'Server error'
        ),
    ]
)]
public function conferences(
    ReportingFilterRequest $request,
    GetConferenceStatisticsAction $getConferenceStatisticsAction
): JsonResponse {
    $statistics = $getConferenceStatisticsAction->execute($request);

    return response()->json([
        'success' => true,
        'data' => $statistics,
    ]);
}

}