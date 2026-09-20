<?php

namespace App\Modules\Account\Actions;

class LogoutUserAction
{
    public function execute(): array
    {
        return [
            'message' => 'User logged out successfully.',
        ];
    }
}
