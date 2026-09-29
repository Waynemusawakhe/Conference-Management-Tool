<?php

namespace App\Modules\Sessions\Actions;

use App\Modules\Submissions\Models\ConferenceSession;

class UpdateSessionAction
{
    public function execute(
        ConferenceSession $session,
        array $data
    ): ConferenceSession {
        $session->update($data);

        return $session->fresh([
            'conference',
            'submission',
        ]);
    }
}