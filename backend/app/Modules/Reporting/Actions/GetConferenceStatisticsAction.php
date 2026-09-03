<?php

namespace App\Modules\Reporting\Actions;

use App\Modules\Conferences\Models\Conference;
use App\Modules\Reporting\Requests\ReportingFilterRequest;

class GetConferenceStatisticsAction
{
    public function execute(ReportingFilterRequest $request): array
    {
        $query = Conference::query();

        // Filter by conference start date.
        if ($request->filled('date_from')) {
            $query->whereDate(
                'start_date',
                '>=',
                $request->input('date_from')
            );
        }

        // Filter by conference start date.
        if ($request->filled('date_to')) {
            $query->whereDate(
                'start_date',
                '<=',
                $request->input('date_to')
            );
        }

        $totalConferences = (clone $query)->count();

        $openConferences = (clone $query)
            ->where('submission_status', 'open')
            ->count();

        $closedConferences = (clone $query)
            ->where('submission_status', 'closed')
            ->count();

        $formats = [
            'in_person' => (clone $query)
                ->where('format', 'in_person')
                ->count(),

            'virtual' => (clone $query)
                ->where('format', 'virtual')
                ->count(),

            'hybrid' => (clone $query)
                ->where('format', 'hybrid')
                ->count(),
        ];

        $categories = (clone $query)
            ->selectRaw('category, COUNT(*) as total')
            ->whereNotNull('category')
            ->groupBy('category')
            ->orderBy('category')
            ->pluck('total', 'category')
            ->toArray();

        return [
            'total_conferences' => $totalConferences,
            'open_conferences' => $openConferences,
            'closed_conferences' => $closedConferences,
            'formats' => $formats,
            'categories' => $categories,
        ];
    }
}