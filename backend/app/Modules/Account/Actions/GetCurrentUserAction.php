<?php

namespace App\Modules\Account\Actions;

class GetCurrentUserAction
{
    public function execute(): array
    {
        return [
            'id' => 1,
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'author',
        ];
    }
}