<?php

namespace App\Modules\Sessions\Actions;

use App\Modules\Submissions\Models\ConferenceSession;

class CreateSessionAction
{
    public function execute(array $data): ConferenceSession
    {
        $session = ConferenceSession::create($data);

        return $session->load([
            'conference',
            'submission',
        ]);
    }
}