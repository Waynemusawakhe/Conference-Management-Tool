<?php

namespace App\Modules\Registrations\Actions;

use App\Modules\Conferences\Models\Conference;
use App\Modules\Registrations\Models\Registration;
use App\Modules\Registrations\Notifications\RegistrationConfirmationNotification;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateRegistrationAction
{
    public function execute(array $data): Registration
    {
        $registration = DB::transaction(function () use ($data): Registration {
            $conference = Conference::query()
                ->lockForUpdate()
                ->find($data['conference_id']);

            if (!$conference) {
                throw ValidationException::withMessages([
                    'conference_id' => 'Conference not found.',
                ]);
            }

            $this->assertRegistrationOpen($conference);

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

                // Reactivate only if registration is still open
                $this->assertRegistrationOpen($conference);
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

    /**
     * Block attendance registration when:
     * - conference end date has passed, or
     * - submission deadline has passed
     */
    private function assertRegistrationOpen(Conference $conference): void
    {
        $today = Carbon::today();

        if ($conference->end_date) {
            $end = Carbon::parse($conference->end_date)->startOfDay();
            if ($today->greaterThan($end)) {
                throw ValidationException::withMessages([
                    'conference_id' => 'Registration is closed because this conference has already ended.',
                ]);
            }
        }

        if ($conference->submission_deadline) {
            $deadline = Carbon::parse($conference->submission_deadline)->startOfDay();
            if ($today->greaterThan($deadline)) {
                throw ValidationException::withMessages([
                    'conference_id' => 'Registration is closed because the submission deadline has passed.',
                ]);
            }
        }
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