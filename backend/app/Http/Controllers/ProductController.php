<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // GET /api/products -> lista (los más nuevos primero)
    public function index(): JsonResponse
    {
        return response()->json(Product::orderByDesc('id')->get());
    }

    // POST /api/products -> crea un producto
    public function store(Request $request): JsonResponse
    {
        // Si la validación falla, Laravel responde 422 con JSON automáticamente
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
        ]);

        return response()->json(Product::create($data), 201);
    }

    // GET /api/products/{product} -> uno solo (route model binding: 404 si no existe)
    public function show(Product $product): JsonResponse
    {
        return response()->json($product);
    }

    // PUT/PATCH /api/products/{product} -> actualiza
    public function update(Request $request, Product $product): JsonResponse
    {
        // "sometimes": solo valida los campos que vengan en la petición
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'required', 'integer', 'min:0'],
        ]);

        $product->update($data);

        return response()->json($product);
    }

    // DELETE /api/products/{product}
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(null, 204);
    }
}
