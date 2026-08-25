<?php

namespace App\Modules\Registrations\Actions;

use App\Modules\Registrations\Models\Registration;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UpdateRegistrationAction
{
    public function execute(int $id, array $data): Registration
    {
        $registration = Registration::findOrFail($id);

        if (isset($data['status']) && $data['status'] === 'cancelled' && $registration->status !== 'cancelled') {
            $data['cancelled_at'] = now();
        }

        if (isset($data['status']) && $data['status'] === 'registered' && $registration->status === 'cancelled') {
            $data['cancelled_at'] = null;
        }

        $registration->update($data);
        $registration->load(['conference', 'user']);

        return $registration;
    }
}
