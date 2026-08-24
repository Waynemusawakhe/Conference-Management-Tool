<?php

namespace App\Modules\Conferences\Policies;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;

class ConferencePolicy
{
    public function create(User $user): bool
    {
        return in_array($user->role, ['organiser', 'admin'], true);
    }

    public function update(User $user, Conference $conference): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'organiser'
                && $user->id === $conference->organiser_id);
    }

    public function delete(User $user, Conference $conference): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'organiser'
                && $user->id === $conference->organiser_id);
    }

    public function updateStatus(User $user, Conference $conference): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'organiser'
                && $user->id === $conference->organiser_id);
    }
}