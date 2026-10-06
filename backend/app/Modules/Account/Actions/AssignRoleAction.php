<?php

namespace App\Modules\Account\Actions;

use App\Models\User;
use Illuminate\Validation\ValidationException;

class AssignRoleAction
{
    /**
     * Update the role of the specified user.
     *
     * @throws ValidationException
     */
    public function execute(
        User $user,
        array $data,
        User $actor
    ): User {
        $newRole = $data['role'];

        /*
         * An admin must not be able to remove their own admin role.
         *
         * This prevents the currently authenticated administrator
         * from accidentally locking themselves out of admin features.
         */
        if (
            $actor->is($user) &&
            $user->role === 'admin' &&
            $newRole !== 'admin'
        ) {
            throw ValidationException::withMessages([
                'role' => [
                    'You cannot remove your own administrator role.',
                ],
            ]);
        }

        $user->role = $newRole;
        $user->save();

        return $user->refresh();
    }
}
