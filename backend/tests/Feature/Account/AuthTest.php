<?php

namespace Tests\Feature\Account;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        Notification::fake();

        $response = $this->postJson(
            '/api/v1/auth/register',
            [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'author',
            ]
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'success',
                true
            );

        $this->assertDatabaseHas(
            'users',
            [
                'email' => 'john@example.com',
                'role' => 'author',
            ]
        );
    }

    public function test_public_registration_cannot_create_admin_account(): void
    {
        Notification::fake();

        $response = $this->postJson(
            '/api/v1/auth/register',
            [
                'name' => 'Fake Admin',
                'email' => 'admin@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'admin',
            ]
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'role',
            ]);

        $this->assertDatabaseMissing(
            'users',
            [
                'email' => 'admin@example.com',
            ]
        );
    }

    public function test_public_registration_can_create_reviewer_account(): void
    {
        Notification::fake();

        $response = $this->postJson(
            '/api/v1/auth/register',
            [
                'name' => 'Reviewer User',
                'email' => 'reviewer@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'reviewer',
            ]
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'success',
                true
            );

        $this->assertDatabaseHas(
            'users',
            [
                'email' => 'reviewer@example.com',
                'role' => 'reviewer',
            ]
        );
    }

    public function test_verified_user_can_login_with_correct_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'jane@example.com',
            'password' => Hash::make(
                'password123'
            ),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson(
            '/api/v1/auth/login',
            [
                'email' => $user->email,
                'password' => 'password123',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'success',
                true
            )
            ->assertJsonStructure([
                'data' => [
                    'user',
                    'token',
                    'token_type',
                ],
            ]);
    }

    public function test_unverified_user_cannot_login(): void
    {
        $user = User::factory()
            ->unverified()
            ->create([
                'email' => 'unverified@example.com',
                'password' => Hash::make(
                    'password123'
                ),
            ]);

        $response = $this->postJson(
            '/api/v1/auth/login',
            [
                'email' => $user->email,
                'password' => 'password123',
            ]
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ]);

        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );
    }

    public function test_login_fails_with_incorrect_password(): void
    {
        User::factory()->create([
            'email' => 'jane@example.com',
            'password' => Hash::make(
                'password123'
            ),
        ]);

        $response = $this->postJson(
            '/api/v1/auth/login',
            [
                'email' => 'jane@example.com',
                'password' => 'wrong-password',
            ]
        );

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_access_me_endpoint(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs(
                $user,
                'sanctum'
            )
            ->getJson(
                '/api/v1/auth/me'
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.id',
                $user->id
            );
    }

    public function test_guest_cannot_access_me_endpoint(): void
    {
        $this->getJson(
            '/api/v1/auth/me'
        )->assertUnauthorized();
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        $token = $user
            ->createToken(
                'test-token'
            )
            ->plainTextToken;

        $response = $this
            ->withHeader(
                'Authorization',
                "Bearer {$token}"
            )
            ->postJson(
                '/api/v1/auth/logout'
            );

        $response->assertOk();
    }

    public function test_password_reset_changes_password_and_revokes_existing_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'reset@example.com',
            'password' => Hash::make(
                'old-password'
            ),
        ]);

        $user->createToken(
            'existing-session'
        );

        $this->assertDatabaseHas(
            'personal_access_tokens',
            [
                'tokenable_id' => $user->id,
            ]
        );

        $resetToken =
            Password::broker()
                ->createToken(
                    $user
                );

        $response = $this->postJson(
            '/api/v1/auth/reset-password',
            [
                'token' => $resetToken,
                'email' => $user->email,
                'password' => 'new-password123',
                'password_confirmation' => 'new-password123',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'success',
                true
            );

        $user->refresh();

        $this->assertTrue(
            Hash::check(
                'new-password123',
                $user->password
            )
        );

        $this->assertDatabaseMissing(
            'personal_access_tokens',
            [
                'tokenable_id' => $user->id,
            ]
        );
    }

    public function test_invalid_password_reset_token_is_rejected(): void
    {
        $user = User::factory()->create([
            'email' => 'reset@example.com',
        ]);

        $response = $this->postJson(
            '/api/v1/auth/reset-password',
            [
                'token' => 'invalid-reset-token',
                'email' => $user->email,
                'password' => 'new-password123',
                'password_confirmation' => 'new-password123',
            ]
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ]);
    }

    public function test_non_admin_cannot_access_users_list(): void
    {
        $user = User::factory()->create([
            'role' => 'author',
        ]);

        $response = $this
            ->actingAs(
                $user,
                'sanctum'
            )
            ->getJson(
                '/api/v1/users'
            );

        $response->assertForbidden();
    }

    public function test_admin_can_access_users_list(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        User::factory()
            ->count(3)
            ->create();

        $response = $this
            ->actingAs(
                $admin,
                'sanctum'
            )
            ->getJson(
                '/api/v1/users'
            );

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    public function test_guest_cannot_access_users_list(): void
    {
        $this->getJson(
            '/api/v1/users'
        )->assertUnauthorized();
    }

    public function test_authenticated_user_can_delete_own_account(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make(
                'password123'
            ),
        ]);

        $user->createToken(
            'test-session'
        );

        $response = $this
            ->actingAs(
                $user,
                'sanctum'
            )
            ->deleteJson(
                '/api/v1/auth/me',
                [
                    'current_password' => 'password123',
                ]
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'success',
                true
            );

        $this->assertDatabaseMissing(
            'users',
            [
                'id' => $user->id,
            ]
        );

        $this->assertDatabaseMissing(
            'personal_access_tokens',
            [
                'tokenable_id' => $user->id,
            ]
        );
    }

    public function test_account_deletion_requires_correct_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make(
                'password123'
            ),
        ]);

        $this
            ->actingAs(
                $user,
                'sanctum'
            )
            ->deleteJson(
                '/api/v1/auth/me',
                [
                    'current_password' => 'wrong-password',
                ]
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'current_password',
            ]);

        $this->assertDatabaseHas(
            'users',
            [
                'id' => $user->id,
            ]
        );
    }

    public function test_guest_cannot_delete_account(): void
    {
        $this
            ->deleteJson(
                '/api/v1/auth/me',
                [
                    'current_password' => 'password123',
                ]
            )
            ->assertUnauthorized();
    }

    public function test_user_cannot_delete_account_while_owning_conference(): void
    {
        $organiser = User::factory()->create([
            'role' => 'organiser',
            'password' => Hash::make(
                'password123'
            ),
        ]);

        Conference::factory()->create([
            'organiser_id' => $organiser->id,
        ]);

        $this
            ->actingAs(
                $organiser,
                'sanctum'
            )
            ->deleteJson(
                '/api/v1/auth/me',
                [
                    'current_password' => 'password123',
                ]
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'account',
            ]);

        $this->assertDatabaseHas(
            'users',
            [
                'id' => $organiser->id,
            ]
        );
    }

    public function test_deleting_author_account_removes_private_submission_files(): void
    {
        Storage::fake(
            'private'
        );

        $author = User::factory()->create([
            'role' => 'author',
            'password' => Hash::make(
                'password123'
            ),
        ]);

        Storage::disk(
            'private'
        )->put(
            'submissions/account-delete-test.pdf',
            'test document'
        );

        Submission::factory()
            ->for(
                $author,
                'author'
            )
            ->create([
                'file_path' => 'submissions/account-delete-test.pdf',
                'file_size_bytes' => 13,
            ]);

        $this
            ->actingAs(
                $author,
                'sanctum'
            )
            ->deleteJson(
                '/api/v1/auth/me',
                [
                    'current_password' => 'password123',
                ]
            )
            ->assertOk();

        Storage::disk(
            'private'
        )->assertMissing(
            'submissions/account-delete-test.pdf'
        );

        $this->assertDatabaseMissing(
            'users',
            [
                'id' => $author->id,
            ]
        );
    }
}
