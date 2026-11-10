<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // firstOrCreate = idempotente: si reinicias el contenedor no duplica los datos.
        // No usamos factories/Faker porque en producción se instala con --no-dev.
        $products = [
            ['name' => 'Teclado mecánico', 'description' => 'Switches rojos, layout español', 'price' => 49.99, 'stock' => 25],
            ['name' => 'Mouse gamer', 'description' => '16000 DPI, 6 botones', 'price' => 29.90, 'stock' => 40],
            ['name' => 'Monitor 24"', 'description' => 'Full HD, 75Hz', 'price' => 139.00, 'stock' => 12],
        ];

        foreach ($products as $p) {
            Product::firstOrCreate(['name' => $p['name']], $p);
        }
    }
}
