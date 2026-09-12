<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DummyUserSeeder extends Seeder
{
    public function run(): void
    {
        // Create dummy reviewer
        User::updateOrCreate(
            ['email' => 'reviewer@example.com'],
            [
                'name' => 'Test Reviewer',
                'password' => Hash::make('password123'),
                'role' => 'reviewer', // Adjust according to your roles setup
            ]
        );

        // Create dummy author
        User::updateOrCreate(
            ['email' => 'author@example.com'],
            [
                'name' => 'Test Author',
                'password' => Hash::make('password123'),
                'role' => 'author',
            ]
        );
    }
}