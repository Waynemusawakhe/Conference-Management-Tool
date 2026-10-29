<?php

namespace App\Modules\Submissions\Actions;

use App\Modules\Submissions\Models\Submission;

class GetSubmissionAction
{
    public function execute(int $id): Submission
    {
        return Submission::with(['author', 'conference', 'reviews', 'decisionMaker'])
            ->findOrFail($id);
    }
}
