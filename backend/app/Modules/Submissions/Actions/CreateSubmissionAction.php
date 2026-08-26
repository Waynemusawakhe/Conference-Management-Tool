<?php

namespace App\Modules\Submissions\Actions;

use App\Models\User;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Http\UploadedFile;

class CreateSubmissionAction
{
    public function execute(User $author, array $data, ?UploadedFile $file = null): Submission
    {
        $filePath = null;
        $fileSize = null;

        if ($file) {
            $filePath = $file->store('submissions', 'private');
            $fileSize = $file->getSize();
        }

        return Submission::create([
            'conference_id' => $data['conference_id'],
            'author_id' => $author->id,
            'title' => $data['title'],
            'track' => $data['track'] ?? null,
            'abstract' => $data['abstract'],
            'file_path' => $filePath,
            'file_size_bytes' => $fileSize,
            'status' => 'pending',
        ]);
    }
}
