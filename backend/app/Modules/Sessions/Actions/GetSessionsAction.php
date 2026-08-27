<?php

namespace App\Modules\Sessions\Actions;

use App\Modules\Sessions\Models\Session;
use Illuminate\Database\Eloquent\Collection;

class GetSessionsAction
{
    public function execute(): Collection
    {
        return Session::orderBy('start_time')->get();
    }
}