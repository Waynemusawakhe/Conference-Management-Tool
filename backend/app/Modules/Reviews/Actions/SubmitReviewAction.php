<?php

namespace App\Modules\Reviews\Actions;

use App\Notifications\CmtNotification;
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

        $review = $review->fresh(['submission.author', 'reviewer']);
        $author = $review->submission?->author;

        if ($author) {
            $actionUrl = $author->role === 'attendee'
                ? '/attendee-proposals'
                : '/author-dashboard';

            $author->notify(new CmtNotification(
                'Proposal reviewed',
                'A reviewer has submitted a review for "'.$review->submission->title.'".',
                $actionUrl,
                'proposal_reviewed',
                [
                    'submission_id' => $review->submission_id,
                    'review_id' => $review->id,
                ],
            ));
        }

        return $review;
    }
}