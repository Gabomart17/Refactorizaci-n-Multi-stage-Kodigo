<?php

// Sin este archivo el navegador bloquea las peticiones del frontend (otro origen: :3000 vs :8000).
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    // Lista separada por comas en la variable CORS_ALLOWED_ORIGINS
    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000'))
    ))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
