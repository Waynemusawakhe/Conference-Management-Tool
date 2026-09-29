<?php

namespace App\Modules\Sessions\Actions;

use App\Modules\Submissions\Models\ConferenceSession;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetSessionsAction
{
    public function execute(
        ?int $conferenceId = null,
        int $perPage = 15
    ): LengthAwarePaginator {
        return ConferenceSession::query()
            ->with(['conference', 'submission'])
            ->when(
                $conferenceId,
                fn ($query) => $query->where(
                    'conference_id',
                    $conferenceId
                )
            )
            ->orderBy('scheduled_time')
            ->paginate($perPage);
    }
}