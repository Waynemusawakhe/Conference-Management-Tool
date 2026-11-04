<?php

namespace App\Modules\Submissions\Actions;

use App\Models\User;
use App\Notifications\CmtNotification;
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

        $submission = Submission::create([
            'conference_id' => $data['conference_id'],
            'author_id' => $author->id,
            'title' => $data['title'],
            'track' => $data['track'] ?? null,
            'abstract' => $data['abstract'],
            'file_path' => $filePath,
            'file_size_bytes' => $fileSize,
            'status' => 'pending',
        ]);

        $organiser = $submission->conference()->first()?->organiser;

        if ($organiser) {
            $organiser->notify(new CmtNotification(
                'New proposal submitted',
                $author->name.' submitted "'.$submission->title.'".',
                '/submissions/'.$submission->id,
                'proposal_submitted',
                [
                    'submission_id' => $submission->id,
                    'conference_id' => $submission->conference_id,
                    'author_id' => $author->id,
                ],
            ));
        }

        return $submission;
    }
}
