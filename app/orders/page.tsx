"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProtectedShell from "@/components/layout/ProtectedShell";

type Order = {
  id: string;
  invoiceNumber: string;
  total?: string | number | null;
  totalAmount?: string | number | null;
  subtotal?: string | number | null;
  deliveryFee?: string | number | null;
  deliveryArea?: string | null;
  paymentStatus: string;
  paymentMethod?: string | null;
  status: string;
  createdAt: string;
  items: {
    id?: string;
    name: string;
    quantity: number;
    lineTotal?: string | number | null;
    size?: string | null;
    color?: string | null;
  }[];
};

type OrdersResponse = {
  orders?: Order[];
  error?: string;
};

type RetryResponse = {
  message?: string;
  error?: string;
  authorizationUrl?: string;
};

type MobileTab = "UNPAID" | "TO_SHIP" | "SHIPPED" | "COMPLETED" | "CANCELLED";

const mobileTabs: { key: MobileTab; label: string }[] = [
  { key: "UNPAID", label: "Unpaid" },
  { key: "TO_SHIP", label: "To Ship" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

function money(value: string | number | null | undefined) {
  const num = Number(value ?? 0);
  return `KES ${Number.isNaN(num) ? 0 : num.toLocaleString()}`;
}

function orderTotal(order: Order) {
  return order.totalAmount ?? order.total ?? 0;
}

function niceStatus(status: string) {
  return status.replaceAll("_", " ");
}

function normalizeKenyaPhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 12);
}

function firstItemName(order: Order) {
  return order.items[0]?.name || "Order items";
}

function firstItemQuantity(order: Order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

function isCancelledOrder(order: Order) {
  return (
    order.status === "CANCELLED" ||
    order.status === "REFUNDED" ||
    order.paymentStatus === "REFUNDED"
  );
}

function isPaymentFailed(order: Order) {
  return order.paymentStatus === "FAILED";
}

function canRetryOrder(order: Order) {
  return (
    isPaymentFailed(order) &&
    !isCancelledOrder(order) &&
    order.status === "PENDING" &&
    (order.paymentMethod === "MPESA" || order.paymentMethod === "CARD")
  );
}

function orderBelongsToTab(order: Order, tab: MobileTab) {
  const cancelled = isCancelledOrder(order);
  const failed = isPaymentFailed(order);

  if (tab === "CANCELLED") return cancelled;

  if (tab === "UNPAID") {
    return !cancelled && (failed || order.paymentStatus === "PENDING");
  }

  if (tab === "TO_SHIP") {
    return (
      !cancelled &&
      !failed &&
      order.paymentStatus === "PAID" &&
      (order.status === "PENDING" || order.status === "PROCESSING")
    );
  }

  if (tab === "SHIPPED") {
    return !cancelled && !failed && order.status === "AWAITING_DELIVERY";
  }

  if (tab === "COMPLETED") {
    return !cancelled && !failed && order.status === "DELIVERED";
  }

  return true;
}

function displayOrderStatus(order: Order) {
  if (isCancelledOrder(order)) return niceStatus(order.status);
  if (isPaymentFailed(order)) return "NOT COMPLETED";
  return niceStatus(order.status);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryingId, setRetryingId] = useState("");
  const [retryNotice, setRetryNotice] = useState("");
  const [retryPhones, setRetryPhones] = useState<Record<string, string>>({});
  const [mobileTab, setMobileTab] = useState<MobileTab>("UNPAID");
  const [openMobileOrderId, setOpenMobileOrderId] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/orders");
      const data = (await response.json()) as OrdersResponse;

      if (response.status === 401) {
        window.location.href = "/auth/login?next=/orders";
        return;
      }

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

  const tabCounts = useMemo(() => {
    return mobileTabs.reduce(
      (acc, tab) => ({
        ...acc,
        [tab.key]: orders.filter((order) => orderBelongsToTab(order, tab.key))
          .length,
      }),
      {} as Record<MobileTab, number>
    );
  }, [orders]);

  const mobileOrders = useMemo(
    () => orders.filter((order) => orderBelongsToTab(order, mobileTab)),
    [orders, mobileTab]
  );

  const retryMpesaPayment = async (order: Order) => {
    const phone = retryPhones[order.id]?.trim() || "";

    if (!phone) {
      setError("Enter the Safaricom number to receive the M-Pesa prompt.");
      return;
    }

    try {
      setRetryingId(order.id);
      setError("");
      setRetryNotice("");

      const response = await fetch("/api/payments/mpesa/stk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          phone,
        }),
      });

      const data = (await response.json()) as RetryResponse;

      if (!response.ok) {
        setError(data.error || "Unable to retry M-Pesa payment.");
        return;
      }

      setRetryNotice(
        data.message ||
          "M-Pesa prompt sent. Enter PIN on your phone to complete payment."
      );

      await loadOrders();
    } catch {
      setError("Something went wrong while retrying M-Pesa payment.");
    } finally {
      setRetryingId("");
    }
  };

  const retryCardPayment = async (order: Order) => {
    try {
      setRetryingId(order.id);
      setError("");
      setRetryNotice("");

      const response = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      });

      const data = (await response.json()) as RetryResponse;

      if (!response.ok || !data.authorizationUrl) {
        setError(data.error || "Unable to retry card payment.");
        return;
      }

      window.location.href = data.authorizationUrl;
    } catch {
      setError("Something went wrong while retrying card payment.");
    } finally {
      setRetryingId("");
    }
  };

  const renderRetryBox = (order: Order, compact = false) => {
    const retryAllowed = canRetryOrder(order);

    if (!isPaymentFailed(order)) return null;

    return (
      <div
        className={`mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 ${
          compact ? "text-xs" : "text-sm"
        } font-bold text-red-700`}
      >
        <p>
          Payment failed. This order was not completed.
          {retryAllowed
            ? " You can retry the same payment method below."
            : " Please place a fresh order if you still need these items."}
        </p>

        {retryAllowed && order.paymentMethod === "MPESA" ? (
          <div className="mt-4 space-y-3">
            <input
              inputMode="numeric"
              placeholder="Safaricom number e.g. 2547XXXXXXXX"
              value={retryPhones[order.id] || ""}
              onChange={(event) =>
                setRetryPhones((current) => ({
                  ...current,
                  [order.id]: normalizeKenyaPhoneInput(event.target.value),
                }))
              }
              className="h-11 w-full rounded-2xl border border-red-200 bg-white px-4 text-sm font-black text-slate-950 outline-none focus:border-red-500"
            />

            <button
              type="button"
              disabled={retryingId === order.id}
              onClick={() => void retryMpesaPayment(order)}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-green-600 px-5 text-sm font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {retryingId === order.id
                ? "Sending M-Pesa prompt..."
                : "Retry M-Pesa payment"}
            </button>
          </div>
        ) : null}

        {retryAllowed && order.paymentMethod === "CARD" ? (
          <button
            type="button"
            disabled={retryingId === order.id}
            onClick={() => void retryCardPayment(order)}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {retryingId === order.id
              ? "Opening card checkout..."
              : "Retry card payment"}
          </button>
        ) : null}

        {!retryAllowed ? (
          <Link
            href="/online-store"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-orange-600 px-5 text-sm font-black text-white hover:bg-orange-700"
          >
            Return to store
          </Link>
        ) : null}
      </div>
    );
  };

  return (
    <ProtectedShell
      badge="My orders"
      title="My orders"
      subtitle="View invoices, totals, purchased items, selected options, payment status, and delivery progress."
    >
      <section className="overflow-hidden rounded-[32px] border border-white/50 bg-white/90 shadow-xl ring-1 ring-slate-200/70 backdrop-blur md:p-8">
        <div className="hidden flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:flex">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Order history
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Track completed or active orders using your invoice number.
            </p>
          </div>

          <Link
            href="/online-store"
            className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700"
          >
            Shop again
          </Link>
        </div>

        <div className="md:hidden">
          <div className="sticky top-0 z-10 bg-white">
            <div className="flex h-14 items-center border-b border-slate-100 px-4">
              <Link
                href="/dashboard"
                className="mr-3 text-3xl font-light leading-none text-slate-700"
              >
                ‹
              </Link>

              <h2 className="flex-1 text-center text-lg font-black text-slate-950">
                My Orders
              </h2>

              <Link
                href="/online-store"
                className="text-xs font-black text-orange-600"
              >
                Shop
              </Link>
            </div>

            <div className="flex overflow-x-auto border-b border-slate-200 bg-white">
              {mobileTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setMobileTab(tab.key);
                    setOpenMobileOrderId("");
                  }}
                  className={`relative shrink-0 px-4 py-3 text-sm font-bold ${
                    mobileTab === tab.key
                      ? "text-slate-950"
                      : "text-slate-500"
                  }`}
                >
                  {tab.label}
                  {tabCounts[tab.key] > 0 ? (
                    <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-600">
                      {tabCounts[tab.key]}
                    </span>
                  ) : null}

                  {mobileTab === tab.key ? (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-orange-600" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 md:mx-0 md:mt-6">
            {error}
          </div>
        ) : null}

        {retryNotice ? (
          <div className="m-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700 md:mx-0 md:mt-6">
            {retryNotice}
          </div>
        ) : null}

        {loading ? (
          <p className="m-4 text-sm text-slate-600 md:mx-0 md:mt-6">
            Loading orders...
          </p>
        ) : orders.length === 0 ? (
          <div className="m-4 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600 md:mx-0 md:mt-6">
            You have no orders yet.
          </div>
        ) : (
          <>
            <div className="hidden md:mt-6 md:block md:space-y-4">
              {orders.map((order) => {
                const failed = isPaymentFailed(order);
                const cancelled = isCancelledOrder(order);

                return (
                  <div
                    key={order.id}
                    className={`rounded-[28px] border p-5 shadow-sm ${
                      failed
                        ? "border-red-200 bg-red-50/60"
                        : cancelled
                          ? "border-slate-200 bg-slate-50"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-orange-700">
                          Invoice {order.invoiceNumber}
                        </p>

                        <h3 className="mt-2 text-2xl font-black text-slate-950">
                          {money(orderTotal(order))}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              failed
                                ? "bg-red-100 text-red-700"
                                : order.paymentStatus === "PAID"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            Payment {order.paymentStatus}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {displayOrderStatus(order)}
                          </span>

                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                            {order.paymentMethod || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="lg:text-right">
                        <p className="text-sm font-bold text-slate-700">
                          Subtotal: {money(order.subtotal)}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                          Delivery: {money(order.deliveryFee)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Area: {order.deliveryArea || "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={item.id || `${order.id}-${index}`}
                          className="flex justify-between gap-3 rounded-2xl bg-slate-50 p-3 text-sm"
                        >
                          <div>
                            <span className="font-bold text-slate-700">
                              {item.name} × {item.quantity}
                            </span>

                            <div className="mt-1 flex flex-wrap gap-2">
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
                      ))}
                    </div>

                    {!failed && !cancelled ? (
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700"
                        >
                          Open invoice
                        </Link>

                        <Link
                          href="/track-order"
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Track order
                        </Link>
                      </div>
                    ) : null}

                    {failed ? renderRetryBox(order) : null}

                    {cancelled ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
                        This order is cancelled or returned. Please place a new
                        order if you still need the item.
                      </div>
                    ) : null}

                    {order.status === "PENDING" && !failed && !cancelled ? (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                        You may cancel this order before processing starts. Open
                        the invoice to cancel.
                      </div>
                    ) : null}

                    {order.status === "DELIVERED" && !failed && !cancelled ? (
                      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                        Your order is ready for pickup. Please collect it within
                        3 business days. Refund review for non-food items is
                        available within 7 days.
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="md:hidden">
              {mobileOrders.length === 0 ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center bg-slate-50 px-6 text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
                    📦
                  </div>
                  <p className="mt-5 text-sm font-bold text-slate-500">
                    No content here
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 pb-24">
                  {mobileOrders.map((order) => {
                    const failed = isPaymentFailed(order);
                    const cancelled = isCancelledOrder(order);
                    const isOpen = openMobileOrderId === order.id;

                    return (
                      <div
                        key={order.id}
                        className={`border-b border-slate-100 bg-white p-3 ${
                          failed
                            ? "bg-red-50"
                            : cancelled
                              ? "bg-slate-50"
                              : "bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMobileOrderId(isOpen ? "" : order.id)
                          }
                          className="flex w-full gap-3 text-left"
                        >
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-400">
                            STN
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                              {firstItemName(order)}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              Order {order.invoiceNumber}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                                  failed
                                    ? "bg-red-600 text-white"
                                    : order.paymentStatus === "PAID"
                                      ? "bg-green-600 text-white"
                                      : "bg-amber-500 text-white"
                                }`}
                              >
                                {failed ? "FAILED" : order.paymentStatus}
                              </span>

                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-700">
                                {displayOrderStatus(order)}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-3">
                              <p className="text-sm font-black text-slate-950">
                                {money(orderTotal(order))}
                              </p>

                              <p className="text-[11px] font-semibold text-slate-400">
                                {firstItemQuantity(order)} item(s)
                              </p>
                            </div>
                          </div>
                        </button>

                        {isOpen ? (
                          <div className="mt-3 rounded-2xl bg-white p-3 text-xs shadow-sm ring-1 ring-slate-100">
                            <div className="grid gap-2 text-slate-600">
                              <p>
                                <span className="font-black">Date:</span>{" "}
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                              <p>
                                <span className="font-black">Delivery:</span>{" "}
                                {money(order.deliveryFee)}
                              </p>
                              <p>
                                <span className="font-black">Area:</span>{" "}
                                {order.deliveryArea || "Not set"}
                              </p>
                            </div>

                            <div className="mt-3 space-y-2">
                              {order.items.map((item, index) => (
                                <div
                                  key={item.id || `${order.id}-mobile-${index}`}
                                  className="rounded-xl bg-slate-50 p-2"
                                >
                                  <div className="flex justify-between gap-2">
                                    <p className="font-bold text-slate-700">
                                      {item.name} × {item.quantity}
                                    </p>
                                    <p className="font-black text-slate-950">
                                      {money(item.lineTotal)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {!failed && !cancelled ? (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <Link
                                  href={`/orders/${order.id}`}
                                  className="inline-flex h-10 items-center justify-center rounded-xl bg-orange-600 text-xs font-black text-white"
                                >
                                  Open invoice
                                </Link>

                                <Link
                                  href="/track-order"
                                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-xs font-black text-slate-700"
                                >
                                  Track order
                                </Link>
                              </div>
                            ) : null}

                            {failed ? renderRetryBox(order, true) : null}

                            {cancelled ? (
                              <div className="mt-3 rounded-xl bg-slate-100 p-3 text-xs font-bold text-slate-600">
                                Cancelled/returned orders cannot be retried.
                                Place a new order if the item is still
                                available.
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </ProtectedShell>
  );
}