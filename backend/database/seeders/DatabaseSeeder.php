<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use App\Modules\Conferences\Models\Conference;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create your main user (so you can log in if you need to)
        User::factory()->create([
            'name' => 'BP Masemola',
            'email' => 'bp@example.com',
        ]);

        // 2. Create the conferences
        $conferences = [
            [
                'name' => 'AI & Machine Learning Summit 2026', 'code' => 'AI-26',
                'description' => 'Explore the latest breakthroughs in artificial intelligence and deep learning.',
                'category' => 'Technology', 'start_date' => '2026-12-01', 'end_date' => '2026-12-03',
                'submission_deadline' => '2026-11-15', 'city' => 'Cape Town', 'country' => 'South Africa',
                'format' => 'hybrid', 'submission_status' => 'open', 'organiser_id' => 1,
            ],
            [
                'name' => 'Global Health & Medicine Expo', 'code' => 'HLT-26',
                'description' => 'A premier event for medical professionals and healthcare innovators.',
                'category' => 'Medicine & Health', 'start_date' => '2026-11-20', 'end_date' => '2026-11-22',
                'submission_deadline' => '2026-10-30', 'city' => 'Johannesburg', 'country' => 'South Africa',
                'format' => 'in_person', 'submission_status' => 'closed', 'organiser_id' => 1,
            ],
            [
                'name' => 'Sustainable Engineering Conference', 'code' => 'ENG-26',
                'description' => 'Discussing the future of green energy and mechanical engineering.',
                'category' => 'Engineering', 'start_date' => '2027-01-10', 'end_date' => '2027-01-12',
                'submission_deadline' => '2026-12-01', 'city' => 'Berlin', 'country' => 'Germany',
                'format' => 'in_person', 'submission_status' => 'open', 'organiser_id' => 1,
            ],
            [
                'name' => 'Future of Business & Economics', 'code' => 'BUS-26',
                'description' => 'Navigating global markets and economic policy in the modern era.',
                'category' => 'Business & Economics', 'start_date' => '2026-11-28', 'end_date' => '2026-11-29',
                'submission_deadline' => '2026-11-01', 'city' => 'London', 'country' => 'United Kingdom',
                'format' => 'virtual', 'submission_status' => 'open', 'organiser_id' => 1,
            ],
            [
                'name' => 'Frontiers in Space Science', 'code' => 'SCI-26',
                'description' => 'Astrophysics, quantum mechanics, and space exploration.',
                'category' => 'Science', 'start_date' => '2027-02-15', 'end_date' => '2027-02-18',
                'submission_deadline' => '2026-12-15', 'city' => 'Cape Town', 'country' => 'South Africa',
                'format' => 'hybrid', 'submission_status' => 'open', 'organiser_id' => 1,
            ],
            [
                'name' => 'Creative Arts & Humanities Symposium', 'code' => 'OTH-26',
                'description' => 'A gathering for artists, writers, and philosophers.',
                'category' => 'Other', 'start_date' => '2026-12-10', 'end_date' => '2026-12-11',
                'submission_deadline' => '2026-11-20', 'city' => 'Durban', 'country' => 'South Africa',
                'format' => 'in_person', 'submission_status' => 'open', 'organiser_id' => 1,
            ],
            // PAST CONFERENCES FOR TESTING
            [
                'name' => 'Legacy Web Development Summit', 'code' => 'WEB-25',
                'description' => 'A past conference. Should not be in upcoming.',
                'category' => 'Technology', 'start_date' => '2025-05-10', 'end_date' => '2025-05-12',
                'submission_deadline' => '2025-04-01', 'city' => 'Durban', 'country' => 'South Africa',
                'format' => 'in_person', 'submission_status' => 'closed', 'organiser_id' => 1,
            ],
            [
                'name' => 'Early AI Symposium 2025', 'code' => 'AI-25',
                'description' => 'Another past event to test date filtering logic.',
                'category' => 'Technology', 'start_date' => '2025-08-15', 'end_date' => '2025-08-17',
                'submission_deadline' => '2025-07-01', 'city' => 'Cape Town', 'country' => 'South Africa',
                'format' => 'virtual', 'submission_status' => 'closed', 'organiser_id' => 1,
            ]
        ];

        foreach ($conferences as $conf) {
            Conference::create($conf);
        }
    }
}