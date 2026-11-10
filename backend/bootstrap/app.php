<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        // Registramos routes/api.php (prefijo /api automático). No usamos rutas web.
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        // /up es el endpoint que usa el HEALTHCHECK de Docker
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
