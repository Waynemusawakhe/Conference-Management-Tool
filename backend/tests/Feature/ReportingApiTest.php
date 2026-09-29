<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Registrations\Models\Registration;
use App\Modules\Reviews\Models\SubmissionReview;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_reporting_requires_authentication(): void
    {
        $endpoints = [
            '/api/v1/reports/dashboard',
            '/api/v1/reports/submissions',
            '/api/v1/reports/reviews',
            '/api/v1/reports/registrations',
            '/api/v1/reports/conferences',
        ];

        foreach ($endpoints as $endpoint) {
            $this->getJson($endpoint)->assertUnauthorized();
        }
    }

    public function test_reporting_requires_admin_role(): void
    {
        $organiser = User::factory()->create([
            'role' => 'organiser',
        ]);

        $endpoints = [
            '/api/v1/reports/dashboard',
            '/api/v1/reports/submissions',
            '/api/v1/reports/reviews',
            '/api/v1/reports/registrations',
            '/api/v1/reports/conferences',
        ];

        foreach ($endpoints as $endpoint) {
            $this->actingAs($organiser, 'sanctum')
                ->getJson($endpoint)
                ->assertForbidden();
        }
    }

    public function test_admin_can_view_dashboard_summary(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Conference::factory()->create();

        Submission::factory()->create([
            'status' => 'accepted',
        ]);

        Submission::factory()->create([
            'status' => 'pending',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/reports/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_users',
                    'total_conferences',
                    'total_submissions',
                    'accepted_submissions',
                    'total_reviews',
                    'total_registrations',
                ],
            ])
            ->assertJsonPath('data.total_submissions', 2)
            ->assertJsonPath('data.accepted_submissions', 1);
    }

    public function test_submission_report_returns_statistics_and_filters_by_conference(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $conference = Conference::factory()->create();
        $otherConference = Conference::factory()->create();

        Submission::factory()
            ->for($conference)
            ->create(['status' => 'pending']);

        Submission::factory()
            ->for($conference)
            ->create(['status' => 'accepted']);

        Submission::factory()
            ->for($otherConference)
            ->create(['status' => 'rejected']);

        $this->actingAs($admin, 'sanctum')
            ->getJson(
                "/api/v1/reports/submissions?conference_id={$conference->id}"
            )
            ->assertOk()
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.by_status.pending', 1)
            ->assertJsonPath('data.by_status.accepted', 1)
            ->assertJsonPath('data.by_status.rejected', 0);
    }

    public function test_submission_report_can_filter_by_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Submission::factory()->create(['status' => 'pending']);
        Submission::factory()->create(['status' => 'accepted']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/reports/submissions?status=accepted')
            ->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.by_status.accepted', 1)
            ->assertJsonPath('data.by_status.pending', 0);
    }

    public function test_review_report_returns_actual_statistics(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $conference = Conference::factory()->create();

        $submissionOne = Submission::factory()
            ->for($conference)
            ->create();

        $submissionTwo = Submission::factory()
            ->for($conference)
            ->create();

        $reviewer = User::factory()->create(['role' => 'reviewer']);

        SubmissionReview::create([
            'submission_id' => $submissionOne->id,
            'reviewer_id' => $reviewer->id,
            'score' => 8,
            'comments' => 'Good submission.',
            'recommendation' => 'accept',
            'submitted_at' => now(),
            'locked' => true,
        ]);

        SubmissionReview::create([
            'submission_id' => $submissionTwo->id,
            'reviewer_id' => User::factory()
                ->create(['role' => 'reviewer'])
                ->id,
            'locked' => false,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson(
                "/api/v1/reports/reviews?conference_id={$conference->id}"
            )
            ->assertOk()
            ->assertJsonPath('data.total_reviews', 2)
            ->assertJsonPath('data.submitted_reviews', 1)
            ->assertJsonPath('data.pending_reviews', 1)
            ->assertJsonPath('data.locked_reviews', 1)
            ->assertJsonPath('data.completion_percentage', 50)
            ->assertJsonPath('data.recommendations.accept', 1)
            ->assertJsonPath('data.recommendations.reject', 0)
            ->assertJsonPath('data.recommendations.revise', 0);
    }

    public function test_registration_report_returns_actual_statistics(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $conference = Conference::factory()->create();
        $otherConference = Conference::factory()->create();

        Registration::create([
            'conference_id' => $conference->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'registered',
        ]);

        Registration::create([
            'conference_id' => $conference->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        Registration::create([
            'conference_id' => $otherConference->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'registered',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson(
                "/api/v1/reports/registrations?conference_id={$conference->id}"
            )
            ->assertOk()
            ->assertJsonPath('data.total_registrations', 2)
            ->assertJsonPath('data.registered', 1)
            ->assertJsonPath('data.cancelled', 1)
            ->assertJsonPath('data.registration_rate', 50);
    }

    public function test_registration_report_can_filter_by_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $conference = Conference::factory()->create();

        Registration::create([
            'conference_id' => $conference->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'registered',
        ]);

        Registration::create([
            'conference_id' => $conference->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/reports/registrations?status=cancelled')
            ->assertOk()
            ->assertJsonPath('data.total_registrations', 1)
            ->assertJsonPath('data.registered', 0)
            ->assertJsonPath('data.cancelled', 1)
            ->assertJsonPath('data.registration_rate', 0);
    }

    public function test_conference_report_returns_format_and_category_statistics(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Conference::factory()->create([
            'format' => 'virtual',
            'submission_status' => 'open',
            'category' => 'Technology',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-03',
        ]);

        Conference::factory()->create([
            'format' => 'hybrid',
            'submission_status' => 'closed',
            'category' => 'Business',
            'start_date' => '2027-01-10',
            'end_date' => '2027-01-12',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson(
                '/api/v1/reports/conferences?date_from=2026-10-01&date_to=2026-12-31'
            )
            ->assertOk()
            ->assertJsonPath('data.total_conferences', 1)
            ->assertJsonPath('data.open_conferences', 1)
            ->assertJsonPath('data.closed_conferences', 0)
            ->assertJsonPath('data.formats.virtual', 1)
            ->assertJsonPath('data.formats.hybrid', 0)
            ->assertJsonPath('data.categories.Technology', 1);
    }

    public function test_reporting_rejects_invalid_filters(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/reports/submissions?status=invalid')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);

        $this->actingAs($admin, 'sanctum')
            ->getJson(
                '/api/v1/reports/reviews?date_from=2026-10-02&date_to=2026-10-01'
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['date_to']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/reports/registrations?status=invalid')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/reports/submissions?conference_id=999999')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['conference_id']);
    }
}