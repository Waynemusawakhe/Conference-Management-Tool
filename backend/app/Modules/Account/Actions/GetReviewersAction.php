<?php

namespace App\Modules\Account\Actions;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class GetReviewersAction
{
    public function execute(): Collection
    {
        return User::query()
            ->select([
                'id',
                'name',
                'email',
                'role',
            ])
            ->where('role', 'reviewer')
            ->orderBy('name')
            ->get();
    }
}