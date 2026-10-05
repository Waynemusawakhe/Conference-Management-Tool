<?php

namespace App\Modules\Submissions\Actions;

use App\Models\User;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetSubmissionsAction
{
    public function execute(
        User $requester,
        array $filters = []
    ): LengthAwarePaginator {
        $query = Submission::query()
            ->with([
                'author',
                'conference',
            ]);

        /*
         * Admin:
         * Can see all submissions.
         */
        if ($requester->role === 'admin') {
            // No additional ownership restriction.
        }

        /*
         * Organiser:
         * Can only see submissions belonging
         * to conferences they organise.
         */
        elseif ($requester->role === 'organiser') {
            $query->whereHas(
                'conference',
                function ($conferenceQuery) use ($requester) {
                    $conferenceQuery->where(
                        'organiser_id',
                        $requester->id
                    );
                }
            );
        }

        /*
         * Reviewer:
         * Can only see submissions assigned to them.
         */
        elseif ($requester->role === 'reviewer') {
            $query->whereHas(
                'reviews',
                function ($reviewQuery) use ($requester) {
                    $reviewQuery->where(
                        'reviewer_id',
                        $requester->id
                    );
                }
            );
        }

        /*
         * Author:
         * Can only see their own submissions.
         */
        else {
            $query->where(
                'author_id',
                $requester->id
            );
        }

        if (! empty($filters['conference_id'])) {
            $query->where(
                'conference_id',
                $filters['conference_id']
            );
        }

        if (! empty($filters['status'])) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        if (! empty($filters['track'])) {
            $query->where(
                'track',
                $filters['track']
            );
        }

        $perPage = isset($filters['per_page'])
            ? (int) $filters['per_page']
            : 15;

        $perPage = max(
            1,
            min($perPage, 100)
        );

        return $query
            ->latest()
            ->paginate($perPage);
    }
}