<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'Conference Management Tool API',
    description: 'API documentation for the Conference Management Tool (CMT).'
)]
#[OA\Server(
    url: 'http://127.0.0.1:8000',
    description: 'Local development server'
)]
class OpenApiSpec {}
