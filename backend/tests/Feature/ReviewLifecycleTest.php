<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Reviews\Models\SubmissionReview;
use App\Modules\Submissions\Models\Submission;
use App\Notifications\CmtNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ReviewLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function makeReview(): array
    {
        $organiser = User::factory()->create([
            'role' => 'organiser',
        ]);

        $author = User::factory()->create([
            'role' => 'author',
        ]);

        $reviewer = User::factory()->create([
            'role' => 'reviewer',
        ]);

        $conference = Conference::factory()
            ->for(
                $organiser,
                'organiser'
            )
            ->create();

        $submission = Submission::factory()
            ->for(
                $conference,
                'conference'
            )
            ->for(
                $author,
                'author'
            )
            ->create([
                'status' => 'under_review',
            ]);

        $review = SubmissionReview::create([
            'submission_id' => $submission->id,
            'reviewer_id' => $reviewer->id,
            'assigned_at' => now(),
            'locked' => false,
        ]);

        return [
            $author,
            $reviewer,
            $review,
        ];
    }

    public function test_submit_keeps_review_unlocked_and_allows_resubmission_until_lock(): void
    {
        Notification::fake();

        [
            $author,
            $reviewer,
            $review,
        ] = $this->makeReview();

        $this->actingAs(
            $reviewer,
            'sanctum'
        )
            ->postJson(
                "/api/v1/reviews/{$review->id}/submit",
                [
                    'score' => 3,
                    'comments' => 'Initial reviewer comments.',
                    'recommendation' => 'revise',
                ]
            )
            ->assertOk()
            ->assertJsonPath(
                'data.locked',
                false
            )
            ->assertJsonPath(
                'data.score',
                3
            )
            ->assertJsonPath(
                'data.recommendation',
                'revise'
            );

        $review->refresh();

        $this->assertNotNull(
            $review->submitted_at
        );

        $this->assertFalse(
            $review->locked
        );

        Notification::assertSentToTimes(
            $author,
            CmtNotification::class,
            1
        );

        $this->actingAs(
            $reviewer,
            'sanctum'
        )
            ->postJson(
                "/api/v1/reviews/{$review->id}/submit",
                [
                    'score' => 5,
                    'comments' => 'Updated reviewer comments.',
                    'recommendation' => 'accept',
                ]
            )
            ->assertOk()
            ->assertJsonPath(
                'data.locked',
                false
            )
            ->assertJsonPath(
                'data.score',
                5
            )
            ->assertJsonPath(
                'data.comments',
                'Updated reviewer comments.'
            )
            ->assertJsonPath(
                'data.recommendation',
                'accept'
            );

        Notification::assertSentToTimes(
            $author,
            CmtNotification::class,
            1
        );
    }

    public function test_submitted_review_can_be_locked_and_then_cannot_be_resubmitted(): void
    {
        [
            ,
            $reviewer,
            $review,
        ] = $this->makeReview();

        $this->actingAs(
            $reviewer,
            'sanctum'
        )
            ->postJson(
                "/api/v1/reviews/{$review->id}/submit",
                [
                    'score' => 4,
                    'comments' => 'Ready to lock.',
                    'recommendation' => 'accept',
                ]
            )
            ->assertOk()
            ->assertJsonPath(
                'data.locked',
                false
            );

        $this->actingAs(
            $reviewer,
            'sanctum'
        )
            ->postJson(
                "/api/v1/reviews/{$review->id}/lock"
            )
            ->assertOk()
            ->assertJsonPath(
                'data.locked',
                true
            );

        $this->actingAs(
            $reviewer,
            'sanctum'
        )
            ->postJson(
                "/api/v1/reviews/{$review->id}/submit",
                [
                    'score' => 5,
                    'comments' => 'This must not be accepted.',
                    'recommendation' => 'accept',
                ]
            )
            ->assertForbidden();

        $review->refresh();

        $this->assertTrue(
            $review->locked
        );

        $this->assertSame(
            4,
            $review->score
        );

        $this->assertSame(
            'Ready to lock.',
            $review->comments
        );
    }
}
