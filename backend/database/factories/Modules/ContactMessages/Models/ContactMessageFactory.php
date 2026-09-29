<?php

namespace Database\Factories\Modules\ContactMessages\Models;

use App\Modules\ContactMessages\Models\ContactMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContactMessageFactory extends Factory
{
    protected $model = ContactMessage::class;

    public function definition(): array
    {
        return [
            'user_id' => null,
            'name' => $this->faker->name(),
            'email' => $this->faker->safeEmail(),
            'message' => $this->faker->paragraph(),
            'status' => 'new',
        ];
    }
}