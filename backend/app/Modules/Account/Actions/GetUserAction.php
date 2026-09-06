<?php

namespace App\Modules\Account\Actions;

use App\Models\User;

class GetUserAction
{
    public function execute(int $id): User
    {
        return User::query()
            ->select([
                'id',
                'name',
                'email',
                'role',
                'email_verified_at',
                'created_at',
                'updated_at',
            ])
            ->findOrFail($id);
    }
}
