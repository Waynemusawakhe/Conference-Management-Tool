<?php

namespace App\Modules\Shared\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceHttps
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        /*
         * Local development remains HTTP.
         * HTTPS enforcement only applies in production.
         */
        if (
            app()->environment('production') &&
            ! $request->isSecure()
        ) {
            $configuredUrl = rtrim(
                (string) config('app.url'),
                '/'
            );

            $configuredUrl = preg_replace(
                '#^http://#i',
                'https://',
                $configuredUrl
            );

            $uri = $request->getRequestUri();

            $target =
                $configuredUrl .
                ($uri === '/' ? '' : $uri);

            /*
             * 308 preserves the HTTP method and request body,
             * unlike a traditional 301/302 redirect.
             */
            return redirect()->away(
                $target,
                308
            );
        }

        $response = $next(
            $request
        );

        /*
         * Tell browsers to keep using HTTPS for this domain.
         */
        if (
            app()->environment('production') &&
            $request->isSecure()
        ) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );

            $response->headers->set(
                'X-Content-Type-Options',
                'nosniff'
            );

            $response->headers->set(
                'X-Frame-Options',
                'DENY'
            );

            $response->headers->set(
                'Referrer-Policy',
                'strict-origin-when-cross-origin'
            );

            $response->headers->set(
                'Permissions-Policy',
                'camera=(), microphone=(), geolocation=()'
            );
        }

        return $response;
    }
}