<?php

namespace App\Modules\Registrations\Actions;

use App\Modules\Registrations\Models\Registration;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class DeleteRegistrationAction
{
    public function execute(int $id): bool
    {
        $registration = Registration::findOrFail($id);

        if ($registration->isCancelled()) {
            return $registration->delete();
        }

        $registration->cancel();
        return true;
    }
}
