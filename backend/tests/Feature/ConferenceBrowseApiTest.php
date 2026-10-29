<?php

namespace Tests\Feature;

use App\Modules\Conferences\Models\Conference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConferenceBrowseApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_conference_list_supports_search(): void
    {
        $matching = Conference::factory()->create([
            'code' => 'AI-SA-2027',
            'name' => 'Artificial Intelligence Summit',
            'description' => 'Research conference about AI.',
            'category' => 'Technology',
            'topics' => [
                'AI',
                'Machine Learning',
            ],
            'city' => 'Pretoria',
            'country' => 'South Africa',
        ]);

        Conference::factory()->create([
            'code' => 'MED-2027',
            'name' => 'Medical Research Congress',
            'description' => 'Healthcare research.',
            'category' => 'Health',
            'topics' => [
                'Medicine',
            ],
            'city' => 'Cape Town',
            'country' => 'South Africa',
        ]);

        $this
            ->getJson(
                '/api/v1/conferences?search=Artificial'
            )
            ->assertOk()
            ->assertJsonCount(
                1,
                'data'
            )
            ->assertJsonPath(
                'data.0.id',
                $matching->id
            );

        $this
            ->getJson(
                '/api/v1/conferences?search=Pretoria'
            )
            ->assertOk()
            ->assertJsonCount(
                1,
                'data'
            )
            ->assertJsonPath(
                'data.0.id',
                $matching->id
            );

        $this
            ->getJson(
                '/api/v1/conferences?search=AI'
            )
            ->assertOk()
            ->assertJsonCount(
                1,
                'data'
            )
            ->assertJsonPath(
                'data.0.id',
                $matching->id
            );
    }

    public function test_public_conference_list_supports_filters(): void
    {
        $matching = Conference::factory()->create([
            'category' => 'Technology',
            'country' => 'South Africa',
            'format' => 'virtual',
            'submission_status' => 'open',
        ]);

        Conference::factory()->create([
            'category' => 'Medicine',
            'country' => 'Botswana',
            'format' => 'in_person',
            'submission_status' => 'closed',
        ]);

        $queryString = http_build_query([
            'category' => 'technology',
            'country' => 'south africa',
            'format' => 'virtual',
            'submission_status' => 'open',
        ]);

        $this
            ->getJson(
                "/api/v1/conferences?{$queryString}"
            )
            ->assertOk()
            ->assertJsonCount(
                1,
                'data'
            )
            ->assertJsonPath(
                'data.0.id',
                $matching->id
            );
    }

    public function test_public_conference_list_supports_sorting(): void
    {
        $laterDeadline = Conference::factory()->create([
            'name' => 'Later Conference',
            'submission_deadline' => now()
                ->addWeeks(3)
                ->toDateString(),
        ]);

        $earlierDeadline = Conference::factory()->create([
            'name' => 'Earlier Conference',
            'submission_deadline' => now()
                ->addWeek()
                ->toDateString(),
        ]);

        $this
            ->getJson(
                '/api/v1/conferences?sort=deadline'
            )
            ->assertOk()
            ->assertJsonPath(
                'data.0.id',
                $earlierDeadline->id
            )
            ->assertJsonPath(
                'data.1.id',
                $laterDeadline->id
            );

        $this
            ->getJson(
                '/api/v1/conferences?sort=name'
            )
            ->assertOk()
            ->assertJsonPath(
                'data.0.name',
                'Earlier Conference'
            )
            ->assertJsonPath(
                'data.1.name',
                'Later Conference'
            );
    }

    public function test_conference_list_rejects_invalid_filters(): void
    {
        $queryString = http_build_query([
            'format' => 'onsite',
            'submission_status' => 'reviewing',
            'sort' => 'random',
            'per_page' => 101,
        ]);

        $this
            ->getJson(
                "/api/v1/conferences?{$queryString}"
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'format',
                'submission_status',
                'sort',
                'per_page',
            ]);
    }
}
