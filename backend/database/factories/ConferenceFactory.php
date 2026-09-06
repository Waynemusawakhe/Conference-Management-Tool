<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConferenceFactory extends Factory
{
    protected $model = Conference::class;

    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('+1 month', '+6 months');
        $endDate = (clone $startDate)->modify('+'.$this->faker->numberBetween(1, 4).' days');
        $submissionDeadline = (clone $startDate)->modify('-'.$this->faker->numberBetween(14, 60).' days');

        return [
            'organiser_id' => User::factory(),
            'code' => strtoupper($this->faker->unique()->bothify('CONF##??')),
            'name' => $this->faker->company().' Conference',
            'description' => $this->faker->paragraph(),
            'category' => $this->faker->randomElement(['Technology', 'Science', 'Business', null]),
            'topics' => $this->faker->randomElements(
                ['AI', 'Security', 'Cloud', 'Databases', 'Networking', 'DevOps'],
                $this->faker->numberBetween(1, 4)
            ),
            'format' => $this->faker->randomElement(['in_person', 'virtual', 'hybrid']),
            'submission_status' => 'open',
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'submission_deadline' => $submissionDeadline->format('Y-m-d'),
            'venue_name' => $this->faker->company().' Center',
            'city' => $this->faker->city(),
            'country' => $this->faker->country(),
            'website_link' => $this->faker->url(),
        ];
    }

    /**
     * Convenience state for tests that need a closed conference
     * (e.g. asserting new submissions are rejected).
     */
    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'submission_status' => 'closed',
        ]);
    }
}
