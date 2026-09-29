<?php

namespace App\Modules\ContactMessages\Actions;

use App\Modules\ContactMessages\Models\ContactMessage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetContactMessagesAction
{
    public function execute(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = ContactMessage::query();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest()->paginate($perPage);
    }
}