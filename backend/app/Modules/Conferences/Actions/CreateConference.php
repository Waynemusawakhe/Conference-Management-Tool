<?php

namespace App\Modules\Conferences\Actions;

use App\Modules\Conferences\Models\Conference;

class CreateConference
{
    public function execute(array $data): Conference
    {
        return Conference::create($data);
    }
}
