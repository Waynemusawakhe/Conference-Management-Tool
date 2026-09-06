<?php

namespace App\Modules\Submissions\Actions;

use App\Models\User;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetSubmissionsAction
{
    public function execute(User $requester, array $filters = []): LengthAwarePaginator
    {
        $query = Submission::query()->with(['author', 'conference']);

        if ($requester->cannot('viewAny', Submission::class)) {
            $query->where('author_id', $requester->id);
        }

        if (! empty($filters['conference_id'])) {
            $query->where('conference_id', $filters['conference_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['track'])) {
            $query->where('track', $filters['track']);
        }

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }
}
