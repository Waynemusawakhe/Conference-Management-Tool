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
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Registration::class => RegistrationPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}