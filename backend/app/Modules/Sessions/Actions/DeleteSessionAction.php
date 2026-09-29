<?php

namespace App\Modules\Sessions\Actions;

use App\Modules\Submissions\Models\ConferenceSession;

class DeleteSessionAction
{
    public function execute(
        ConferenceSession $session
    ): void {
        $session->delete();
    }
}