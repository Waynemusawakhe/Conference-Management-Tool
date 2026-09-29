<?php   

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Submissions\Models\Submission;
use App\Modules\Reviews\Models\SubmissionReview;
use App\Modules\Conferences\Models\ConferenceRegistration;

class GetDashboardSummaryAction
{
    public function execute(): array
    {
        return[
            'total_users' =>User::query()->count(),
            'total_conference'=>Conference::query()->count(),
            'total_submissions' => Submission::query()->count(),
            'total_reviews' => SubmissionReview::query()->count(),
            'total_registrations' => ConferenceRegistration::query()->count(),
        ];
    }
}