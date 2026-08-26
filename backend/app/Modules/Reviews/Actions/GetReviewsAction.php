<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\SubmissionReview;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetReviewsAction
{
    public function execute(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = SubmissionReview::query()->with(['submission', 'reviewer']);

        if (! empty($filters['submission_id'])) {
            $query->where('submission_id', $filters['submission_id']);
        }

        if (! empty($filters['reviewer_id'])) {
            $query->where('reviewer_id', $filters['reviewer_id']);
        }

        if (! empty($filters['recommendation'])) {
            $query->where('recommendation', $filters['recommendation']);
        }

        if (array_key_exists('locked', $filters) && $filters['locked'] !== null) {
            $query->where('locked', filter_var($filters['locked'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->latest('assigned_at')->paginate($perPage);
    }
}
