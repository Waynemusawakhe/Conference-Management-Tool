<?php

namespace App\Modules\Submissions\Actions;

use App\Modules\Submissions\Models\Submission;
use Illuminate\Support\Facades\Storage;

class DeleteSubmissionAction
{
    public function execute(Submission $submission): bool
    {
        if ($submission->file_path) {
            Storage::disk('private')->delete($submission->file_path);
        }

        return $submission->delete();
    }
}
