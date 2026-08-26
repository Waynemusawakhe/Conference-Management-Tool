<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\SubmissionReview;
use Illuminate\Validation\ValidationException;

class SubmitReviewAction
{
    public function execute(int $id, array $data): SubmissionReview
    {
        $review = SubmissionReview::findOrFail($id);

        if ($review->locked) {
            throw ValidationException::withMessages([
                'locked' => 'This review is locked and can no longer be edited.',
            ]);
        }

        $review->score = $data['score'];
        $review->comments = $data['comments'];
        $review->recommendation = $data['recommendation'];
        $review->submitted_at = now();
        $review->save();

        return $review->fresh(['submission', 'reviewer']);
    }
}
