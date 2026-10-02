<?php

namespace App\Modules\Account\Actions;

use App\Models\User;

class AssignRoleAction
{
    /**
     * Update the role of the specified user.
     */
    public function execute(User $user, array $data): User
    {
        $user->role = $data['role'];
        $user->save();

        return $user;
    }
}