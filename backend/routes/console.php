<?php

use App\Modules\Registrations\Actions\SendConferenceRemindersAction;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(fn () => app(SendConferenceRemindersAction::class)->execute())
    ->dailyAt('00:00')
    ->name('send-conference-reminders')
    ->withoutOverlapping();
