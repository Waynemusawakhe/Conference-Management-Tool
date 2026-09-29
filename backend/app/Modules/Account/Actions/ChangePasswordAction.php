<?php

namespace App\Modules\Account\Actions;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ChangePasswordAction
{
    public function execute(User $user, array $data): void
    {
        if (! Hash::check(
            $data['current_password'],
            $user->password
        )) {
            throw ValidationException::withMessages([
                'current_password' => 'The current password is incorrect.',
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
        ])->save();

        // Log out all devices after password change.
        $user->tokens()->delete();
    }
}