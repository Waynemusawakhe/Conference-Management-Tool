<?php

namespace Tests\Feature;

use App\Modules\Conferences\Models\Conference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConferenceSuggestionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_suggests_matching_conference_titles(): void
    {
        Conference::factory()->create(['name' => 'Artificial Intelligence Summit']);
        Conference::factory()->create(['name' => 'Robotics Symposium']);

        $response = $this->getJson('/api/v1/conferences/suggestions?q=Artificial');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Artificial Intelligence Summit');
    }

    public function test_title_matching_is_case_insensitive(): void
    {
        Conference::factory()->create(['name' => 'Artificial Intelligence Summit']);

        $this->getJson('/api/v1/conferences/suggestions?q=artificial')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Artificial Intelligence Summit');
    }

    public function test_it_validates_short_queries(): void
    {
        $this->getJson('/api/v1/conferences/suggestions?q=a')
            ->assertUnprocessable();
    }

    public function test_it_returns_no_results_for_unmatched_titles(): void
    {
        Conference::factory()->create(['name' => 'Robotics Symposium']);

        $this->getJson('/api/v1/conferences/suggestions?q=Quantum')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_it_limits_results_to_five(): void
    {
        Conference::factory()->count(8)->create(['name' => 'Science Conference']);

        $this->getJson('/api/v1/conferences/suggestions?q=Science')
            ->assertOk()
            ->assertJsonCount(5, 'data');
    }
}
