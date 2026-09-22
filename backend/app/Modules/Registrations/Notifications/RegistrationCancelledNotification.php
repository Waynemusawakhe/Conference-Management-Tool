<?php

namespace App\Modules\Registrations\Notifications;

use App\Modules\Registrations\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationCancelledNotification extends Notification
{
    use Queueable;

    protected Registration $registration;

    public function __construct(Registration $registration)
    {
        $this->registration = $registration;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $conferenceName = $this->registration->conference->name ?? 'Conference';
        $userName = $this->registration->user->name ?? 'Attendee';

        return (new MailMessage)
            ->subject("Registration Cancelled — {$conferenceName}")
            ->greeting("Hi {$userName},")
            ->line("Your registration for **{$conferenceName}** has been cancelled.")
            ->line("Registration ID: **{$this->registration->id}**")
            ->line("Cancelled on: **{$this->registration->cancelled_at->format('F j, Y, g:i a')}**")
            ->line('If you did not request this cancellation, please contact support.')
            ->salutation('— The CMT Team');
    }
}
