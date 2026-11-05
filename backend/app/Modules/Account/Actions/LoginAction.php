<?php

namespace App\Modules\Account\Actions;

use App\Models\User;
use App\Modules\Account\Services\TotpService;
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

        if ($user->mfa_enabled && ! $this->verifyMfa($user, $data['mfa_code'] ?? null)) {
            return ['user' => $user, 'mfa_required' => true];
        }

        $token = $user
            ->createToken('api-token')
            ->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    private function verifyMfa(User $user, ?string $code): bool
    {
        if (! $code) {
            return false;
        }

        if (app(TotpService::class)->verify($user->mfa_secret, $code)) {
            return true;
        }

        $recoveryCodes = $user->mfa_recovery_codes ?? [];
        foreach ($recoveryCodes as $index => $hash) {
            if (Hash::check($code, $hash)) {
                unset($recoveryCodes[$index]);
                $user->forceFill(['mfa_recovery_codes' => array_values($recoveryCodes)])->save();

                return true;
            }
        }

        return false;
    }
}
