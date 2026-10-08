<?php

namespace App\Modules\Registrations\Actions;

use App\Models\User;
use App\Modules\Registrations\Models\Registration;
use Illuminate\Pagination\LengthAwarePaginator;

class GetRegistrationsAction
{
    public function execute(
        User $requester,
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        $query = Registration::query()
            ->with(['conference', 'user']);

        /*
         * An organiser has two registration views:
         *
         * 1. Management view:
         *    registrations for conferences they organise.
         *
         * 2. Personal attendance view:
         *    registrations where they are personally attending.
         *
         * MyConferences sends user_id equal to the authenticated
         * user's ID, so in that case the organiser should receive
         * their own attendance registrations.
         */
        $requestingOwnRegistrations =
            ! empty($filters['user_id'])
            && (int) $filters['user_id'] === (int) $requester->id;

        if (
            $requester->role === 'organiser'
            && ! $requestingOwnRegistrations
        ) {
            $query->whereHas(
                'conference',
                function ($conferenceQuery) use ($requester) {
                    $conferenceQuery->where(
                        'organiser_id',
                        $requester->id
                    );
                }
            );
        } elseif ($requester->role !== 'admin') {
            /*
             * Authors, reviewers, attendees and organisers
             * explicitly requesting their own registrations
             * may only see their own attendance.
             */
            $query->where(
                'user_id',
                $requester->id
            );
        }

        if (! empty($filters['conference_id'])) {
            $query->where(
                'conference_id',
                $filters['conference_id']
            );
        }

        if (! empty($filters['user_id'])) {
            $query->where(
                'user_id',
                $filters['user_id']
            );
        }

        if (! empty($filters['status'])) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        if (! empty($filters['registered_from'])) {
            $query->whereDate(
                'registered_at',
                '>=',
                $filters['registered_from']
            );
        }

        if (! empty($filters['registered_to'])) {
            $query->whereDate(
                'registered_at',
                '<=',
                $filters['registered_to']
            );
        }

        return $query
            ->orderByDesc('registered_at')
            ->paginate($perPage);
    }
}