<?php

namespace Tests\Feature\Submissions;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SubmissionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_list_submissions(): void
    {
        $this->getJson('/api/v1/submissions')->assertUnauthorized();
    }

    public function test_author_can_create_submission(): void
    {
        $author = User::factory()->create([
            'role' => 'author',
        ]);

        $conference = Conference::factory()->create();

        $response = $this
            ->actingAs($author, 'sanctum')
            ->postJson('/api/v1/submissions', [
                'conference_id' => $conference->id,
                'title' => 'A Great Paper',
                'abstract' => 'This paper explores...',
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('submissions', [
            'title' => 'A Great Paper',
            'author_id' => $author->id,
            'conference_id' => $conference->id,
            'status' => 'pending',
        ]);
    }

    public function test_create_submission_requires_valid_conference(): void
    {
        $author = User::factory()->create();

        $this->actingAs($author, 'sanctum')
            ->postJson('/api/v1/submissions', [
                'conference_id' => 999999,
                'title' => 'Paper',
                'abstract' => 'Abstract',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['conference_id']);
    }

    public function test_create_submission_requires_title_and_abstract(): void
    {
        $author = User::factory()->create();
        $conference = Conference::factory()->create();

        $this->actingAs($author, 'sanctum')
            ->postJson('/api/v1/submissions', ['conference_id' => $conference->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'abstract']);
    }

    public function test_guest_cannot_download_submission_file(): void
    {
        $submission = Submission::factory()->create([
            'file_path' => 'submissions/test.pdf',
            'file_size_bytes' => 100,
        ]);

        $this->get(
            "/api/v1/submissions/{$submission->id}/file"
        )->assertUnauthorized();
    }

    public function test_author_can_download_own_submission_file(): void
    {
        Storage::fake('private');

        $author = User::factory()->create([
            'role' => 'author',
        ]);

        Storage::disk('private')->put(
            'submissions/test.pdf',
            'fake pdf content'
        );

        $submission = Submission::factory()
            ->for($author, 'author')
            ->create([
                'file_path' => 'submissions/test.pdf',
                'file_size_bytes' => 16,
            ]);

        $response = $this
            ->actingAs($author, 'sanctum')
            ->get(
                "/api/v1/submissions/{$submission->id}/file"
            );

        $response->assertOk();

        $this->assertStringContainsString(
            'attachment',
            (string) $response->headers->get(
                'content-disposition'
            )
        );
    }

    public function test_submission_response_does_not_expose_private_file_path(): void
    {
        $author = User::factory()->create([
            'role' => 'author',
        ]);

        $submission = Submission::factory()
            ->for($author, 'author')
            ->create([
                'file_path' => 'submissions/secret-file.pdf',
                'file_size_bytes' => 500,
            ]);

        $this
            ->actingAs(
                $author,
                'sanctum'
            )
            ->getJson(
                "/api/v1/submissions/{$submission->id}"
            )
            ->assertOk()
            ->assertJsonMissingPath(
                'file_path'
            )
            ->assertJsonPath(
                'has_file',
                true
            )
            ->assertJsonPath(
                'file_size_bytes',
                500
            );
    }

    public function test_author_cannot_download_another_authors_submission_file(): void
    {
        Storage::fake('private');

        $owner = User::factory()->create([
            'role' => 'author',
        ]);

        $otherAuthor = User::factory()->create([
            'role' => 'author',
        ]);

        Storage::disk('private')->put(
            'submissions/private-paper.pdf',
            'private content'
        );

        $submission = Submission::factory()
            ->for($owner, 'author')
            ->create([
                'file_path' => 'submissions/private-paper.pdf',
            ]);

        $this
            ->actingAs(
                $otherAuthor,
                'sanctum'
            )
            ->get(
                "/api/v1/submissions/{$submission->id}/file"
            )
            ->assertForbidden();
    }

    public function test_download_returns_404_when_submission_has_no_file(): void
    {
        Storage::fake('private');

        $author = User::factory()->create([
            'role' => 'author',
        ]);

        $submission = Submission::factory()
            ->for($author, 'author')
            ->create([
                'file_path' => null,
                'file_size_bytes' => null,
            ]);

        $this
            ->actingAs(
                $author,
                'sanctum'
            )
            ->get(
                "/api/v1/submissions/{$submission->id}/file"
            )
            ->assertNotFound();
    }

    public function test_author_can_view_own_submission(): void
    {
        $author = User::factory()->create();
        $submission = Submission::factory()->for($author, 'author')->create();

        $this->actingAs($author, 'sanctum')
            ->getJson("/api/v1/submissions/{$submission->id}")
            ->assertOk()
            ->assertJsonFragment(['id' => $submission->id]);
    }

    public function test_author_cannot_view_another_authors_submission(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $submission = Submission::factory()->for($owner, 'author')->create();

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/v1/submissions/{$submission->id}")
            ->assertForbidden();
    }

    public function test_author_can_update_own_pending_submission(): void
    {
        $author = User::factory()->create();
        $submission = Submission::factory()->for($author, 'author')->create([
            'status' => 'pending',
        ]);

        $this->actingAs($author, 'sanctum')
            ->putJson("/api/v1/submissions/{$submission->id}", ['title' => 'Updated Title'])
            ->assertOk()
            ->assertJsonFragment(['title' => 'Updated Title']);
    }

    public function test_author_cannot_update_another_authors_submission(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $submission = Submission::factory()->for($owner, 'author')->create();

        $this->actingAs($other, 'sanctum')
            ->putJson("/api/v1/submissions/{$submission->id}", ['title' => 'Hacked'])
            ->assertForbidden();
    }

    public function test_author_cannot_update_submission_once_under_review(): void
    {
        $author = User::factory()->create();
        $submission = Submission::factory()->for($author, 'author')->create([
            'status' => 'under_review',
        ]);

        $this->actingAs($author, 'sanctum')
            ->putJson("/api/v1/submissions/{$submission->id}", ['title' => 'Nope'])
            ->assertForbidden();
    }

    public function test_author_can_delete_own_pending_submission(): void
    {
        $author = User::factory()->create();
        $submission = Submission::factory()->for($author, 'author')->create([
            'status' => 'pending',
        ]);

        $this->actingAs($author, 'sanctum')
            ->deleteJson("/api/v1/submissions/{$submission->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('submissions', ['id' => $submission->id]);
    }

    public function test_author_cannot_delete_submission_once_under_review(): void
    {
        $author = User::factory()->create();
        $submission = Submission::factory()->for($author, 'author')->create([
            'status' => 'under_review',
        ]);

        $this->actingAs($author, 'sanctum')
            ->deleteJson("/api/v1/submissions/{$submission->id}")
            ->assertForbidden();
    }
}
