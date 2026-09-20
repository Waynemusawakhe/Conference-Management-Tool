<?php

namespace App\Modules\Conferences\Actions;

use App\Modules\Conferences\Models\Conference;

class DeleteConference
{
    public function execute(Conference $conference): void
    {
        $conference->delete();
    }
}
