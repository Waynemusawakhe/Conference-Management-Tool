<?php

namespace App\Modules\Account\Actions;

class LoginUserAction
{
    public function execute(array $data): array
    {
        return [
            'token' => 'mock-token-12345',
            'token_type' => 'Bearer',
            'user' => [
                'id' => 1,
                'name' => 'Test User',
                'email' => $data['email'],
                'role' => 'author',
            ],
        ];
    }
}