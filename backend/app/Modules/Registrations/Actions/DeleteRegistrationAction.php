<?php

namespace App\Modules\Registrations\Actions;

use App\Modules\Registrations\Models\Registration;
use App\Modules\Registrations\Notifications\RegistrationCancelledNotification;

class DeleteRegistrationAction
{
    public function execute(int $id): Registration
    {
        $registration = Registration::query()
            ->with([
                'conference',
                'user',
            ])
            ->findOrFail($id);

        /*
         * Cancellation is idempotent.
         * A second DELETE keeps the historical row instead of
         * permanently deleting it.
         */
        if ($registration->isCancelled()) {
            return $registration;
        }

        $registration->cancel();
        $registration->refresh();
        $registration->loadMissing([
            'conference',
            'user',
        ]);

        $registration->user?->notify(
            new RegistrationCancelledNotification($registration)
        );

        return $registration;
    }
}
