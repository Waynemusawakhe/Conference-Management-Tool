<?php

namespace App\Modules\Submissions\Actions;

use App\Modules\Submissions\Models\Submission;

class WithdrawSubmissionAction
{
    public function execute(Submission $submission): Submission
    {
        $submission->update([
            'status' => 'withdrawn',
        ]);

        return $submission->fresh();
    }
}