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
        return in_array(
            $user->role,
            [
                'admin',
                'organiser',
                'reviewer',
            ],
            true
        );
    }

    public function view(
        User $user,
        SubmissionReview $review
    ): bool {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'organiser') {
            return $review->submission
                ?->conference
                ?->organiser_id === $user->id;
        }

        if ($user->role === 'reviewer') {
            return $review->reviewer_id === $user->id;
        }

        return false;
    }

    public function create(
        User $user,
        SubmissionReview $review
    ): bool {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'organiser'
            && $review->submission
                ?->conference
                ?->organiser_id === $user->id;
    }

    public function submit(
        User $user,
        SubmissionReview $review
    ): bool {
        return $review->reviewer_id === $user->id
            && ! $review->locked;
    }

    public function lock(
        User $user,
        SubmissionReview $review
    ): bool {
        if (
            $review->locked ||
            is_null($review->submitted_at)
        ) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'organiser') {
            return $review->submission
                ?->conference
                ?->organiser_id === $user->id;
        }

        if ($user->role === 'reviewer') {
            return $review->reviewer_id === $user->id;
        }

        return false;
    }

    public function delete(
        User $user,
        SubmissionReview $review
    ): bool {
        if ($review->locked) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'organiser'
            && $review->submission
                ?->conference
                ?->organiser_id === $user->id;
    }
}