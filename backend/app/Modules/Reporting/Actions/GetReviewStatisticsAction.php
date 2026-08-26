<?php

namespace App\Modules\Reporting\Actions;

use App\Modules\Reporting\Requests\ReportingFilterRequest;
use App\Modules\Reviews\Models\SubmissionReview;

class GetReviewStatisticsAction
{
    /**
     * Calculate review statistics from the actual
     * submission_reviews database records.
     */
    public function execute(ReportingFilterRequest $request): array
    {
        // Start with all reviews.
        $query = SubmissionReview::query();

        /*
         * Filter reviews by conference.
         *
         * submission_reviews does not have a conference_id column.
         * We therefore filter through the submission relationship:
         *
         * submission_reviews
         *        ↓ submission_id
         * submissions
         *        ↓ conference_id
         * conferences
         */
        if ($request->filled('conference_id')) {
            $query->whereHas('submission', function ($submissionQuery) use ($request) {
                $submissionQuery->where(
                    'conference_id',
                    $request->integer('conference_id')
                );
            });
        }

        /*
         * Filter by the date the review record was created.
         */
        if ($request->filled('date_from')) {
            $query->whereDate(
                'created_at',
                '>=',
                $request->input('date_from')
            );
        }

        if ($request->filled('date_to')) {
            $query->whereDate(
                'created_at',
                '<=',
                $request->input('date_to')
            );
        }

        /*
         * Total number of reviews after applying filters.
         */
        $totalReviews = (clone $query)->count();

        /*
         * A review is considered submitted when submitted_at
         * contains a timestamp.
         */
        $submittedReviews = (clone $query)
            ->whereNotNull('submitted_at')
            ->count();

        /*
         * A review is considered pending when it has not
         * yet been submitted.
         */
        $pendingReviews = (clone $query)
            ->whereNull('submitted_at')
            ->count();

        /*
         * Count reviews that have been locked.
         *
         * According to the existing Review model and database
         * schema, locked is a boolean field.
         */
        $lockedReviews = (clone $query)
            ->where('locked', true)
            ->count();

        /*
         * Calculate the average score.
         *
         * PostgreSQL automatically ignores NULL scores when
         * calculating AVG().
         */
        $averageScore = (clone $query)->avg('score');

        /*
         * Count each valid recommendation.
         *
         * The approved database values are:
         * accept | reject | revise
         */
        $recommendations = [
            'accept' => (clone $query)
                ->where('recommendation', 'accept')
                ->count(),

            'reject' => (clone $query)
                ->where('recommendation', 'reject')
                ->count(),

            'revise' => (clone $query)
                ->where('recommendation', 'revise')
                ->count(),
        ];

        /*
         * Calculate the percentage of reviews that have
         * been submitted.
         *
         * Protect against division by zero when there
         * are no reviews.
         */
        $completionPercentage = $totalReviews > 0
            ? round(($submittedReviews / $totalReviews) * 100, 2)
            : 0;

        return [
            'total_reviews' => $totalReviews,
            'submitted_reviews' => $submittedReviews,
            'pending_reviews' => $pendingReviews,
            'locked_reviews' => $lockedReviews,
            'completion_percentage' => $completionPercentage,
            'average_score' => $averageScore !== null
                ? round((float) $averageScore, 2)
                : null,
            'recommendations' => $recommendations,
        ];
    }
}