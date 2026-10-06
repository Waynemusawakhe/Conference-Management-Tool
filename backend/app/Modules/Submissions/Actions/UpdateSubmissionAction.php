<?php

namespace App\Modules\Submissions\Actions;

use App\Modules\Submissions\Models\Submission;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class UpdateSubmissionAction
{
    public function execute(
        Submission $submission,
        array $data,
        ?UploadedFile $file = null
    ): Submission {
        $oldFilePath = $submission->file_path;
        $newFilePath = null;

        try {
            if ($file) {
                /*
                 * Store the replacement first. The current file remains
                 * untouched until the new file and database update both
                 * succeed.
                 */
                $newFilePath = $file->store(
                    'submissions',
                    'private'
                );

                if (! $newFilePath) {
                    throw new RuntimeException(
                        'Unable to store the replacement submission file.'
                    );
                }

                $data['file_path'] = $newFilePath;
                $data['file_size_bytes'] = $file->getSize();
            }

            DB::transaction(
                function () use (
                    $submission,
                    $data
                ): void {
                    $submission->updateOrFail(
                        $data
                    );
                }
            );
        } catch (Throwable $exception) {
            /*
             * If the replacement was stored but the database update
             * failed, remove the new orphan file and leave the old
             * submission document untouched.
             */
            if ($newFilePath) {
                Storage::disk('private')
                    ->delete($newFilePath);
            }

            throw $exception;
        }

        /*
         * Only remove the previous file after the replacement and the
         * database update have succeeded.
         */
        if (
            $file
            && $oldFilePath
            && $oldFilePath !== $newFilePath
        ) {
            Storage::disk('private')
                ->delete($oldFilePath);
        }

        return $submission->fresh([
            'author',
            'conference',
        ]);
    }
}
