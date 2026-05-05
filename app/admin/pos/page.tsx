"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProtectedShell from "@/components/layout/ProtectedShell";
import { Barcode, Minus, Plus, ReceiptText, Trash2 } from "lucide-react";

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

type BarcodeResponse = {
  product?: Product;
  error?: string;
};

type CheckoutResponse = {
  message?: string;
  orderId?: string;
  invoiceNumber?: string;
  error?: string;
};

type PosItem = {
  productId: string;
  name: string;
  barcode?: string | null;
  price: number;
  quantity: number;
  stock: number;
};

function money(value: string | number) {
  return `KES ${Number(value).toLocaleString()}`;
}

export default function AdminPosPage() {
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState<PosItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "MPESA" | "CARD" | "PAYPAL"
  >("CASH");
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const addProductToSale = (product: Product) => {
    if (product.status !== "ACTIVE") {
      setError("This product is not active.");
      return;
    }

    if (product.stock <= 0) {
      setError("This product is out of stock.");
      return;
    }

    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);

      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, item.stock),
              }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          price: Number(product.price),
          quantity: 1,
          stock: product.stock,
        },
      ];
    });

    setBarcode("");
    setMessage(`${product.name} added to sale.`);
    setError("");
  };

  const findBarcode = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    const code = barcode.trim();

    if (!code) {
      setError("Scan or type a barcode first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/products/barcode?barcode=${encodeURIComponent(code)}`
      );

      const data = (await response.json()) as BarcodeResponse;

      if (!response.ok || !data.product) {
        setError(data.error || "No product found for this barcode.");
        return;
      }

      addProductToSale(data.product);
    } catch {
      setError("Unable to search barcode right now.");
    } finally {
      setLoading(false);
      barcodeInputRef.current?.focus();
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.stock)),
            }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((current) =>
      current.filter((item) => item.productId !== productId)
    );
  };

  const clearSale = () => {
    setItems([]);
    setBarcode("");
    setMessage("");
    setError("");
    barcodeInputRef.current?.focus();
  };

  const completeSale = async () => {
    if (items.length === 0) {
      setError("Add at least one item before checkout.");
      return;
    }

    try {
      setCheckingOut(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/pos/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok) {
        setError(data.error || "Unable to complete POS sale.");
        return;
      }

      setItems([]);
      setMessage(
        `Sale completed. Invoice: ${data.invoiceNumber || "Generated"}`
      );

      if (data.orderId) {
        window.open(`/orders/${data.orderId}`, "_blank");
      }
    } catch {
      setError("Something went wrong while completing POS sale.");
    } finally {
      setCheckingOut(false);
      barcodeInputRef.current?.focus();
    }
  };

  return (
    <ProtectedShell
      badge="POS cashier"
      title="Barcode cashier mode"
      subtitle="Scan products, calculate totals, choose payment method, and complete counter sales."
    >
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Scan item
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Focus the barcode field and scan. Most barcode scanners behave
              like a keyboard and press Enter automatically.
            </p>

            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              onSubmit={findBarcode}
            >
              <div className="relative min-w-0 flex-1">
                <Barcode className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  ref={barcodeInputRef}
                  autoFocus
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-sm font-semibold text-slate-950 outline-none focus:border-orange-600"
                  placeholder="Scan/type barcode then press Enter"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 rounded-2xl bg-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                {loading ? "Checking..." : "Add item"}
              </button>
            </form>

            {message ? (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Sale sheet
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Items, quantity, price, and line total.
                </p>
              </div>

              <button
                type="button"
                onClick={clearSale}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Clear sale
              </button>
            </div>

            {items.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
                No items scanned yet.
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1fr_110px_110px_120px_60px] bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white">
                  <div>Item</div>
                  <div className="text-center">Qty</div>
                  <div className="text-right">Price</div>
                  <div className="text-right">Total</div>
                  <div></div>
                </div>

                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="grid grid-cols-[1fr_110px_110px_120px_60px] items-center border-t border-slate-200 px-4 py-4 text-sm"
                  >
                    <div>
                      <h3 className="font-black text-slate-950">{item.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Barcode: {item.barcode || "N/A"} · Stock {item.stock}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.productId,
                            Number(e.target.value)
                          )
                        }
                        className="h-8 w-14 rounded-xl border border-slate-300 bg-white text-center text-sm font-black text-slate-950 outline-none focus:border-orange-600"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-600 text-white hover:bg-orange-700"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </button>
                    </div>

                    <div className="text-right font-bold text-slate-700">
                      {money(item.price)}
                    </div>

                    <div className="text-right font-black text-slate-950">
                      {money(item.price * item.quantity)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
            <ReceiptText className="h-6 w-6 text-orange-700" />
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
            Payment summary
          </h2>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total items</span>
              <span className="font-black text-slate-950">{totalItems}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-black text-slate-950">
                {money(subtotal)}
              </span>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
              POS sales are marked as paid and delivered immediately. Stock is
              reduced after successful sale completion.
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                Payment method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value as "CASH" | "MPESA" | "CARD" | "PAYPAL"
                  )
                }
                className="mt-2 h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none focus:border-orange-600"
              >
                <option value="CASH">Cash</option>
                <option value="MPESA">M-Pesa</option>
                <option value="CARD">Card</option>
                <option value="PAYPAL">PayPal</option>
              </select>
            </div>

            <div className="rounded-[24px] bg-slate-950 p-5 text-white">
              <p className="text-sm text-white/60">Grand total</p>
              <h3 className="mt-2 text-3xl font-black">{money(subtotal)}</h3>
            </div>

            <button
              type="button"
              disabled={checkingOut || items.length === 0}
              onClick={() => void completeSale()}
              className="h-12 w-full rounded-2xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {checkingOut ? "Completing sale..." : "Complete POS sale"}
            </button>

            <Link
              href="/admin/orders"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              View all orders
            </Link>
          </div>
        </aside>
      </section>
    </ProtectedShell>
  );
}