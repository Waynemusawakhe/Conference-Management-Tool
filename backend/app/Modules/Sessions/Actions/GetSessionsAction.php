<?php

namespace App\Modules\Sessions\Actions;

<<<<<<< HEAD
use App\Modules\Sessions\Models\Session;
use Illuminate\Database\Eloquent\Collection;

class GetSessionsAction
{
    public function execute(): Collection
    {
        return Session::orderBy('start_time')->get();
    }
}
=======
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
>>>>>>> origin/main
