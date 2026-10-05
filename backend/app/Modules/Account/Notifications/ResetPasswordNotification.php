<?php

namespace App\Modules\Account\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $resetUrl = $this->resetUrl(
            $notifiable
        );

        $expireMinutes = config(
            'auth.passwords.' .
            config('auth.defaults.passwords') .
            '.expire',
            60
        );

        return (new MailMessage)
            ->subject(
                'Reset Your Password — Conference Management Tool'
            )
            ->greeting(
                "Hi {$notifiable->name},"
            )
            ->line(
                'You requested a password reset for your CMT account.'
            )
            ->action(
                'Reset Password',
                $resetUrl
            )
            ->line(
                "This password reset link will expire in {$expireMinutes} minutes."
            )
            ->line(
                'If you did not request a password reset, no further action is required.'
            )
            ->salutation(
                '— The CMT Team'
            );
    }

    protected function resetUrl(
        $notifiable
    ): string {
        $frontendUrl = rtrim(
            config(
                'app.frontend_url',
                'http://localhost:3000'
            ),
            '/'
        );

        $email = urlencode(
            $notifiable
                ->getEmailForPasswordReset()
        );

        $token = urlencode(
            $this->token
        );

        return $frontendUrl .
            '/reset-password' .
            '?token=' . $token .
            '&email=' . $email;
    }
}