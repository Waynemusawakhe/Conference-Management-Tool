<?php

namespace App\Modules\Account\Actions;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginAction
{
    public function execute(array $data): array
    {
        $user = User::where('email', $data['email'])->first();

        if (
            ! $user ||
            ! Hash::check($data['password'], $user->password)
        ) {
            throw new AuthenticationException(
                'The provided credentials are incorrect.'
            );
        }

        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => 'Please verify your email address before logging in.',
            ]);
        }

        $token = $user
            ->createToken('api-token')
            ->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}
