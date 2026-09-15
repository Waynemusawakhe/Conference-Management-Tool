<?php

namespace App\Providers;

use App\Modules\Conferences\Models\Conference;
use App\Modules\Conferences\Policies\ConferencePolicy;
use App\Modules\Reviews\Models\SubmissionReview;
use App\Modules\Reviews\Policies\ReviewPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Conference::class, ConferencePolicy::class);
        Gate::policy(SubmissionReview::class, ReviewPolicy::class);
    }
}
