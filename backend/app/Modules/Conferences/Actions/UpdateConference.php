<?php

namespace App\Modules\Conferences\Actions;

use App\Modules\Conferences\Models\Conference;

class UpdateConference
{
    public function execute(Conference $conference, array $data): Conference
    {
        $conference->update($data);

        return $conference->fresh();
    }
}