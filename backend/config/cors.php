<?php

$allowedOrigins = array_values(
    array_filter(
        array_map(
            'trim',
            explode(
                ',',
                (string) env(
                    'CORS_ALLOWED_ORIGINS',
                    'http://localhost:3000,http://172.16.22.182:3000,http://127.0.0.1:3000'
                )
            )
        )
    )
);

return [

    'paths' => [
        'api/*',
    ],

    'allowed_methods' => [
        '*',
    ],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        '*',
    ],

    /*
     * Required because the frontend reads
     * Content-Disposition to determine the
     * private submission download filename.
     */
    'exposed_headers' => [
        'Content-Disposition',
    ],

    'max_age' => 3600,

    /*
     * CMT currently authenticates API requests
     * with Bearer tokens rather than cookies.
     */
    'supports_credentials' => false,

];