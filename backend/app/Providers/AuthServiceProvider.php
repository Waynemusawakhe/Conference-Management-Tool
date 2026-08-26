<?php

namespace App\Providers;

use App\Modules\Registrations\Models\Registration;
use App\Modules\Registrations\Policies\RegistrationPolicy;
use App\Modules\Submissions\Models\Submission;
use App\Modules\Submissions\Policies\SubmissionPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Registration::class => RegistrationPolicy::class,
        Submission::class => SubmissionPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }


}
