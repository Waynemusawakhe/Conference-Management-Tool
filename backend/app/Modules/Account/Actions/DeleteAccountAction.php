<?php

namespace App\Modules\Account\Actions;

use App\Models\User;

class DeleteAccountAction
{
    public function execute(User $user): void
    {
        $user->tokens()->delete();
        $user->delete();
    }
}