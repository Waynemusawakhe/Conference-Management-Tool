<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConferenceApiTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'code' => 'CMT-2026',
            'name' => 'CMT Conference',
            'description' => 'Annual technology conference.',
            'category' => 'Technology',
            'topics' => ['Laravel', 'APIs'],
            'format' => 'virtual',
            'submission_status' => 'open',
            'start_date' => now()->addMonth()->toDateString(),
            'end_date' => now()->addMonth()->addDays(2)->toDateString(),
            'submission_deadline' => now()->addWeeks(2)->toDateString(),
            'city' => 'Pretoria',
            'country' => 'South Africa',
        ], $overrides);
    }

    public function test_public_can_list_conferences(): void
    {
        Conference::factory()->count(2)->create();

        $this->getJson('/api/v1/conferences')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_public_can_view_conference(): void
    {
        $conference = Conference::factory()->create();

        $this->getJson("/api/v1/conferences/{$conference->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $conference->id);
    }

    public function test_viewing_nonexistent_conference_returns_404(): void
    {
        $this->getJson('/api/v1/conferences/999999')
            ->assertNotFound();
    }

    public function test_guest_cannot_create_conference(): void
    {
        $this->postJson('/api/v1/conferences', $this->validPayload())
            ->assertUnauthorized();
    }

    public function test_author_cannot_create_conference(): void
    {
        $author = User::factory()->create(['role' => 'author']);

        $this->actingAs($author, 'sanctum')
            ->postJson('/api/v1/conferences', $this->validPayload())
            ->assertForbidden();
    }

    public function test_authenticated_organiser_can_create_conference(): void
    {
        $organiser = User::factory()->create(['role' => 'organiser']);

        $this->actingAs($organiser, 'sanctum')
            ->postJson('/api/v1/conferences', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('data.organiser_id', $organiser->id)
            ->assertJsonPath('data.name', 'CMT Conference');

        $this->assertDatabaseHas('conferences', [
            'organiser_id' => $organiser->id,
            'code' => 'CMT-2026',
        ]);
    }

    public function test_organiser_id_is_derived_from_authenticated_user(): void
    {
        $organiser = User::factory()->create(['role' => 'organiser']);
        $otherOrganiser = User::factory()->create(['role' => 'organiser']);

        $payload = $this->validPayload([
            'organiser_id' => $otherOrganiser->id,
        ]);

        $this->actingAs($organiser, 'sanctum')
            ->postJson('/api/v1/conferences', $payload)
            ->assertCreated()
            ->assertJsonPath('data.organiser_id', $organiser->id);

        $this->assertDatabaseHas('conferences', [
            'organiser_id' => $organiser->id,
            'code' => 'CMT-2026',
        ]);
    }

    public function test_conference_creation_validates_required_fields(): void
    {
        $organiser = User::factory()->create(['role' => 'organiser']);

        $this->actingAs($organiser, 'sanctum')
            ->postJson('/api/v1/conferences', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'code',
                'name',
                'format',
                'start_date',
                'end_date',
            ]);
    }

    public function test_conference_creation_validates_format_and_dates(): void
    {
        $organiser = User::factory()->create(['role' => 'organiser']);

        $this->actingAs($organiser, 'sanctum')
            ->postJson('/api/v1/conferences', $this->validPayload([
                'format' => 'invalid-format',
                'start_date' => '2026-12-10',
                'end_date' => '2026-12-01',
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['format', 'end_date']);
    }

    public function test_owner_organiser_can_update_status_and_delete_conference(): void
    {
        $organiser = User::factory()->create(['role' => 'organiser']);
        $conference = Conference::factory()
            ->for($organiser, 'organiser')
            ->create(['submission_status' => 'open']);

        $this->actingAs($organiser, 'sanctum')
            ->putJson("/api/v1/conferences/{$conference->id}", [
                'name' => 'Updated Conference',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Conference');

        $this->actingAs($organiser, 'sanctum')
            ->patchJson("/api/v1/conferences/{$conference->id}/status", [
                'status' => 'closed',
            ])
            ->assertOk()
            ->assertJsonPath('data.submission_status', 'closed');

        $this->actingAs($organiser, 'sanctum')
            ->deleteJson("/api/v1/conferences/{$conference->id}")
            ->assertOk();

        $this->assertDatabaseMissing('conferences', [
            'id' => $conference->id,
        ]);
    }

    public function test_non_owner_organiser_cannot_manage_conference(): void
    {
        $owner = User::factory()->create(['role' => 'organiser']);
        $other = User::factory()->create(['role' => 'organiser']);

        $conference = Conference::factory()
            ->for($owner, 'organiser')
            ->create();

        $this->actingAs($other, 'sanctum')
            ->putJson("/api/v1/conferences/{$conference->id}", [
                'name' => 'Unauthorized Update',
            ])
            ->assertForbidden();

        $this->actingAs($other, 'sanctum')
            ->patchJson("/api/v1/conferences/{$conference->id}/status", [
                'status' => 'closed',
            ])
            ->assertForbidden();

        $this->actingAs($other, 'sanctum')
            ->deleteJson("/api/v1/conferences/{$conference->id}")
            ->assertForbidden();

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/v1/conferences/{$conference->id}/submissions")
            ->assertForbidden();

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/v1/conferences/{$conference->id}/registrations")
            ->assertForbidden();

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/v1/conferences/{$conference->id}/sessions")
            ->assertForbidden();
    }

    public function test_admin_can_manage_any_conference(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $conference = Conference::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/conferences/{$conference->id}", [
                'name' => 'Admin Updated',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Admin Updated');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/conferences/{$conference->id}/status", [
                'status' => 'closed',
            ])
            ->assertOk();
    }
}