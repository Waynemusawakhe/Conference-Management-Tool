<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Registrations\Models\Registration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RegistrationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_registration_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/registrations')
            ->assertUnauthorized();

        $this->postJson('/api/v1/registrations', [])
            ->assertUnauthorized();

        $this->getJson('/api/v1/registrations/1')
            ->assertUnauthorized();

        $this->putJson('/api/v1/registrations/1', [])
            ->assertUnauthorized();

        $this->deleteJson('/api/v1/registrations/1')
            ->assertUnauthorized();
    }

    public function test_authenticated_user_can_register_for_conference(): void
    {
        $user = User::factory()->create();
        $conference = Conference::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/registrations', [
                'conference_id' => $conference->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.conference_id', $conference->id)
            ->assertJsonPath('data.status', 'registered');

        $this->assertDatabaseHas('conference_registrations', [
            'conference_id' => $conference->id,
            'user_id' => $user->id,
            'status' => 'registered',
        ]);
    }

    public function test_client_cannot_register_another_user_or_set_status(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $conference = Conference::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/registrations', [
                'conference_id' => $conference->id,
                'user_id' => $otherUser->id,
                'status' => 'cancelled',
            ])
            ->assertCreated()
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.status', 'registered');
    }

    public function test_registration_requires_existing_conference(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/registrations', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['conference_id']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/registrations', [
                'conference_id' => 999999,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['conference_id']);
    }

    public function test_duplicate_registration_is_rejected(): void
    {
        $user = User::factory()->create();
        $conference = Conference::factory()->create();

        Registration::create([
            'conference_id' => $conference->id,
            'user_id' => $user->id,
            'status' => 'registered',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/registrations', [
                'conference_id' => $conference->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['conference_id']);
    }

    public function test_regular_user_only_lists_own_registrations(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $conference = Conference::factory()->create();

        Registration::create([
            'conference_id' => $conference->id,
            'user_id' => $user->id,
        ]);

        Registration::create([
            'conference_id' => $conference->id,
            'user_id' => $otherUser->id,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/registrations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.user_id', $user->id);
    }

    public function test_organiser_only_lists_registrations_for_owned_conferences(): void
    {
        $organiser = User::factory()->create(['role' => 'organiser']);
        $otherOrganiser = User::factory()->create(['role' => 'organiser']);

        $ownedConference = Conference::factory()
            ->for($organiser, 'organiser')
            ->create();

        $otherConference = Conference::factory()
            ->for($otherOrganiser, 'organiser')
            ->create();

        Registration::create([
            'conference_id' => $ownedConference->id,
            'user_id' => User::factory()->create()->id,
        ]);

        Registration::create([
            'conference_id' => $otherConference->id,
            'user_id' => User::factory()->create()->id,
        ]);

        $this->actingAs($organiser, 'sanctum')
            ->getJson('/api/v1/registrations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.conference_id',
                $ownedConference->id
            );
    }

    public function test_registration_list_supports_filters_and_pagination(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $conference = Conference::factory()->create();

        Registration::create([
            'conference_id' => $conference->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'registered',
        ]);

        Registration::create([
            'conference_id' => $conference->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson(
                "/api/v1/registrations?conference_id={$conference->id}&status=cancelled&per_page=1"
            )
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'cancelled')
            ->assertJsonPath('meta.per_page', 1);
    }

    public function test_owner_can_view_registration(): void
    {
        $user = User::factory()->create();

        $registration = Registration::create([
            'conference_id' => Conference::factory()->create()->id,
            'user_id' => $user->id,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/registrations/{$registration->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $registration->id);
    }

    public function test_user_cannot_view_another_users_registration(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $registration = Registration::create([
            'conference_id' => Conference::factory()->create()->id,
            'user_id' => $owner->id,
        ]);

        $this->actingAs($otherUser, 'sanctum')
            ->getJson("/api/v1/registrations/{$registration->id}")
            ->assertForbidden();
    }

    public function test_owner_can_update_registration_status(): void
    {
        $user = User::factory()->create();

        $registration = Registration::create([
            'conference_id' => Conference::factory()->create()->id,
            'user_id' => $user->id,
            'status' => 'registered',
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/registrations/{$registration->id}", [
                'status' => 'cancelled',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('conference_registrations', [
            'id' => $registration->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_registration_update_rejects_invalid_status(): void
    {
        $user = User::factory()->create();

        $registration = Registration::create([
            'conference_id' => Conference::factory()->create()->id,
            'user_id' => $user->id,
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/registrations/{$registration->id}", [
                'status' => 'invalid-status',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_owner_can_cancel_registration(): void
    {
        $user = User::factory()->create();

        $registration = Registration::create([
            'conference_id' => Conference::factory()->create()->id,
            'user_id' => $user->id,
            'status' => 'registered',
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/v1/registrations/{$registration->id}")
            ->assertOk();

        $this->assertDatabaseHas('conference_registrations', [
            'id' => $registration->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_non_owner_cannot_update_or_cancel_registration(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $registration = Registration::create([
            'conference_id' => Conference::factory()->create()->id,
            'user_id' => $owner->id,
        ]);

        $this->actingAs($otherUser, 'sanctum')
            ->putJson("/api/v1/registrations/{$registration->id}", [
                'status' => 'cancelled',
            ])
            ->assertForbidden();

        $this->actingAs($otherUser, 'sanctum')
            ->deleteJson("/api/v1/registrations/{$registration->id}")
            ->assertForbidden();
    }

    public function test_nonexistent_registration_returns_404(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/registrations/999999')
            ->assertNotFound();
    }
}