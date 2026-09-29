<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Reviews\Models\SubmissionReview;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewApiTest extends TestCase
{
    use RefreshDatabase;

    private function ownedSubmission(): array
    {
        $organiser = User::factory()->create(['role' => 'organiser']);

        $conference = Conference::factory()
            ->for($organiser, 'organiser')
            ->create();

        $submission = Submission::factory()
            ->for($conference)
            ->create();

        return [$organiser, $submission];
    }

    private function createReview(
        Submission $submission,
        User $reviewer,
        array $overrides = []
    ): SubmissionReview {
        return SubmissionReview::create(array_merge([
            'submission_id' => $submission->id,
            'reviewer_id' => $reviewer->id,
            'assigned_at' => now(),
        ], $overrides));
    }

    public function test_review_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/reviews')
            ->assertUnauthorized();

        $this->getJson('/api/v1/reviews/pending')
            ->assertUnauthorized();

        $this->postJson('/api/v1/reviews', [])
            ->assertUnauthorized();

        $this->getJson('/api/v1/reviews/1')
            ->assertUnauthorized();

        $this->postJson('/api/v1/reviews/1/submit', [])
            ->assertUnauthorized();

        $this->postJson('/api/v1/reviews/1/lock')
            ->assertUnauthorized();

        $this->deleteJson('/api/v1/reviews/1')
            ->assertUnauthorized();
    }

    public function test_author_cannot_list_reviews(): void
    {
        $author = User::factory()->create(['role' => 'author']);

        $this->actingAs($author, 'sanctum')
            ->getJson('/api/v1/reviews')
            ->assertForbidden();
    }

    public function test_owner_organiser_can_assign_reviewer(): void
    {
        [$organiser, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);

        $this->actingAs($organiser, 'sanctum')
            ->postJson('/api/v1/reviews', [
                'submission_id' => $submission->id,
                'reviewer_id' => $reviewer->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.submission_id', $submission->id)
            ->assertJsonPath('data.reviewer_id', $reviewer->id);

        $this->assertDatabaseHas('submission_reviews', [
            'submission_id' => $submission->id,
            'reviewer_id' => $reviewer->id,
        ]);

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => 'under_review',
        ]);
    }

    public function test_admin_can_assign_reviewer(): void
    {
        [, $submission] = $this->ownedSubmission();

        $admin = User::factory()->create(['role' => 'admin']);
        $reviewer = User::factory()->create(['role' => 'reviewer']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/reviews', [
                'submission_id' => $submission->id,
                'reviewer_id' => $reviewer->id,
            ])
            ->assertCreated();
    }

    public function test_non_owner_organiser_cannot_assign_reviewer(): void
    {
        [, $submission] = $this->ownedSubmission();

        $otherOrganiser = User::factory()->create([
            'role' => 'organiser',
        ]);

        $reviewer = User::factory()->create([
            'role' => 'reviewer',
        ]);

        $this->actingAs($otherOrganiser, 'sanctum')
            ->postJson('/api/v1/reviews', [
                'submission_id' => $submission->id,
                'reviewer_id' => $reviewer->id,
            ])
            ->assertForbidden();
    }

    public function test_assignment_requires_user_with_reviewer_role(): void
    {
        [$organiser, $submission] = $this->ownedSubmission();

        $author = User::factory()->create(['role' => 'author']);

        $this->actingAs($organiser, 'sanctum')
            ->postJson('/api/v1/reviews', [
                'submission_id' => $submission->id,
                'reviewer_id' => $author->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['reviewer_id']);
    }

    public function test_duplicate_reviewer_assignment_is_rejected(): void
    {
        [$organiser, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);

        $this->createReview($submission, $reviewer);

        $this->actingAs($organiser, 'sanctum')
            ->postJson('/api/v1/reviews', [
                'submission_id' => $submission->id,
                'reviewer_id' => $reviewer->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['reviewer_id']);
    }

    public function test_reviewer_only_lists_own_reviews(): void
    {
        [, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);
        $otherReviewer = User::factory()->create(['role' => 'reviewer']);

        $ownReview = $this->createReview($submission, $reviewer);

        $this->createReview(
            Submission::factory()->create(),
            $otherReviewer
        );

        $this->actingAs($reviewer, 'sanctum')
            ->getJson('/api/v1/reviews')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownReview->id);
    }

    public function test_reviewer_pending_endpoint_only_returns_unsubmitted_reviews(): void
    {
        [, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);

        $pendingReview = $this->createReview($submission, $reviewer);

        $this->createReview(
            Submission::factory()->create(),
            $reviewer,
            [
                'score' => 8,
                'comments' => 'Already submitted review.',
                'recommendation' => 'accept',
                'submitted_at' => now(),
            ]
        );

        $this->actingAs($reviewer, 'sanctum')
            ->getJson('/api/v1/reviews/pending')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pendingReview->id);
    }

    public function test_reviewer_can_view_own_review(): void
    {
        [, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);
        $review = $this->createReview($submission, $reviewer);

        $this->actingAs($reviewer, 'sanctum')
            ->getJson("/api/v1/reviews/{$review->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $review->id);
    }

    public function test_reviewer_cannot_view_another_reviewers_review(): void
    {
        [, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);
        $otherReviewer = User::factory()->create(['role' => 'reviewer']);

        $review = $this->createReview($submission, $reviewer);

        $this->actingAs($otherReviewer, 'sanctum')
            ->getJson("/api/v1/reviews/{$review->id}")
            ->assertForbidden();
    }

    public function test_assigned_reviewer_can_submit_review(): void
    {
        [, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);
        $review = $this->createReview($submission, $reviewer);

        $this->actingAs($reviewer, 'sanctum')
            ->postJson("/api/v1/reviews/{$review->id}/submit", [
                'score' => 8,
                'comments' => 'A well-written submission.',
                'recommendation' => 'accept',
            ])
            ->assertOk()
            ->assertJsonPath('data.score', 8)
            ->assertJsonPath('data.recommendation', 'accept');

        $this->assertDatabaseHas('submission_reviews', [
            'id' => $review->id,
            'score' => 8,
            'recommendation' => 'accept',
        ]);

        $this->assertNotNull($review->fresh()->submitted_at);
    }

    public function test_review_submission_validates_score_comments_and_recommendation(): void
    {
        [, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);
        $review = $this->createReview($submission, $reviewer);

        $this->actingAs($reviewer, 'sanctum')
            ->postJson("/api/v1/reviews/{$review->id}/submit", [
                'score' => 11,
                'comments' => 'No',
                'recommendation' => 'maybe',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'score',
                'comments',
                'recommendation',
            ]);
    }

    public function test_unassigned_reviewer_cannot_submit_review(): void
    {
        [, $submission] = $this->ownedSubmission();

        $assignedReviewer = User::factory()->create([
            'role' => 'reviewer',
        ]);

        $otherReviewer = User::factory()->create([
            'role' => 'reviewer',
        ]);

        $review = $this->createReview(
            $submission,
            $assignedReviewer
        );

        $this->actingAs($otherReviewer, 'sanctum')
            ->postJson("/api/v1/reviews/{$review->id}/submit", [
                'score' => 8,
                'comments' => 'Unauthorized review.',
                'recommendation' => 'accept',
            ])
            ->assertForbidden();
    }

    public function test_pending_review_cannot_be_locked(): void
    {
        [, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);
        $review = $this->createReview($submission, $reviewer);

        $this->actingAs($reviewer, 'sanctum')
            ->postJson("/api/v1/reviews/{$review->id}/lock")
            ->assertForbidden();
    }

    public function test_assigned_reviewer_can_lock_submitted_review(): void
    {
        [, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);

        $review = $this->createReview($submission, $reviewer, [
            'score' => 8,
            'comments' => 'Submitted review.',
            'recommendation' => 'accept',
            'submitted_at' => now(),
        ]);

        $this->actingAs($reviewer, 'sanctum')
            ->postJson("/api/v1/reviews/{$review->id}/lock")
            ->assertOk()
            ->assertJsonPath('data.locked', true);

        $this->assertDatabaseHas('submission_reviews', [
            'id' => $review->id,
            'locked' => true,
        ]);
    }

    public function test_locked_review_cannot_be_resubmitted_or_deleted(): void
    {
        [, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);

        $review = $this->createReview($submission, $reviewer, [
            'score' => 7,
            'comments' => 'Locked review.',
            'recommendation' => 'revise',
            'submitted_at' => now(),
            'locked' => true,
        ]);

        $this->actingAs($reviewer, 'sanctum')
            ->postJson("/api/v1/reviews/{$review->id}/submit", [
                'score' => 9,
                'comments' => 'Attempted change.',
                'recommendation' => 'accept',
            ])
            ->assertForbidden();

        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/reviews/{$review->id}")
            ->assertForbidden();
    }

    public function test_owner_organiser_can_delete_unlocked_review_assignment(): void
    {
        [$organiser, $submission] = $this->ownedSubmission();

        $reviewer = User::factory()->create(['role' => 'reviewer']);
        $review = $this->createReview($submission, $reviewer);

        $this->actingAs($organiser, 'sanctum')
            ->deleteJson("/api/v1/reviews/{$review->id}")
            ->assertOk();

        $this->assertDatabaseMissing('submission_reviews', [
            'id' => $review->id,
        ]);
    }

    public function test_nonexistent_review_returns_404(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/reviews/999999')
            ->assertNotFound();
    }
}