<?php

namespace App\Modules\Account\Actions;

use App\Models\User;

class LogoutAction
{
    public function execute(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}