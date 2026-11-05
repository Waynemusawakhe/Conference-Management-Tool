<?php

namespace App\Modules\Submissions\Actions;

use App\Models\User;
use App\Notifications\CmtNotification;
use App\Modules\Submissions\Models\Submission;

class UpdateSubmissionStatusAction
{
    public function execute(
        User $decisionMaker,
        Submission $submission,
        string $status
    ): Submission {
        $previousStatus = $submission->status;

        $submission->recordDecision($decisionMaker, $status);

        /*
         * A decision is meaningful to the author, but repeat submissions of
         * the same decision must not fill their notification inbox.
         */
        if ($previousStatus !== $status) {
            $labels = [
                'accepted' => 'accepted',
                'rejected' => 'not accepted',
                'revision_requested' => 'returned for revision',
            ];

            $submission->author?->notify(new CmtNotification(
                title: 'Submission decision recorded',
                message: sprintf(
                    'Your submission "%s" has been %s.',
                    $submission->title,
                    $labels[$status]
                ),
                actionUrl: '/author-dashboard#my-proposals',
                kind: 'submission_decision',
                metadata: [
                    'submission_id' => $submission->id,
                    'conference_id' => $submission->conference_id,
                    'status' => $status,
                ],
            ));
        }

        return $submission->fresh([
            'author',
            'conference',
            'decisionMaker',
        ]);
    }
}
