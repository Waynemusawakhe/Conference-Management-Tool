<?php

namespace App\Modules\Reporting\Actions;

use App\Modules\Registrations\Models\Registration;
use App\Modules\Reporting\Requests\RegistrationStatisticsRequest;

class GetRegistrationStatisticsAction
{
    /**
     * Calculate registration statistics from the actual
     * conference_registrations database records.
     */
    public function execute(
        RegistrationStatisticsRequest $request
    ): array {
        $query = Registration::query();

        if ($request->filled('conference_id')) {
            $query->where(
                'conference_id',
                $request->integer('conference_id')
            );
        }

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->input('status')
            );
        }

        if ($request->filled('date_from')) {
            $query->whereDate(
                'created_at',
                '>=',
                $request->input('date_from')
            );
        }

        if ($request->filled('date_to')) {
            $query->whereDate(
                'created_at',
                '<=',
                $request->input('date_to')
            );
        }

        $totalRegistrations = (clone $query)->count();

        $registered = (clone $query)
            ->where('status', 'registered')
            ->count();

        $cancelled = (clone $query)
            ->where('status', 'cancelled')
            ->count();

        $registrationRate = $totalRegistrations > 0
            ? round(
                ($registered / $totalRegistrations) * 100,
                2
            )
            : 0;

        return [
            'total_registrations' => $totalRegistrations,
            'registered' => $registered,
            'cancelled' => $cancelled,
            'registration_rate' => $registrationRate,
        ];
    }
}
