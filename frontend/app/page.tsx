"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

// Forma de un producto tal como lo devuelve la API Laravel
type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string; // Laravel devuelve los decimal como string ("12.50")
  stock: number;
};

// NEXT_PUBLIC_* se "quema" en el bundle durante el build (por eso es un ARG en el Dockerfile).
// Es la URL de la API vista DESDE EL NAVEGADOR, no desde el contenedor.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// Headers para que Laravel responda siempre JSON (incluso los errores de validación)
const headers = { "Content-Type": "application/json", Accept: "application/json" };

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "0" });

  // Carga la lista. Se hace en el cliente (useEffect) porque durante `next build`
  // el backend NO existe todavía: si lo hiciéramos en el servidor, el build fallaría.
  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/products`, { headers });
      if (!res.ok) throw new Error(`La API respondió ${res.status}`);
      setProducts(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar con la API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Se programa en un timeout para no hacer setState de forma síncrona dentro del efecto
    const t = setTimeout(loadProducts, 0);
    return () => clearTimeout(t);
  }, [loadProducts]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          price: Number(form.price),
          stock: Number(form.stock),
        }),
      });
      if (!res.ok) {
        // 422 = validación fallida; mostramos el primer mensaje que mande Laravel
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? `La API respondió ${res.status}`);
      }
      setForm({ name: "", description: "", price: "", stock: "0" });
      await loadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el producto");
    }
  }

  async function handleDelete(id: number) {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/products/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error(`La API respondió ${res.status}`);
      await loadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el producto");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold">🐳 Catálogo de Productos</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Next.js → API Laravel → MySQL, cada uno en su contenedor.
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 grid gap-3 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800 sm:grid-cols-2">
        <input className={inputClass} placeholder="Nombre" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={inputClass} placeholder="Descripción (opcional)" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className={inputClass} placeholder="Precio" type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className={inputClass} placeholder="Stock" type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:col-span-2">
          Agregar producto
        </button>
      </form>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-semibold">Productos ({products.length})</h2>
        {loading ? (
          <p className="text-sm text-neutral-500">Cargando…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay productos todavía.</p>
        ) : (
          <ul className="grid gap-3">
            {products.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.description && <p className="text-sm text-neutral-500">{p.description}</p>}
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">${Number(p.price).toFixed(2)}</span> · Stock: {p.stock}
                  </p>
                </div>
                <button onClick={() => handleDelete(p.id)} className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
