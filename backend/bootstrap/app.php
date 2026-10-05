<?php

use App\Modules\Shared\Middleware\EnsureUserHasRole;
use App\Modules\Shared\Middleware\ForceHttps;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(
    basePath: dirname(__DIR__)
)
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(
        function (
            Middleware $middleware
        ): void {
            /*
             * Trust the reverse proxy / load balancer so Laravel
             * correctly recognises X-Forwarded-Proto: https.
             *
             * Production can use TRUSTED_PROXIES=* when running
             * behind a managed cloud proxy.
             */
            $trustedProxies = env(
                'TRUSTED_PROXIES',
                '*'
            );

            $proxyAddresses =
                $trustedProxies === '*'
                    ? '*'
                    : array_values(
                        array_filter(
                            array_map(
                                'trim',
                                explode(
                                    ',',
                                    $trustedProxies
                                )
                            )
                        )
                    );

            $middleware->trustProxies(
                at: $proxyAddresses,
                headers:
                    Request::HEADER_X_FORWARDED_FOR |
                    Request::HEADER_X_FORWARDED_HOST |
                    Request::HEADER_X_FORWARDED_PORT |
                    Request::HEADER_X_FORWARDED_PROTO
            );

            /*
             * HTTPS and production security headers.
             */
            $middleware->append(
                ForceHttps::class
            );

            $middleware->alias([
                'role' =>
                    EnsureUserHasRole::class,
            ]);

            $middleware->redirectGuestsTo(
                function ($request) {
                    if (
                        $request->is(
                            'api/*'
                        )
                    ) {
                        return null;
                    }

                    return '/login';
                }
            );
        }
    )
    ->withExceptions(
        function (
            Exceptions $exceptions
        ): void {
            $exceptions->render(
                function (
                    AuthenticationException $e,
                    $request
                ) {
                    if (
                        $request->is(
                            'api/*'
                        )
                    ) {
                        return response()->json([
                            'success' => false,
                            'message' =>
                                $e->getMessage()
                                    ?: 'Unauthenticated.',
                        ], 401);
                    }
                }
            );

            $exceptions->render(
                function (
                    ModelNotFoundException $e,
                    $request
                ) {
                    if (
                        $request->is(
                            'api/*'
                        )
                    ) {
                        return response()->json([
                            'success' => false,
                            'message' =>
                                'Resource not found.',
                        ], 404);
                    }
                }
            );
        }
    )
    ->create();