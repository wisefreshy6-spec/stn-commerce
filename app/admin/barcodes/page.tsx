"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import ProtectedShell from "@/components/layout/ProtectedShell";
import { Printer, RefreshCw } from "lucide-react";

type Product = {
  id: string;
  name: string;
  barcode?: string | null;
  price: string | number;
  stock: number;
  status: string;
  section: string;
  category?: string | null;
};

type ProductsResponse = {
  products?: Product[];
  error?: string;
};

type LabelSelection = {
  productId: string;
  quantity: number;
};

function money(value: string | number) {
  return `KES ${Number(value).toLocaleString()}`;
}

export default function AdminBarcodesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Record<string, LabelSelection>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const barcodeRefs = useRef<Record<string, SVGSVGElement | null>>({});

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/products");
      const data = (await response.json()) as ProductsResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load products.");
        return;
      }

      setProducts(data.products || []);
    } catch {
      setError("Something went wrong while loading barcode products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      if (product.status === "DELETED") return false;
      if (!product.barcode) return false;

      return (
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.barcode.toLowerCase().includes(term) ||
        (product.category || "").toLowerCase().includes(term)
      );
    });
  }, [products, search]);

  const printableLabels = useMemo(() => {
    const labels: Product[] = [];

    for (const selection of Object.values(selected)) {
      const product = products.find((item) => item.id === selection.productId);

      if (!product || !product.barcode) continue;

      for (let i = 0; i < selection.quantity; i++) {
        labels.push(product);
      }
    }

    return labels;
  }, [products, selected]);

  useEffect(() => {
    printableLabels.forEach((product, index) => {
      const key = `${product.id}-${index}`;
      const svg = barcodeRefs.current[key];

      if (!svg || !product.barcode) return;

      try {
        JsBarcode(svg, product.barcode, {
          format: "CODE128",
          width: 1.4,
          height: 42,
          displayValue: true,
          fontSize: 12,
          margin: 4,
        });
      } catch {
        // Invalid barcode values are skipped visually.
      }
    });
  }, [printableLabels]);

  const setQuantity = (product: Product, quantity: number) => {
    const cleanQuantity = Math.max(0, Math.min(100, quantity));

    setSelected((current) => {
      const next = { ...current };

      if (cleanQuantity <= 0) {
        delete next[product.id];
        return next;
      }

      next[product.id] = {
        productId: product.id,
        quantity: cleanQuantity,
      };

      return next;
    });
  };

  const totalLabels = printableLabels.length;

  return (
    <ProtectedShell
      badge="Barcode labels"
      title="Printable barcode labels"
      subtitle="Generate and print product barcode labels for stock intake, shelves, and cashier scanning."
    >
      <section className="space-y-6">
        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur print:hidden">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Select products
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Only products with a barcode are shown here.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                disabled={totalLabels === 0}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                <Printer className="mr-2 h-4 w-4 text-white" />
                Print labels ({totalLabels})
              </button>
            </div>
          </div>

          <input
            className="mt-6 h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none focus:border-orange-600"
            placeholder="Search by product name, category, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <p className="mt-6 text-sm text-slate-600">Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
              No barcode products found. Add a barcode to products first from
              Store Management.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {filteredProducts.map((product) => {
                const quantity = selected[product.id]?.quantity || 0;

                return (
                  <div
                    key={product.id}
                    className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_180px]"
                  >
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {product.section}
                        </span>

                        {product.category ? (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                            {product.category}
                          </span>
                        ) : null}

                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                          {product.barcode}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-black text-slate-950">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {money(product.price)} · Stock {product.stock}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => setQuantity(product, quantity - 1)}
                        className="h-10 w-10 rounded-2xl border border-slate-300 bg-white text-lg font-black text-slate-950 hover:bg-slate-50"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(product, Number(e.target.value))
                        }
                        className="h-10 w-20 rounded-2xl border border-slate-300 bg-white text-center text-sm font-black text-slate-950 outline-none focus:border-orange-600"
                      />

                      <button
                        type="button"
                        onClick={() => setQuantity(product, quantity + 1)}
                        className="h-10 w-10 rounded-2xl bg-orange-600 text-lg font-black text-white hover:bg-orange-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none print:ring-0">
          <div className="mb-6 print:hidden">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Label preview
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Print preview uses small shelf/product labels.
            </p>
          </div>

          {totalLabels === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-600 print:hidden">
              Select label quantities above to preview labels.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-2">
              {printableLabels.map((product, index) => {
                const key = `${product.id}-${index}`;

                return (
                  <div
                    key={key}
                    className="break-inside-avoid rounded-2xl border border-slate-300 bg-white p-3 text-center print:rounded-none print:border-black"
                  >
                    <h3 className="truncate text-sm font-black text-slate-950">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {product.category || product.section}
                    </p>

                    <svg
                      ref={(element) => {
                        barcodeRefs.current[key] = element;
                      }}
                      className="mx-auto mt-2 max-w-full"
                    />

                    <p className="mt-1 text-sm font-black text-slate-950">
                      {money(product.price)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </ProtectedShell>
  );
}