<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Faq\Models\Faq;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FaqApiTest extends TestCase
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

    public function test_anyone_can_list_faqs(): void
    {
        Faq::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/faqs');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }

    public function test_anyone_can_view_a_single_faq(): void
    {
        $faq = Faq::factory()->create();

        $response = $this->getJson("/api/v1/faqs/{$faq->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $faq->id);
    }

    public function test_viewing_nonexistent_faq_returns_404(): void
    {
        $response = $this->getJson('/api/v1/faqs/999999');

        $response->assertStatus(404);
    }

    public function test_unauthenticated_user_cannot_create_faq(): void
    {
        $response = $this->postJson('/api/v1/faqs', [
            'question' => 'How do I register?',
            'answer' => 'Go to the Registration tab.',
        ]);

        $response->assertStatus(401);
    }

    public function test_non_admin_cannot_create_faq(): void
    {
        $response = $this->actingAs($this->regularUser())
            ->postJson('/api/v1/faqs', [
                'question' => 'How do I register?',
                'answer' => 'Go to the Registration tab.',
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_create_faq(): void
    {
        $response = $this->actingAs($this->admin())
            ->postJson('/api/v1/faqs', [
                'question' => 'How do I register?',
                'answer' => 'Go to the Registration tab.',
                'category' => 'Registration',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.question', 'How do I register?');

        $this->assertDatabaseHas('faqs', [
            'question' => 'How do I register?',
        ]);
    }

    public function test_creating_faq_requires_question_and_answer(): void
    {
        $response = $this->actingAs($this->admin())
            ->postJson('/api/v1/faqs', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['question', 'answer']);
    }

    public function test_admin_can_update_faq(): void
    {
        $faq = Faq::factory()->create();

        $response = $this->actingAs($this->admin())
            ->putJson("/api/v1/faqs/{$faq->id}", [
                'answer' => 'Updated answer text.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.answer', 'Updated answer text.');
    }

    public function test_non_admin_cannot_update_faq(): void
    {
        $faq = Faq::factory()->create();

        $response = $this->actingAs($this->regularUser())
            ->putJson("/api/v1/faqs/{$faq->id}", [
                'answer' => 'Updated answer text.',
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_faq(): void
    {
        $faq = Faq::factory()->create();

        $response = $this->actingAs($this->admin())
            ->deleteJson("/api/v1/faqs/{$faq->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('faqs', ['id' => $faq->id]);
    }

    public function test_non_admin_cannot_delete_faq(): void
    {
        $faq = Faq::factory()->create();

        $response = $this->actingAs($this->regularUser())
            ->deleteJson("/api/v1/faqs/{$faq->id}");

        $response->assertStatus(403);
    }
}