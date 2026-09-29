<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\ContactMessages\Models\ContactMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactMessageApiTest extends TestCase
{
    use RefreshDatabase;

    protected function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    protected function regularUser(): User
    {
        return User::factory()->create(['role' => 'attendee']);
    }

    public function test_anyone_can_submit_a_contact_message(): void
    {
        $response = $this->postJson('/api/v1/contact-messages', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'message' => 'How do I register?',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'new');

        $this->assertDatabaseHas('contact_messages', [
            'email' => 'jane@example.com',
            'user_id' => null,
        ]);
    }

    public function test_logged_in_user_submitting_message_is_auto_linked(): void
    {
        $user = $this->regularUser();

        $response = $this->actingAs($user)->postJson('/api/v1/contact-messages', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'message' => 'How do I register?',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('contact_messages', [
            'email' => 'jane@example.com',
            'user_id' => $user->id,
        ]);
    }

    public function test_submitting_message_requires_name_email_and_message(): void
    {
        $response = $this->postJson('/api/v1/contact-messages', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'message']);
    }

    public function test_submitting_message_requires_valid_email(): void
    {
        $response = $this->postJson('/api/v1/contact-messages', [
            'name' => 'Jane Doe',
            'email' => 'not-an-email',
            'message' => 'How do I register?',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_unauthenticated_user_cannot_list_contact_messages(): void
    {
        $response = $this->getJson('/api/v1/contact-messages');

        $response->assertStatus(401);
    }

    public function test_non_admin_cannot_list_contact_messages(): void
    {
        $response = $this->actingAs($this->regularUser())
            ->getJson('/api/v1/contact-messages');

        $response->assertStatus(403);
    }

    public function test_admin_can_list_contact_messages(): void
    {
        ContactMessage::factory()->count(3)->create();

        $response = $this->actingAs($this->admin())
            ->getJson('/api/v1/contact-messages');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_filter_contact_messages_by_status(): void
    {
        ContactMessage::factory()->create(['status' => 'new']);
        ContactMessage::factory()->create(['status' => 'resolved']);

        $response = $this->actingAs($this->admin())
            ->getJson('/api/v1/contact-messages?status=resolved');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_can_view_a_contact_message(): void
    {
        $message = ContactMessage::factory()->create();

        $response = $this->actingAs($this->admin())
            ->getJson("/api/v1/contact-messages/{$message->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $message->id);
    }

    public function test_viewing_nonexistent_contact_message_returns_404(): void
    {
        $response = $this->actingAs($this->admin())
            ->getJson('/api/v1/contact-messages/999999');

        $response->assertStatus(404);
    }

    public function test_admin_can_update_contact_message_status(): void
    {
        $message = ContactMessage::factory()->create(['status' => 'new']);

        $response = $this->actingAs($this->admin())
            ->patchJson("/api/v1/contact-messages/{$message->id}/status", [
                'status' => 'resolved',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'resolved');
    }

    public function test_updating_status_rejects_invalid_value(): void
    {
        $message = ContactMessage::factory()->create();

        $response = $this->actingAs($this->admin())
            ->patchJson("/api/v1/contact-messages/{$message->id}/status", [
                'status' => 'not-a-real-status',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_non_admin_cannot_update_contact_message_status(): void
    {
        $message = ContactMessage::factory()->create();

        $response = $this->actingAs($this->regularUser())
            ->patchJson("/api/v1/contact-messages/{$message->id}/status", [
                'status' => 'resolved',
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_a_contact_message(): void
    {
        $message = ContactMessage::factory()->create();

        $response = $this->actingAs($this->admin())
            ->deleteJson("/api/v1/contact-messages/{$message->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('contact_messages', ['id' => $message->id]);
    }

    public function test_non_admin_cannot_delete_a_contact_message(): void
    {
        $message = ContactMessage::factory()->create();

        $response = $this->actingAs($this->regularUser())
            ->deleteJson("/api/v1/contact-messages/{$message->id}");

        $response->assertStatus(403);
    }
}