<?php

namespace App\Modules\Account\Actions;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class DeleteAccountAction
{
    public function execute(
        User $user,
        array $data
    ): void {
        if (! Hash::check(
            $data['current_password'],
            $user->password
        )) {
            throw ValidationException::withMessages([
                'current_password' =>
                    'The current password is incorrect.',
            ]);
        }

        /*
         * Conferences deliberately use RESTRICT on organiser_id.
         * We do not silently destroy conferences when their
         * organiser deletes their account.
         */
        $ownedConferenceCount =
            Conference::query()
                ->where(
                    'organiser_id',
                    $user->id
                )
                ->count();

        if ($ownedConferenceCount > 0) {
            throw ValidationException::withMessages([
                'account' =>
                    'Your account cannot be deleted while you still own conferences. Transfer or remove those conferences first.',
            ]);
        }

        /*
         * Submission rows cascade when the author is deleted,
         * but files live outside the database. Collect them
         * before deleting the user so they can also be removed.
         */
        $submissionFiles =
            Submission::query()
                ->where(
                    'author_id',
                    $user->id
                )
                ->whereNotNull(
                    'file_path'
                )
                ->pluck(
                    'file_path'
                )
                ->filter()
                ->values()
                ->all();

        DB::transaction(
            function () use ($user) {
                /*
                 * Revoke all active Sanctum sessions first.
                 */
                $user
                    ->tokens()
                    ->delete();

                $user->delete();
            }
        );

        if ($submissionFiles !== []) {
            Storage::disk(
                'private'
            )->delete(
                $submissionFiles
            );
        }
    }
}