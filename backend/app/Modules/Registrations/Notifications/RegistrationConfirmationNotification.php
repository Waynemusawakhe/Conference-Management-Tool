<?php

namespace App\Modules\Registrations\Notifications;

use App\Modules\Registrations\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationConfirmationNotification extends Notification
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
            ->subject("Registration Confirmation — {$conferenceName}")
            ->greeting("Hi {$userName},")
            ->line("You have successfully registered for the conference: **{$conferenceName}**.")
            ->line("Registration Status: **{$this->registration->status}**")
            ->line("Registered on: **{$this->registration->registered_at->format('F j, Y, g:i a')}**")
            ->action('View Conference Details', url("/api/v1/conferences/{$this->registration->conference_id}"))
            ->line('Thank you for registering!')
            ->salutation('— The CMT Team');
    }
}
