<?php

namespace App\Modules\Reviews\Actions;

use App\Models\User;
use App\Modules\Reviews\Models\SubmissionReview;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetPendingReviewsAction
{
    /**
     * Review assignments the given reviewer still owes work on.
     *
     * "Pending" means assigned but not yet submitted — submitted_at is null.
     * Locked rows are excluded defensively: a locked review can never be
     * edited again, so it is never actionable even if submitted_at were null.
     */
    public function execute(User $reviewer, int $perPage = 15): LengthAwarePaginator
    {
        return SubmissionReview::query()
            ->with(['submission:id,title,abstract,track,status,conference_id', 'submission.conference:id,name,code'])
            ->where('reviewer_id', $reviewer->id)
            ->whereNull('submitted_at')
            ->where('locked', false)
            ->oldest('assigned_at')
            ->paginate($perPage);
    }
}