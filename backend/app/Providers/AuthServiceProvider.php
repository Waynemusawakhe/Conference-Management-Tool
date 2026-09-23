<?php

namespace App\Providers;

use App\Modules\Conferences\Models\Conference;
use App\Modules\Conferences\Policies\ConferencePolicy;
use App\Modules\ContactMessages\Models\ContactMessage;
use App\Modules\ContactMessages\Policies\ContactMessagePolicy;
use App\Modules\Faq\Models\Faq;
use App\Modules\Faq\Policies\FaqPolicy;
use App\Modules\Registrations\Models\Registration;
use App\Modules\Registrations\Policies\RegistrationPolicy;
use App\Modules\Reviews\Models\SubmissionReview;
use App\Modules\Reviews\Policies\ReviewPolicy;
use App\Modules\Sessions\Policies\SessionPolicy;
use App\Modules\Submissions\Models\ConferenceSession;
use App\Modules\Submissions\Models\Submission;
use App\Modules\Submissions\Policies\SubmissionPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Conference::class => ConferencePolicy::class,
        ConferenceSession::class => SessionPolicy::class,
        ContactMessage::class => ContactMessagePolicy::class,
        Faq::class => FaqPolicy::class,
        Registration::class => RegistrationPolicy::class,
        SubmissionReview::class => ReviewPolicy::class,
        Submission::class => SubmissionPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}