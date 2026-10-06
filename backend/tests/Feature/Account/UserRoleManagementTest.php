<?php

namespace Tests\Feature\Account;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRoleManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_change_another_users_role(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $user = User::factory()->create([
            'role' => 'author',
        ]);

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->patchJson(
                "/api/v1/users/{$user->id}/role",
                [
                    'role' => 'reviewer',
                ]
            );

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'reviewer');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'reviewer',
        ]);
    }

    public function test_non_admin_cannot_change_user_role(): void
    {
        $author = User::factory()->create([
            'role' => 'author',
        ]);

        $target = User::factory()->create([
            'role' => 'attendee',
        ]);

        $this
            ->actingAs($author, 'sanctum')
            ->patchJson(
                "/api/v1/users/{$target->id}/role",
                [
                    'role' => 'reviewer',
                ]
            )
            ->assertForbidden();

        $this->assertDatabaseHas('users', [
            'id' => $target->id,
            'role' => 'attendee',
        ]);
    }

    public function test_guest_cannot_change_user_role(): void
    {
        $target = User::factory()->create([
            'role' => 'author',
        ]);

        $this
            ->patchJson(
                "/api/v1/users/{$target->id}/role",
                [
                    'role' => 'reviewer',
                ]
            )
            ->assertUnauthorized();

        $this->assertDatabaseHas('users', [
            'id' => $target->id,
            'role' => 'author',
        ]);
    }

    public function test_invalid_role_is_rejected(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $target = User::factory()->create([
            'role' => 'author',
        ]);

        $this
            ->actingAs($admin, 'sanctum')
            ->patchJson(
                "/api/v1/users/{$target->id}/role",
                [
                    'role' => 'super-admin',
                ]
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'role',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $target->id,
            'role' => 'author',
        ]);
    }

    public function test_unknown_user_returns_not_found(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this
            ->actingAs($admin, 'sanctum')
            ->patchJson(
                '/api/v1/users/999999/role',
                [
                    'role' => 'reviewer',
                ]
            )
            ->assertNotFound();
    }

    public function test_admin_cannot_remove_their_own_admin_role(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this
            ->actingAs($admin, 'sanctum')
            ->patchJson(
                "/api/v1/users/{$admin->id}/role",
                [
                    'role' => 'attendee',
                ]
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'role',
            ]);

        $admin->refresh();

        $this->assertSame(
            'admin',
            $admin->role
        );

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'role' => 'admin',
        ]);
    }

    public function test_admin_can_assign_every_supported_role_to_other_users(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $roles = [
            'admin',
            'organiser',
            'reviewer',
            'author',
            'attendee',
        ];

        foreach ($roles as $role) {
            $target = User::factory()->create([
                'role' => 'author',
            ]);

            $this
                ->actingAs($admin, 'sanctum')
                ->patchJson(
                    "/api/v1/users/{$target->id}/role",
                    [
                        'role' => $role,
                    ]
                )
                ->assertOk()
                ->assertJsonPath(
                    'data.role',
                    $role
                );

            $this->assertDatabaseHas('users', [
                'id' => $target->id,
                'role' => $role,
            ]);
        }
    }
}
