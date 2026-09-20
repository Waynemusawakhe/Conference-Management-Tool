<?php

namespace App\Modules\Reviews\Policies;

use App\Models\User;
use App\Modules\Reviews\Models\SubmissionReview;
use Illuminate\Auth\Access\HandlesAuthorization;

class ReviewPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'organiser', 'reviewer']);
    }

    public function view(User $user, SubmissionReview $review): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'organiser') {
            return $review->submission->conference->organiser_id === $user->id;
        }

        return $review->reviewer_id === $user->id;
    }

    public function create(User $user): bool
    {
        // Only admins/organisers assign reviewers to submissions.
        return in_array($user->role, ['admin', 'organiser']);
    }

    /**
     * Submit a review's score/comments/recommendation.
     * Only the assigned reviewer, and only while unlocked.
     */
    public function submit(User $user, SubmissionReview $review): bool
    {
        return $review->reviewer_id === $user->id && ! $review->locked;
    }

    /**
     * Lock a review so it can no longer be edited.
     * The assigned reviewer or an admin/organiser can lock it,
     * but only after it has been submitted.
     */
    public function lock(User $user, SubmissionReview $review): bool
    {
        if ($review->locked || is_null($review->submitted_at)) {
            return false;
        }

        if (in_array($user->role, ['admin', 'organiser'])) {
            return true;
        }

        return $review->reviewer_id === $user->id;
    }

    public function delete(User $user, SubmissionReview $review): bool
    {
        if ($review->locked) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'organiser' && $review->submission->conference->organiser_id === $user->id;
    }
}
