<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CmtNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $title,
        public readonly string $message,
        public readonly ?string $actionUrl = null,
        public readonly string $kind = 'general',
        public readonly array $metadata = [],
        public readonly array $channels = ['database'],
    ) {}

    public function via(object $notifiable): array
    {
        $channels = array_values(array_intersect(
            $this->channels,
            ['database', 'mail']
        ));

        return $channels !== [] ? $channels : ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return array_merge([
            'title' => $this->title,
            'message' => $this->message,
            'action_url' => $this->actionUrl,
            'kind' => $this->kind,
        ], $this->metadata);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->title)
            ->greeting('Hello '.$notifiable->name.',')
            ->line($this->message);

        if ($this->actionUrl) {
            $url = str_starts_with($this->actionUrl, 'http')
                ? $this->actionUrl
                : rtrim(config('app.frontend_url'), '/')
                    .'/'.ltrim($this->actionUrl, '/');

            $mail->action('View notification', $url);
        }

        return $mail->salutation(
            'The Conference Management Tool Team'
        );
    }
}
