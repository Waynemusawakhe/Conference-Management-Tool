<?php

namespace App\Modules\ContactMessages\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ContactMessagePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function view(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function updateStatus(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function delete(User $user): bool
    {
        return $user->role === 'admin';
    }
}