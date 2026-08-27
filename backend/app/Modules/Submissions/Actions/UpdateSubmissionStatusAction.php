<?php

namespace App\Modules\Submissions\Actions;

use App\Models\User;
use App\Modules\Submissions\Models\Submission;

class UpdateSubmissionStatusAction
{
    public function execute(
        User $decisionMaker,
        Submission $submission,
        string $status
    ): Submission {
        $submission->recordDecision($decisionMaker, $status);

        return $submission->fresh([
            'author',
            'conference',
            'decisionMaker',
        ]);
    }
}