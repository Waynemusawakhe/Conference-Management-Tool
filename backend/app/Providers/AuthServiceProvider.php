<?php

namespace App\Providers;

use App\Modules\Registrations\Models\Registration;
use App\Modules\Registrations\Policies\RegistrationPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * NOTE: this $policies array pattern does not appear to take effect in
     * this app (AuthServiceProvider isn't registered in bootstrap/providers.php).
     * Confirmed working pattern is Gate::policy() inside AppServiceProvider::boot() —
     * see ConferencePolicy/ReviewPolicy registration there instead.
     * Flagging rather than fixing Registration's entry, since that's not this module.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Registration::class => RegistrationPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
