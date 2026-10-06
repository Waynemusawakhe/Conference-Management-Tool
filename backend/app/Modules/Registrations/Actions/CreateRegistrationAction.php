<?php

namespace App\Modules\Registrations\Actions;

use App\Modules\Registrations\Models\Registration;
use App\Modules\Registrations\Notifications\RegistrationConfirmationNotification;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateRegistrationAction
{
    public function execute(array $data): Registration
    {
        $registration = DB::transaction(function () use ($data): Registration {
            $existing = Registration::query()
                ->where('conference_id', $data['conference_id'])
                ->where('user_id', $data['user_id'])
                ->lockForUpdate()
                ->first();

            if ($existing) {
                if ($existing->isActive()) {
                    throw ValidationException::withMessages([
                        'conference_id' => 'You are already registered for this conference.',
                    ]);
                }

                $existing->reactivate();

                return $existing;
            }

            try {
                return Registration::create([
                    ...$data,
                    'status' => 'registered',
                    'registered_at' => now(),
                    'cancelled_at' => null,
                    'reminder_sent_at' => null,
                ]);
            } catch (QueryException $exception) {
                if ($this->isUniqueConstraintViolation($exception)) {
                    throw ValidationException::withMessages([
                        'conference_id' => 'You are already registered for this conference.',
                    ]);
                }

                throw $exception;
            }
        });

        $registration->load([
            'conference',
            'user',
        ]);

        $registration->user?->notify(
            new RegistrationConfirmationNotification($registration)
        );

        return $registration;
    }

    private function isUniqueConstraintViolation(
        QueryException $exception
    ): bool {
        $message = strtolower(
            $exception->getMessage()
        );

        return $exception->getCode() === '23505'
            || (
                $exception->getCode() === '23000'
                && (
                    str_contains($message, 'duplicate')
                    || str_contains($message, 'unique')
                )
            );
    }
}
