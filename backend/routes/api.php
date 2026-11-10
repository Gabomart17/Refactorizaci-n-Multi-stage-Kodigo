<?php

use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

// CRUD completo: GET/POST /api/products, GET/PUT/DELETE /api/products/{id}
// Usamos un controlador (no closures) para poder correr `php artisan route:cache` en producción.
Route::apiResource('products', ProductController::class);
