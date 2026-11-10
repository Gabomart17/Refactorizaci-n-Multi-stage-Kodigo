<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    // Campos permitidos para asignación masiva (protege contra mass-assignment)
    protected $fillable = ['name', 'description', 'price', 'stock'];

    protected function casts(): array
    {
        return [
            // Devuelve el precio siempre con 2 decimales ("12.50")
            'price' => 'decimal:2',
            'stock' => 'integer',
        ];
    }
}
