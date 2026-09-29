<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Reviews\Models\Testimonial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TestimonialApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_testimonial_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/testimonials')
            ->assertUnauthorized();

        $this->postJson('/api/v1/testimonials', [])
            ->assertUnauthorized();

        $this->getJson('/api/v1/testimonials/1')
            ->assertUnauthorized();

        $this->putJson('/api/v1/testimonials/1', [])
            ->assertUnauthorized();

        $this->deleteJson('/api/v1/testimonials/1')
            ->assertUnauthorized();
    }

    public function test_authenticated_user_can_list_testimonials(): void
    {
        $user = User::factory()->create();

        Testimonial::create([
            'user_id' => User::factory()->create()->id,
            'conference_id' => Conference::factory()->create()->id,
            'rating' => 5,
            'content' => 'Excellent conference.',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/testimonials')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_authenticated_user_can_view_testimonial(): void
    {
        $user = User::factory()->create();

        $testimonial = Testimonial::create([
            'user_id' => $user->id,
            'conference_id' => Conference::factory()->create()->id,
            'rating' => 4,
            'content' => 'Good conference.',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/testimonials/{$testimonial->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $testimonial->id);
    }

    public function test_viewing_nonexistent_testimonial_returns_404(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/testimonials/999999')
            ->assertNotFound();
    }

    public function test_user_can_create_testimonial(): void
    {
        $user = User::factory()->create();
        $conference = Conference::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/testimonials', [
                'conference_id' => $conference->id,
                'rating' => 5,
                'content' => 'Excellent conference.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.rating', 5);

        $this->assertDatabaseHas('testimonials', [
            'user_id' => $user->id,
            'conference_id' => $conference->id,
            'rating' => 5,
        ]);
    }

    public function test_testimonial_creation_validates_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/testimonials', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'conference_id',
                'rating',
                'content',
            ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/testimonials', [
                'conference_id' => 999999,
                'rating' => 6,
                'content' => 'Invalid testimonial.',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'conference_id',
                'rating',
            ]);
    }

    public function test_user_can_only_create_one_testimonial_per_conference(): void
    {
        $user = User::factory()->create();
        $conference = Conference::factory()->create();

        $payload = [
            'conference_id' => $conference->id,
            'rating' => 5,
            'content' => 'Excellent conference.',
        ];

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/testimonials', $payload)
            ->assertCreated();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/testimonials', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['conference_id']);
    }

    public function test_owner_can_update_testimonial(): void
    {
        $owner = User::factory()->create();

        $testimonial = Testimonial::create([
            'user_id' => $owner->id,
            'conference_id' => Conference::factory()->create()->id,
            'rating' => 3,
            'content' => 'Average conference.',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->putJson("/api/v1/testimonials/{$testimonial->id}", [
                'rating' => 5,
                'content' => 'Updated testimonial.',
            ])
            ->assertOk()
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.content', 'Updated testimonial.');
    }

    public function test_testimonial_update_validates_rating_and_content(): void
    {
        $owner = User::factory()->create();

        $testimonial = Testimonial::create([
            'user_id' => $owner->id,
            'conference_id' => Conference::factory()->create()->id,
            'rating' => 4,
            'content' => 'Good conference.',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->putJson("/api/v1/testimonials/{$testimonial->id}", [
                'rating' => 0,
                'content' => null,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rating', 'content']);
    }

    public function test_non_owner_cannot_update_testimonial(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $testimonial = Testimonial::create([
            'user_id' => $owner->id,
            'conference_id' => Conference::factory()->create()->id,
            'rating' => 4,
            'content' => 'Good conference.',
        ]);

        $this->actingAs($otherUser, 'sanctum')
            ->putJson("/api/v1/testimonials/{$testimonial->id}", [
                'rating' => 1,
                'content' => 'Unauthorized update.',
            ])
            ->assertForbidden();
    }

    public function test_owner_can_delete_testimonial(): void
    {
        $owner = User::factory()->create();

        $testimonial = Testimonial::create([
            'user_id' => $owner->id,
            'conference_id' => Conference::factory()->create()->id,
            'rating' => 4,
            'content' => 'Good conference.',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/v1/testimonials/{$testimonial->id}")
            ->assertOk();

        $this->assertDatabaseMissing('testimonials', [
            'id' => $testimonial->id,
        ]);
    }

    public function test_non_owner_including_admin_cannot_delete_testimonial(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);

        $testimonial = Testimonial::create([
            'user_id' => $owner->id,
            'conference_id' => Conference::factory()->create()->id,
            'rating' => 4,
            'content' => 'Good conference.',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/testimonials/{$testimonial->id}")
            ->assertForbidden();
    }
}