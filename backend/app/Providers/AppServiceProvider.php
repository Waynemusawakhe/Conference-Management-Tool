<?php

namespace App\Providers;

use App\Modules\Conferences\Models\Conference;
use App\Modules\Conferences\Policies\ConferencePolicy;
use App\Modules\Reviews\Models\SubmissionReview;
use App\Modules\Reviews\Policies\ReviewPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(
            Conference::class,
            ConferencePolicy::class
        );

        Gate::policy(
            SubmissionReview::class,
            ReviewPolicy::class
        );

        /*
         * Prevent password-reset, verification and other
         * generated URLs from accidentally using HTTP
         * in production.
         */
        if (
            $this->app->environment(
                'production'
            )
        ) {
            URL::forceRootUrl(
                config('app.url')
            );

            URL::forceScheme(
                'https'
            );
        }
    }
}
