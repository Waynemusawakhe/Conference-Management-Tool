<?php

namespace App\Modules\Registrations\Policies;

use App\Models\User;
use App\Modules\Registrations\Models\Registration;
use Illuminate\Auth\Access\HandlesAuthorization;

class RegistrationPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'organiser', 'reviewer']);
    }

    public function view(User $user, Registration $registration): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'organiser') {
            return $registration->conference->organiser_id === $user->id;
        }

        return $registration->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Registration $registration): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'organiser') {
            return $registration->conference->organiser_id === $user->id;
        }

        return $registration->user_id === $user->id;
    }

    public function delete(User $user, Registration $registration): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'organiser') {
            return $registration->conference->organiser_id === $user->id;
        }

        return $registration->user_id === $user->id;
    }
}
