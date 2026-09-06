<?php

namespace App\Modules\Account\Actions;

class RegisterUserAction
{
    public function execute(array $data): array
    {
        return [
            'id' => 1,
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'] ?? 'author',
        ];
    }
}
