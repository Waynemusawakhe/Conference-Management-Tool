<?php

namespace App\Modules\Registrations\Actions;

use App\Modules\Registrations\Models\Registration;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;

class CreateRegistrationAction
{
    public function execute(array $data): Registration
    {
        try {
            if (empty($data['status'])) {
                $data['status'] = 'registered';
            }

            if (empty($data['registered_at'])) {
                $data['registered_at'] = now();
            }

            $registration = Registration::create($data);
            $registration->load(['conference', 'user']);

            return $registration;
        } catch (QueryException $e) {
            if ($e->getCode() === '23505' || str_contains($e->getMessage(), 'Duplicate entry')) {
                throw ValidationException::withMessages([
                    'user_id' => 'This user is already registered for this conference.',
                ]);
            }
            throw $e;
        }
    }
}
