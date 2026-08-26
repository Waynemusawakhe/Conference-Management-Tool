<?php

namespace App\Modules\Account\Actions;

use Illuminate\Support\Facades\Password;

class ForgotPasswordAction
{
    public function execute(array $data): string
    {
        return Password::sendResetLink(['email' => $data['email']]);
    }
}