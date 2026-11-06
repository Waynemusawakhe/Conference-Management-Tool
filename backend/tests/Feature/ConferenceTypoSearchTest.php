<?php

namespace Tests\Feature;

use App\Modules\Conferences\Models\Conference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ConferenceTypoSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_typo_search_is_disabled_by_default(): void
    {
        config()->set('conferences.typo_search_enabled', false);
        Conference::factory()->create(['name' => 'Artificial Intelligence Summit']);

        $this->getJson('/api/v1/conferences/suggestions?q=Artifical')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->getJson('/api/v1/conferences?search=Artifical')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_postgresql_typo_search_finds_misspelled_titles(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('pg_trgm requires PostgreSQL.');
        }

        config()->set('conferences.typo_search_enabled', true);
        $matching = Conference::factory()->create(['name' => 'Artificial Intelligence Summit']);
        Conference::factory()->create(['name' => 'Robotics Symposium']);

        $this->getJson('/api/v1/conferences/suggestions?q=Artifical')
            ->assertOk()
            ->assertJsonPath('data.0.id', $matching->id);

        $this->getJson('/api/v1/conferences?search=Artifical')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $matching->id);
    }

    public function test_filters_still_apply_to_typo_matches(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('pg_trgm requires PostgreSQL.');
        }

        config()->set('conferences.typo_search_enabled', true);
        Conference::factory()->create([
            'name' => 'Artificial Intelligence Summit',
            'country' => 'South Africa',
        ]);

        $this->getJson('/api/v1/conferences?search=Artifical&country=Botswana')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
