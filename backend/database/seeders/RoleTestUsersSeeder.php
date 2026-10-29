<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleTestUsersSeeder extends Seeder
{
    public function run(): void
    {
        $password = 'Password123!';

        $users = [
            [
                'name' => 'CMT Admin',
                'email' => 'admin@cmt.test',
                'role' => 'admin',
            ],
            [
                'name' => 'CMT Organiser',
                'email' => 'organiser@cmt.test',
                'role' => 'organiser',
            ],
            [
                'name' => 'CMT Author',
                'email' => 'author@cmt.test',
                'role' => 'author',
            ],
            [
                'name' => 'CMT Reviewer',
                'email' => 'reviewer@cmt.test',
                'role' => 'reviewer',
            ],
            [
                'name' => 'CMT Attendee',
                'email' => 'attendee@cmt.test',
                'role' => 'attendee',
            ],
        ];

        foreach ($users as $data) {
            $user = User::updateOrCreate(
                [
                    'email' => $data['email'],
                ],
                [
                    'name' => $data['name'],
                    'role' => $data['role'],
                    'password' => Hash::make($password),
                ]
            );

            /*
             * All presentation/testing accounts are verified
             * so login does not depend on email delivery.
             */
            $user->forceFill([
                'email_verified_at' => now(),
            ])->save();

            /*
             * Remove old API tokens when re-running
             * the seeder so testing starts clean.
             */
            $user->tokens()->delete();
        }

        $this->command?->info(
            'CMT role test users seeded successfully.'
        );

        $this->command?->table(
            [
                'Role',
                'Email',
                'Password',
            ],
            [
                [
                    'Admin',
                    'admin@cmt.test',
                    $password,
                ],
                [
                    'Organiser',
                    'organiser@cmt.test',
                    $password,
                ],
                [
                    'Author',
                    'author@cmt.test',
                    $password,
                ],
                [
                    'Reviewer',
                    'reviewer@cmt.test',
                    $password,
                ],
                [
                    'Attendee',
                    'attendee@cmt.test',
                    $password,
                ],
            ]
        );
    }
}
