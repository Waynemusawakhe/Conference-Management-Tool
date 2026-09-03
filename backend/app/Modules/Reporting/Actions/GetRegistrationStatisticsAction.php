<?php

namespace App\Modules\Reporting\Actions;

use App\Modules\Conferences\Models\ConferenceRegistration;
use App\Modules\Reporting\Requests\RegistrationStatisticsRequest;

class GetRegistrationStatisticsAction
{
    /**
     * Calculate registration statistics from the actual
     * conference_registrations database records.
     */
    public function execute(RegistrationStatisticsRequest $request): array
    {
        /*
         * Start with all conference registrations.
         */
        $query = ConferenceRegistration::query();

        /*
         * Filter by conference when conference_id is supplied.
         */
        if ($request->filled('conference_id')) {
            $query->where(
                'conference_id',
                $request->integer('conference_id')
            );
        }

        /*
         * Filter by registration status.
         *
         * Valid values are:
         * registered | cancelled
         */
        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->input('status')
            );
        }

        /*
         * Filter registrations created on or after date_from.
         */
        if ($request->filled('date_from')) {
            $query->whereDate(
                'created_at',
                '>=',
                $request->input('date_from')
            );
        }

        /*
         * Filter registrations created on or before date_to.
         */
        if ($request->filled('date_to')) {
            $query->whereDate(
                'created_at',
                '<=',
                $request->input('date_to')
            );
        }

        /*
         * Count all registrations after applying the
         * requested filters.
         */
        $totalRegistrations = (clone $query)->count();

        /*
         * Count currently registered attendees.
         */
        $registered = (clone $query)
            ->where('status', 'registered')
            ->count();

        /*
         * Count cancelled registrations.
         */
        $cancelled = (clone $query)
            ->where('status', 'cancelled')
            ->count();

        /*
         * Calculate the percentage of registrations that
         * remain active.
         *
         * Protect against division by zero.
         */
        $registrationRate = $totalRegistrations > 0
            ? round(($registered / $totalRegistrations) * 100, 2)
            : 0;

        return [
            'total_registrations' => $totalRegistrations,
            'registered' => $registered,
            'cancelled' => $cancelled,
            'registration_rate' => $registrationRate,
        ];
    }
}