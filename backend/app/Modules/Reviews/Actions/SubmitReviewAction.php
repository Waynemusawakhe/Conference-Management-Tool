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

        $review->submit(
            (int) $data['score'],
            $data['comments'],
            $data['recommendation']
        );

        return $review->fresh(['submission', 'reviewer']);
    }
}