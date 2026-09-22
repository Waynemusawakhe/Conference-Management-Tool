<?php

namespace App\Modules\Registrations\Actions;

use App\Modules\Registrations\Models\Registration;
use App\Modules\Registrations\Notifications\RegistrationCancelledNotification;  // ← THIS LINE MUST EXIST

class DeleteRegistrationAction
{
    public function execute(int $id): bool
    {
        $registration = Registration::findOrFail($id);

        if ($registration->isCancelled()) {
            return $registration->delete();
        }

        $registration->cancel();

        // Send cancellation email
        $registration->user->notify(new RegistrationCancelledNotification($registration));

        return true;
    }
}
