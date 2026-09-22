<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubmissionFactory extends Factory
{
    protected $model = Submission::class;

    public function definition(): array
    {
        return [
            'conference_id' => Conference::factory(),
            'author_id' => User::factory(),
            'title' => $this->faker->sentence(6),
            'track' => $this->faker->randomElement(['AI/ML', 'Systems', 'Security', null]),
            'abstract' => $this->faker->paragraphs(3, true),
            'file_path' => null,
            'file_size_bytes' => null,
            'status' => 'pending',
            'final_decision_by' => null,
            'final_decision_at' => null,
        ];
    }
}
