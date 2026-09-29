<?php

namespace App\Modules\Sessions\Policies;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Submissions\Models\ConferenceSession;

class SessionPolicy
{
    public function create(
        User $user,
        Conference $conference
    ): bool {
        return $user->role === 'admin'
            || (
                $user->role === 'organiser'
                && $conference->organiser_id === $user->id
            );
    }

    public function update(
        User $user,
        ConferenceSession $session
    ): bool {
        return $user->role === 'admin'
            || (
                $user->role === 'organiser'
                && $session->conference->organiser_id === $user->id
            );
    }

    public function delete(
        User $user,
        ConferenceSession $session
    ): bool {
        return $this->update($user, $session);
    }
}