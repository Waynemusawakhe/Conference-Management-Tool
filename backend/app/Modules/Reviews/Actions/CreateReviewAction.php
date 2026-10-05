<?php

namespace App\Modules\Reviews\Actions;

use App\Modules\Reviews\Models\SubmissionReview;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateReviewAction
{
    public function execute(
        array $data
    ): SubmissionReview {
        /*
         * Friendly duplicate check.
         *
         * The database unique constraint still remains
         * the final protection against race conditions.
         */
        $alreadyAssigned =
            SubmissionReview::query()
                ->where(
                    'submission_id',
                    $data['submission_id']
                )
                ->where(
                    'reviewer_id',
                    $data['reviewer_id']
                )
                ->exists();

        if ($alreadyAssigned) {
            throw ValidationException::withMessages([
                'reviewer_id' => [
                    'This reviewer is already assigned to this submission.',
                ],
            ]);
        }

        try {
            return DB::transaction(
                function () use ($data) {
                    $data['assigned_at'] =
                        $data['assigned_at']
                        ?? now();

                    $review =
                        SubmissionReview::create(
                            $data
                        );

                    /*
                     * Once a reviewer has been assigned,
                     * the submission enters review.
                     */
                    $submission =
                        $review->submission;

                    if (
                        $submission &&
                        $submission->status === 'pending'
                    ) {
                        $submission->update([
                            'status' =>
                                'under_review',
                        ]);
                    }

                    return $review->load([
                        'submission',
                        'reviewer',
                    ]);
                }
            );
        } catch (
            UniqueConstraintViolationException $exception
        ) {
            /*
             * Handles PostgreSQL, MySQL and other
             * supported databases without relying
             * on database-specific error strings.
             */
            throw ValidationException::withMessages([
                'reviewer_id' => [
                    'This reviewer is already assigned to this submission.',
                ],
            ]);
        }
    }
}