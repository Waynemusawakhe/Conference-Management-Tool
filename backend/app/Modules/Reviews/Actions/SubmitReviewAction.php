<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\SubmissionReview;
use App\Notifications\CmtNotification;
use Illuminate\Validation\ValidationException;

class SubmitReviewAction
{
    public function execute(
        int $id,
        array $data
    ): SubmissionReview {
        $review = SubmissionReview::findOrFail(
            $id
        );

        if ($review->locked) {
            throw ValidationException::withMessages([
                'locked' => 'This review is locked and can no longer be edited.',
            ]);
        }

        $isFirstSubmission =
            is_null($review->submitted_at);

        $review->submit(
            (int) $data['score'],
            $data['comments'],
            $data['recommendation']
        );

        $review = $review->fresh([
            'submission.author',
            'reviewer',
        ]);

        /*
         * Notify only on the first submission.
         * Reviewers may edit/resubmit until the review is explicitly
         * locked, so repeat submissions should not generate duplicate
         * "review submitted" notifications.
         */
        if ($isFirstSubmission) {
            $author =
                $review->submission?->author;

            if ($author) {
                $author->notify(
                    new CmtNotification(
                        'Proposal reviewed',
                        'A reviewer has submitted a review for "'.
                            $review->submission->title.
                            '".',
                        '/author-dashboard',
                        'proposal_reviewed',
                        [
                            'submission_id' => $review->submission_id,
                            'review_id' => $review->id,
                        ],
                    )
                );
            }
        }

        return $review;
    }
}
