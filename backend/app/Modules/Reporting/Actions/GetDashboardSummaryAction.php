<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Registrations\Models\Registration;
use App\Modules\Reviews\Models\SubmissionReview;
use App\Modules\Submissions\Models\Submission;

class GetDashboardSummaryAction
{
    public function execute(): array
    {
        return [
            'total_users' => User::query()->count(),

            'total_conferences' => Conference::query()->count(),

            'total_submissions' => Submission::query()->count(),

            'accepted_submissions' => Submission::query()
                ->where(
                    'status',
                    'accepted'
                )
                ->count(),

            'total_reviews' => SubmissionReview::query()->count(),

            'total_registrations' => Registration::query()->count(),
        ];
    }
}
