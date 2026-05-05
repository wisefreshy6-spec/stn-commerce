"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedShell from "@/components/layout/ProtectedShell";

type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "AWAITING_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

type Order = {
  id: string;
  invoiceNumber: string;
  total?: string | number | null;
  totalAmount?: string | number | null;
  subtotal?: string | number | null;
  deliveryFee?: string | number | null;
  deliveryArea?: string | null;
  deliveryAddress?: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  status: OrderStatus;
  stockReduced?: boolean;
  riskStatus?: string | null;
  riskReason?: string | null;
  createdAt: string;
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
  };
  items: {
    id?: string;
    name?: string;
    quantity: number;
    price?: string | number;
    lineTotal?: string | number;
    size?: string | null;
    color?: string | null;
  }[];
};

type OrdersResponse = {
  orders?: Order[];
  error?: string;
};

type UpdateResponse = {
  message?: string;
  error?: string;
};

const statuses: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "AWAITING_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const paymentStatuses: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

function money(value: string | number | null | undefined) {
  const num = Number(value ?? 0);
  return `KES ${Number.isNaN(num) ? 0 : num.toLocaleString()}`;
}

function orderTotal(order: Order) {
  return order.totalAmount ?? order.total ?? 0;
}

function customerName(order: Order) {
  return (
    [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") ||
    "Customer"
  );
}

function niceStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/orders");
      const data = (await response.json()) as OrdersResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load orders.");
        return;
      }

      setOrders(data.orders || []);
    } catch {
      setError("Something went wrong while loading orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const updateOrder = async (
    orderId: string,
    input: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
    }
  ) => {
    try {
      setSavingId(orderId);
      setMessage("");
      setError("");

      const response = await fetch("/api/admin/orders/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          ...input,
        }),
      });

      const data = (await response.json()) as UpdateResponse;

      if (!response.ok) {
        setError(data.error || "Unable to update order.");
        return;
      }

      setMessage(data.message || "Order updated.");
      await loadOrders();
    } catch {
      setError("Something went wrong while updating order.");
    } finally {
      setSavingId("");
    }
  };

  const approveRisk = async (orderId: string) => {
    try {
      setSavingId(orderId);
      setMessage("");
      setError("");

      const response = await fetch("/api/admin/orders/risk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const data = (await response.json()) as UpdateResponse;

      if (!response.ok) {
        setError(data.error || "Unable to approve risk review.");
        return;
      }

      setMessage(data.message || "Risk review approved.");
      await loadOrders();
    } catch {
      setError("Something went wrong while approving risk review.");
    } finally {
      setSavingId("");
    }
  };

  const totalRevenue = orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((sum, order) => sum + Number(orderTotal(order)), 0);

  const riskReviews = orders.filter(
    (order) => order.riskStatus === "REVIEW_REQUIRED"
  ).length;

  return (
    <ProtectedShell
      badge="Admin orders"
      title="Order management"
      subtitle="View invoices, customers, totals, risk review, delivery details, variants, payment status, and order progress."
    >
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-5">
          <SummaryCard title="Total orders" value={orders.length} />
          <SummaryCard title="Paid revenue" value={money(totalRevenue)} />
          <SummaryCard
            title="Pending orders"
            value={orders.filter((order) => order.status === "PENDING").length}
          />
          <SummaryCard
            title="Paid orders"
            value={
              orders.filter((order) => order.paymentStatus === "PAID").length
            }
          />
          <SummaryCard title="Risk reviews" value={riskReviews} />
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Orders
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Review high-risk orders before progressing them. Marking payment
                PAID reduces stock once; refund/cancel returns stock if already
                reduced.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadOrders()}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {message ? (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <p className="mt-6 text-sm text-slate-600">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              No orders yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.map((order) => {
                const itemCount = order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );

                const locked =
                  order.status === "CANCELLED" || order.status === "REFUNDED";

                return (
                  <div
                    key={order.id}
                    className={`rounded-[28px] border p-5 shadow-sm ${
                      order.riskStatus === "REVIEW_REQUIRED"
                        ? "border-red-200 bg-red-50/40"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {niceStatus(order.status)}
                          </span>

                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                            {order.paymentMethod}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              order.paymentStatus === "PAID"
                                ? "bg-green-100 text-green-700"
                                : order.paymentStatus === "FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : order.paymentStatus === "REFUNDED"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            Payment {order.paymentStatus}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              order.stockReduced
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            Stock{" "}
                            {order.stockReduced ? "reduced" : "not reduced"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              order.riskStatus === "REVIEW_REQUIRED"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            Risk {order.riskStatus || "CLEAR"}
                          </span>
                        </div>

                        <h3 className="mt-3 text-xl font-black text-slate-950">
                          {order.invoiceNumber}
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          {customerName(order)} — {order.user.email}
                        </p>

                        {order.user.phone ? (
                          <p className="mt-1 text-sm text-slate-500">
                            Phone: {order.user.phone}
                          </p>
                        ) : null}

                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>

                        <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <span className="font-bold">Items:</span>{" "}
                            {itemCount}
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <span className="font-bold">Delivery:</span>{" "}
                            {money(order.deliveryFee)}
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <span className="font-bold">Total:</span>{" "}
                            {money(orderTotal(order))}
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                          <span className="font-bold">Pickup/Area:</span>{" "}
                          {order.deliveryArea || "Not set"}
                          <br />
                          <span className="font-bold">Address:</span>{" "}
                          {order.deliveryAddress || "Not set"}
                        </div>

                        {order.riskStatus === "REVIEW_REQUIRED" ? (
                          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
                            <p>
                              Review required:{" "}
                              {order.riskReason ||
                                "High-risk order needs admin review."}
                            </p>

                            <button
                              type="button"
                              disabled={savingId === order.id}
                              onClick={() => void approveRisk(order.id)}
                              className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white disabled:bg-slate-300"
                            >
                              Approve risk review
                            </button>
                          </div>
                        ) : null}

                        <div className="mt-4 space-y-2">
                          {order.items.map((item, index) => (
                            <div
                              key={item.id || `${order.id}-${index}`}
                              className="rounded-2xl bg-slate-50 p-3 text-sm"
                            >
                              <div className="flex justify-between gap-3">
                                <div>
                                  <span className="font-bold text-slate-700">
                                    {item.name || "Item"} × {item.quantity}
                                  </span>

                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {item.size ? (
                                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                                        Size: {item.size}
                                      </span>
                                    ) : null}

                                    {item.color ? (
                                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">
                                        Color: {item.color}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                <span className="font-bold text-slate-950">
                                  {money(item.lineTotal)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700"
                          >
                            View invoice
                          </Link>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                            Payment status
                          </p>

                          <div className="mt-3 grid gap-2">
                            {paymentStatuses.map((paymentStatus) => (
                              <button
                                key={paymentStatus}
                                type="button"
                                disabled={savingId === order.id || locked}
                                onClick={() =>
                                  void updateOrder(order.id, { paymentStatus })
                                }
                                className={`rounded-2xl px-4 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                  order.paymentStatus === paymentStatus
                                    ? "bg-orange-600 text-white"
                                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {niceStatus(paymentStatus)}
                              </button>
                            ))}
                          </div>

                          <p className="mt-4 text-xs leading-5 text-slate-500">
                            Marking payment PAID reduces stock once. REFUNDED
                            returns stock if already reduced.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                            Order status
                          </p>

                          <div className="mt-3 grid gap-2">
                            {statuses.map((status) => (
                              <button
                                key={status}
                                type="button"
                                disabled={savingId === order.id || locked}
                                onClick={() =>
                                  void updateOrder(order.id, { status })
                                }
                                className={`rounded-2xl px-4 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                  order.status === status
                                    ? "bg-orange-600 text-white"
                                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {niceStatus(status)}
                              </button>
                            ))}
                          </div>

                          <p className="mt-4 text-xs leading-5 text-slate-500">
                            Processing, awaiting delivery, or delivered also
                            reduces stock if not yet reduced. Cancel/refund
                            returns stock only if it was reduced.
                          </p>
                        </div>
                      </div>
                    </div>
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

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] bg-white p-6 shadow ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{title}</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">{value}</h2>
    </div>
  );
}