<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\SubmissionReview;
use Illuminate\Validation\ValidationException;

class LockReviewAction
{
    public function execute(int $id): SubmissionReview
    {
        $review = SubmissionReview::findOrFail($id);

        if ($review->locked) {
            throw ValidationException::withMessages([
                'locked' => 'This review is already locked.',
            ]);
        }

        if (is_null($review->submitted_at)) {
            throw ValidationException::withMessages([
                'submitted_at' => 'This review must be submitted before it can be locked.',
            ]);
        }

        $review->locked = true;
        $review->save();

        return $review->fresh(['submission', 'reviewer']);
    }
}
