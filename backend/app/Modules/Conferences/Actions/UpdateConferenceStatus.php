<?php

namespace App\Modules\Conferences\Actions;

use App\Modules\Conferences\Models\Conference;

class UpdateConferenceStatus
{
    public function execute(Conference $conference, string $status): Conference
    {
        $conference->update([
            'submission_status' => $status,
        ]);

        return $conference->fresh();
    }
}
