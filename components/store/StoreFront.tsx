"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";
import AddToCartButton from "@/components/store/AddToCartButton";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  imageUrl?: string | null;
  section: string;
  category?: string | null;
  stock: number;
  status: string;
};

type StoreFrontProps = {
  title: string;
  subtitle: string;
  section: "FAST_FOOD" | "ONLINE_STORE" | "EXCLUSIVE_STORE";
};

type ProductsResponse = {
  products?: Product[];
  error?: string;
};

export default function StoreFront({
  title,
  subtitle,
  section,
}: StoreFrontProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/products?section=${section}`);
      const data = (await response.json()) as ProductsResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load products.");
        return;
      }

      setProducts(data.products || []);
    } catch {
      setError("Something went wrong while loading products.");
    } finally {
      setLoading(false);
    }
  };

  const updateCartCount = () => {
    try {
      const raw = window.localStorage.getItem("stn_cart");
      const items = raw ? JSON.parse(raw) : [];
      const count = Array.isArray(items)
        ? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        : 0;

      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    void loadProducts();
    updateCartCount();

    window.addEventListener("stn-cart-updated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("stn-cart-updated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[32px] border border-white/50 bg-white/90 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-10">
              <div className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-medium text-orange-700">
                STN Store
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {title}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {subtitle}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/cart"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View cart ({cartCount})
                </Link>

                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-orange-600 p-8 text-white sm:p-10">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-bold">Cart rules</h2>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  Adding to cart does not reduce stock. Stock will only reduce
                  after checkout and payment are completed later.
                </p>
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-bold">Delivery estimate</h2>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  Nairobi CBD delivery is free. Other areas show an estimated
                  delivery fee capped at KES 400.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-8 text-sm text-slate-600">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-slate-200 bg-white/90 p-8 text-sm text-slate-600 shadow-sm">
            No visible products in this section yet.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-44 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 text-sm font-semibold text-orange-700">
                    STN Product
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {product.category ? (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      {product.category}
                    </span>
                  ) : null}

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Stock {product.stock}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-950">
                  {product.name}
                </h3>

                {product.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {product.description}
                  </p>
                ) : null}

                <div className="mt-4 text-2xl font-black text-slate-950">
                  KES {Number(product.price).toLocaleString()}
                </div>

                <AddToCartButton product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}