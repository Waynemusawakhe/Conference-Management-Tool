<?php

namespace App\Modules\Faq\Actions;

use App\Modules\Faq\Models\Faq;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetFaqsAction
{
    public function execute(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Faq::query();

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        return $query->latest()->paginate($perPage);
    }
}