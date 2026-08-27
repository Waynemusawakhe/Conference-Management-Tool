<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\SubmissionReview;
use Illuminate\Validation\ValidationException;

class DeleteReviewAction
{
    public function execute(int $id): void
    {
        $review = SubmissionReview::findOrFail($id);

        if ($review->locked) {
            throw ValidationException::withMessages([
                'locked' => 'A submitted review cannot be deleted.',
            ]);
        }

        $review->delete();
    }
}
