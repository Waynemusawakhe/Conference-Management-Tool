<?php

namespace Tests\Unit;

use App\Models\User;
use App\Modules\Shared\Enums\UserRole;
use App\Notifications\CmtNotification;
use Illuminate\Notifications\Messages\MailMessage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class NotificationDeliveryTest extends TestCase
{
    #[DataProvider('userRoles')]
    public function test_app_notifications_use_database_and_email_channels_for_every_role(string $role): void
    {
        $user = new User(['name' => 'Test User', 'email' => 'test@example.com', 'role' => $role]);
        $notification = new CmtNotification('Test update', 'A test notification.', '/notifications');

        $this->assertSame(['database', 'mail'], $notification->via($user));
        $this->assertInstanceOf(MailMessage::class, $notification->toMail($user));
    }

    public static function userRoles(): array
    {
        return array_map(
            static fn (UserRole $role): array => [$role->value],
            UserRole::cases(),
        );
    }
}