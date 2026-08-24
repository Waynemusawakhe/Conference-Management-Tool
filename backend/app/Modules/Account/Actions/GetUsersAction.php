<?php

namespace App\Modules\Account\Actions;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class GetUsersAction
{
    public function execute(): Collection
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
            ->get();
    }
}