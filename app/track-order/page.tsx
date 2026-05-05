"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";

type TrackedOrder = {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  totalAmount: string | number;
  totalItems?: number | null;
  deliveryArea?: string | null;
  deliveryAddress?: string | null;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    lineTotal: string | number;
  }[];
};

type TrackResponse = {
  order?: TrackedOrder;
  error?: string;
};

const steps = [
  "PENDING",
  "PROCESSING",
  "AWAITING_DELIVERY",
  "DELIVERED",
] as const;

function money(value: string | number | null | undefined) {
  const num = Number(value ?? 0);
  return `KES ${Number.isNaN(num) ? 0 : num.toLocaleString()}`;
}

function niceStatus(status: string) {
  return status.replaceAll("_", " ");
}

function statusIndex(status: string) {
  const index = steps.indexOf(status as (typeof steps)[number]);
  return index === -1 ? 0 : index;
}

export default function TrackOrderPage() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trackOrder = async () => {
    try {
      setLoading(true);
      setError("");
      setOrder(null);

      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceNumber,
        }),
      });

      const data = (await response.json()) as TrackResponse;

      if (!response.ok) {
        setError(data.error || "Unable to track order.");
        return;
      }

      setOrder(data.order || null);
    } catch {
      setError("Something went wrong while tracking order.");
    } finally {
      setLoading(false);
    }
  };

  const activeIndex = order ? statusIndex(order.status) : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
          <div className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-bold text-orange-700">
            Order tracking
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950">
            Track your order
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Enter your invoice number exactly as shown on your receipt.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
              placeholder="Example: STN-ORD-20260426-POGE8P"
              className="h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-orange-600"
            />

            <button
              type="button"
              onClick={() => void trackOrder()}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Search className="mr-2 h-4 w-4 text-white" />
              {loading ? "Checking..." : "Track"}
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        {order ? (
          <div className="rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-orange-700">
                  {order.invoiceNumber}
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {money(order.totalAmount)}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Created: {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  Order {niceStatus(order.status)}
                </span>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  Payment {order.paymentStatus}
                </span>

                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                  {order.paymentMethod || "N/A"}
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {steps.map((step, index) => {
                const active = index <= activeIndex;

                return (
                  <div
                    key={step}
                    className={`rounded-2xl p-4 text-sm font-black ${
                      active
                        ? "bg-orange-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {niceStatus(step)}
                  </div>
                );
              })}
            </div>

            {order.status === "CANCELLED" ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                This order was cancelled.
              </div>
            ) : null}

            {order.status === "DELIVERED" ? (
              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                This order is ready for pickup. Please collect it within 3
                business days. Refund review for non-food items is available
                within 7 days.
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <h3 className="text-lg font-black text-slate-950">
                Delivery details
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                <span className="font-bold">Pickup station:</span>{" "}
                {order.deliveryArea || "Not set"}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                <span className="font-bold">Address:</span>{" "}
                {order.deliveryAddress || "Not set"}
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="text-lg font-black text-slate-950">
                Purchased items
              </h3>

              {order.items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex justify-between rounded-2xl bg-slate-50 p-4 text-sm"
                >
                  <span className="font-bold text-slate-700">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-bold text-slate-950">
                    {money(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/orders/${order.id}`}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white hover:bg-orange-700"
              >
                Open invoice
              </Link>

              <Link
                href="/online-store"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Continue shopping
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}