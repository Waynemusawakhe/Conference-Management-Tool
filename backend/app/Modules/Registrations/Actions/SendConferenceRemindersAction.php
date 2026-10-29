<?php

namespace App\Modules\Registrations\Actions;

use App\Modules\Registrations\Models\Registration;
use App\Notifications\CmtNotification;

class SendConferenceRemindersAction
{
    public function execute(): int
    {
        $reminderDate = now()->addDay()->toDateString();
        $sentCount = 0;

        Registration::query()
            ->active()
            ->whereNull('reminder_sent_at')
            ->whereHas('conference', function ($query) use ($reminderDate) {
                $query->whereDate('start_date', $reminderDate);
            })
            ->with(['conference', 'user'])
            ->chunkById(100, function ($registrations) use (&$sentCount) {
                foreach ($registrations as $registration) {
                    $user = $registration->user;
                    $conference = $registration->conference;

                    if (! $user || ! $conference) {
                        continue;
                    }

                    $user->notify(new CmtNotification(
                        'Conference reminder',
                        'Your registered conference, "'.$conference->name.'", starts tomorrow.',
                        '/my-conferences',
                        'conference_reminder',
                        [
                            'registration_id' => $registration->id,
                            'conference_id' => $conference->id,
                        ],
                    ));

                    $registration->reminder_sent_at = now();
                    $registration->save();
                    $sentCount++;
                }
            });

        return $sentCount;
    }
}
