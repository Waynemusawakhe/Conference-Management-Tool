<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CmtNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $message,
        public ?string $actionUrl = null,
        public string $kind = 'system',
        public array $metadata = [],
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
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
            $actionUrl = str_starts_with($this->actionUrl, 'http')
                ? $this->actionUrl
                : rtrim(config('app.frontend_url'), '/').'/'.ltrim($this->actionUrl, '/');

            $mail->action('View notification', $actionUrl);
        }

        return $mail->salutation('The Conference Management Tool Team');
    }
}
