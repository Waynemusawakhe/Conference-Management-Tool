<?php

namespace Database\Factories;

use App\Modules\Faq\Models\Faq;
use Illuminate\Database\Eloquent\Factories\Factory;

class FaqFactory extends Factory
{
    protected $model = Faq::class;

    public function definition(): array
    {
        return [
            'question' => $this->faker->sentence().'?',
            'answer' => $this->faker->paragraph(),
            'category' => $this->faker->randomElement(['Registration', 'Submissions', 'General', null]),
        ];
    }
}