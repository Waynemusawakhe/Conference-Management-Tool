<?php

namespace App\Modules\Registrations\Actions;

use App\Modules\Registrations\Models\Registration;
use Illuminate\Pagination\LengthAwarePaginator;

class GetRegistrationsAction
{
    public function execute(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Registration::with(['conference', 'user']);

        if (!empty($filters['conference_id'])) {
            $query->where('conference_id', $filters['conference_id']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['registered_from'])) {
            $query->whereDate('registered_at', '>=', $filters['registered_from']);
        }

        if (!empty($filters['registered_to'])) {
            $query->whereDate('registered_at', '<=', $filters['registered_to']);
        }

        $query->orderBy('registered_at', 'desc');

        return $query->paginate($perPage);
    }
}
