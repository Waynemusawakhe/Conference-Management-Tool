<?php

namespace App\Modules\Submissions\Policies;

use App\Models\User;
use App\Modules\Submissions\Models\Submission;

class SubmissionPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['organiser', 'admin'], true);
    }

    public function view(User $user, Submission $submission): bool
    {
        return $user->id === $submission->author_id
            || $user->role === 'admin'
            || $user->role === 'organiser'
            || $submission->reviews()->where('reviewer_id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Submission $submission): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->id === $submission->author_id
            && $submission->status === 'pending';
    }

    public function delete(User $user, Submission $submission): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->id === $submission->author_id
            && $submission->status === 'pending';
    }

    public function decide(User $user, Submission $submission): bool
    {
        return in_array($user->role, ['organiser', 'admin'], true);
    }
}
