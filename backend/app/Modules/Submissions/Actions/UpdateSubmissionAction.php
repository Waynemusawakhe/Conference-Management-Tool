<?php

namespace App\Modules\Submissions\Actions;

use App\Modules\Submissions\Models\Submission;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UpdateSubmissionAction
{
    public function execute(Submission $submission, array $data, ?UploadedFile $file = null): Submission
    {
        if ($file) {
            if ($submission->file_path) {
                Storage::disk('private')->delete($submission->file_path);
            }
            $data['file_path'] = $file->store('submissions', 'private');
            $data['file_size_bytes'] = $file->getSize();
        }

        $submission->update($data);

        return $submission->fresh(['author', 'conference']);
    }
}
