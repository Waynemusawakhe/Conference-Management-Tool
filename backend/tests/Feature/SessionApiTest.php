<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Submissions\Models\ConferenceSession;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_session_reads_are_public(): void
    {
        $session = ConferenceSession::create([
            'conference_id' => Conference::factory()->create()->id,
            'title' => 'Opening Keynote',
            'scheduled_time' => now()->addDay(),
        ]);

        $this->getJson('/api/v1/sessions')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson("/api/v1/sessions/{$session->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $session->id);
    }

    public function test_session_list_can_be_filtered_by_conference(): void
    {
        $conference = Conference::factory()->create();
        $otherConference = Conference::factory()->create();

        ConferenceSession::create([
            'conference_id' => $conference->id,
            'title' => 'Conference One Session',
            'scheduled_time' => now()->addDay(),
        ]);

        ConferenceSession::create([
            'conference_id' => $otherConference->id,
            'title' => 'Conference Two Session',
            'scheduled_time' => now()->addDays(2),
        ]);

        $this->getJson(
            "/api/v1/sessions?conference_id={$conference->id}&per_page=1"
        )
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.conference_id', $conference->id)
            ->assertJsonPath('meta.per_page', 1);
    }

    public function test_nonexistent_session_returns_404(): void
    {
        $this->getJson('/api/v1/sessions/999999')
            ->assertNotFound();
    }

    public function test_session_write_operations_require_authentication(): void
    {
        $this->postJson('/api/v1/sessions', [])
            ->assertUnauthorized();

        $this->putJson('/api/v1/sessions/1', [])
            ->assertUnauthorized();

        $this->deleteJson('/api/v1/sessions/1')
            ->assertUnauthorized();
    }

    public function test_conference_owner_can_create_session(): void
    {
        $organiser = User::factory()->create(['role' => 'organiser']);

        $conference = Conference::factory()
            ->for($organiser, 'organiser')
            ->create();

        $this->actingAs($organiser, 'sanctum')
            ->postJson('/api/v1/sessions', [
                'conference_id' => $conference->id,
                'title' => 'Opening Keynote',
                'track' => 'General',
                'room' => 'Main Hall',
                'scheduled_time' => now()->addMonth()->toIso8601String(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.conference_id', $conference->id)
            ->assertJsonPath('data.title', 'Opening Keynote');
    }

    public function test_admin_can_create_session_for_any_conference(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $conference = Conference::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/sessions', [
                'conference_id' => $conference->id,
                'title' => 'Admin Session',
                'scheduled_time' => now()->addMonth()->toIso8601String(),
            ])
            ->assertCreated();
    }

    public function test_author_cannot_create_session(): void
    {
        $author = User::factory()->create(['role' => 'author']);
        $conference = Conference::factory()->create();

        $this->actingAs($author, 'sanctum')
            ->postJson('/api/v1/sessions', [
                'conference_id' => $conference->id,
                'scheduled_time' => now()->addMonth()->toIso8601String(),
            ])
            ->assertForbidden();
    }

    public function test_non_owner_organiser_cannot_create_session(): void
    {
        $owner = User::factory()->create(['role' => 'organiser']);
        $otherOrganiser = User::factory()->create(['role' => 'organiser']);

        $conference = Conference::factory()
            ->for($owner, 'organiser')
            ->create();

        $this->actingAs($otherOrganiser, 'sanctum')
            ->postJson('/api/v1/sessions', [
                'conference_id' => $conference->id,
                'scheduled_time' => now()->addMonth()->toIso8601String(),
            ])
            ->assertForbidden();
    }

    public function test_session_creation_validates_required_fields(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/sessions', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'conference_id',
                'scheduled_time',
            ]);
    }

    public function test_submission_must_belong_to_session_conference(): void
    {
        $organiser = User::factory()->create(['role' => 'organiser']);

        $conference = Conference::factory()
            ->for($organiser, 'organiser')
            ->create();

        $otherConference = Conference::factory()->create();

        $submission = Submission::factory()
            ->for($otherConference)
            ->create();

        $this->actingAs($organiser, 'sanctum')
            ->postJson('/api/v1/sessions', [
                'conference_id' => $conference->id,
                'submission_id' => $submission->id,
                'scheduled_time' => now()->addDay()->toIso8601String(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['submission_id']);
    }

    public function test_submission_can_only_be_assigned_to_one_session(): void
    {
        $organiser = User::factory()->create(['role' => 'organiser']);

        $conference = Conference::factory()
            ->for($organiser, 'organiser')
            ->create();

        $submission = Submission::factory()
            ->for($conference)
            ->create();

        ConferenceSession::create([
            'conference_id' => $conference->id,
            'submission_id' => $submission->id,
            'scheduled_time' => now()->addDay(),
        ]);

        $this->actingAs($organiser, 'sanctum')
            ->postJson('/api/v1/sessions', [
                'conference_id' => $conference->id,
                'submission_id' => $submission->id,
                'scheduled_time' => now()->addDays(2)->toIso8601String(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['submission_id']);
    }

    public function test_owner_can_update_session(): void
    {
        $organiser = User::factory()->create(['role' => 'organiser']);

        $conference = Conference::factory()
            ->for($organiser, 'organiser')
            ->create();

        $session = ConferenceSession::create([
            'conference_id' => $conference->id,
            'title' => 'Original Title',
            'scheduled_time' => now()->addDay(),
        ]);

        $this->actingAs($organiser, 'sanctum')
            ->putJson("/api/v1/sessions/{$session->id}", [
                'title' => 'Updated Session',
                'room' => 'Room A',
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated Session')
            ->assertJsonPath('data.room', 'Room A');
    }

    public function test_non_owner_cannot_update_or_delete_session(): void
    {
        $owner = User::factory()->create(['role' => 'organiser']);
        $otherOrganiser = User::factory()->create(['role' => 'organiser']);

        $conference = Conference::factory()
            ->for($owner, 'organiser')
            ->create();

        $session = ConferenceSession::create([
            'conference_id' => $conference->id,
            'scheduled_time' => now()->addDay(),
        ]);

        $this->actingAs($otherOrganiser, 'sanctum')
            ->putJson("/api/v1/sessions/{$session->id}", [
                'title' => 'Unauthorized Update',
            ])
            ->assertForbidden();

        $this->actingAs($otherOrganiser, 'sanctum')
            ->deleteJson("/api/v1/sessions/{$session->id}")
            ->assertForbidden();
    }

    public function test_owner_can_delete_session(): void
    {
        $organiser = User::factory()->create(['role' => 'organiser']);

        $conference = Conference::factory()
            ->for($organiser, 'organiser')
            ->create();

        $session = ConferenceSession::create([
            'conference_id' => $conference->id,
            'scheduled_time' => now()->addDay(),
        ]);

        $this->actingAs($organiser, 'sanctum')
            ->deleteJson("/api/v1/sessions/{$session->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('conference_sessions', [
            'id' => $session->id,
        ]);
    }
}