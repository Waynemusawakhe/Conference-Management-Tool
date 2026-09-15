<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\SubmissionReview;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;

class CreateReviewAction
{
    public function execute(array $data): SubmissionReview
    {
        try {
            $data['assigned_at'] = $data['assigned_at'] ?? now();

            $review = SubmissionReview::create($data);
            $review->load(['submission', 'reviewer']);

            return $review;
        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE') || str_contains($e->getMessage(), 'Duplicate entry')) {
                throw ValidationException::withMessages([
                    'reviewer_id' => 'This reviewer is already assigned to this submission.',
                ]);
            }
            throw $e;
        }
    }
}
