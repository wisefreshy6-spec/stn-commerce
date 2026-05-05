"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProtectedShell from "@/components/layout/ProtectedShell";

type Payment = {
  id: string;
  provider: string;
  method: string;
  status: string;
  amount: string | number;
  currency: string;
  transactionId?: string | null;
  checkoutRequestId?: string | null;
  phone?: string | null;
  payerEmail?: string | null;
  failureReason?: string | null;
  paidAt?: string | null;
  createdAt: string;
  order: {
    id: string;
    invoiceNumber: string;
    status: string;
    paymentStatus: string;
    totalAmount: string | number;
  };
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};

type PaymentsResponse = {
  payments?: Payment[];
  error?: string;
};

function money(value: string | number | null | undefined, currency = "KES") {
  const num = Number(value ?? 0);
  return `${currency} ${Number.isNaN(num) ? 0 : num.toLocaleString()}`;
}

function niceStatus(value: string) {
  return value.replaceAll("_", " ");
}

function customerName(payment: Payment) {
  return (
    [payment.user?.firstName, payment.user?.lastName]
      .filter(Boolean)
      .join(" ") || "Customer"
  );
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/payments");
      const data = (await response.json()) as PaymentsResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load payments.");
        return;
      }

      setPayments(data.payments || []);
    } catch {
      setError("Something went wrong while loading payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    if (filter === "ALL") return payments;
    return payments.filter((payment) => payment.status === filter);
  }, [filter, payments]);

  const stats = useMemo(() => {
    const paid = payments.filter((payment) => payment.status === "PAID");
    const pending = payments.filter((payment) => payment.status === "PENDING");
    const failed = payments.filter((payment) => payment.status === "FAILED");

    return {
      total: payments.length,
      paid: paid.length,
      pending: pending.length,
      failed: failed.length,
      paidAmount: paid.reduce((sum, payment) => sum + Number(payment.amount), 0),
    };
  }, [payments]);

  return (
    <ProtectedShell
      badge="Admin payments"
      title="Payment review"
      subtitle="Review M-Pesa, Paystack card, cash/manual, pending, failed, paid, and refunded payments."
    >
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard title="Payments" value={stats.total} />
          <SummaryCard title="Paid" value={stats.paid} />
          <SummaryCard title="Pending" value={stats.pending} />
          <SummaryCard title="Paid amount" value={money(stats.paidAmount)} />
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Payment records
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Use this page to confirm what happened before checking an order.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-orange-600"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="ALL">All payments</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>

              <button
                type="button"
                onClick={() => void loadPayments()}
                className="h-11 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <p className="mt-6 text-sm text-slate-600">Loading payments...</p>
          ) : filteredPayments.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              No payments found.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            payment.status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : payment.status === "FAILED"
                                ? "bg-red-100 text-red-700"
                                : payment.status === "REFUNDED"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {niceStatus(payment.status)}
                        </span>

                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
                          {payment.provider}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                          {payment.method}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black text-slate-950">
                        {money(payment.amount, payment.currency)}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {customerName(payment)} —{" "}
                        {payment.user?.email || payment.payerEmail || "No email"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Created: {new Date(payment.createdAt).toLocaleString()}
                      </p>

                      {payment.paidAt ? (
                        <p className="mt-1 text-xs text-green-700">
                          Paid: {new Date(payment.paidAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>

                    <div className="lg:text-right">
                      <p className="text-xs font-black uppercase tracking-wide text-orange-700">
                        Invoice
                      </p>

                      <Link
                        href={`/orders/${payment.order.id}`}
                        className="mt-1 block text-lg font-black text-slate-950 hover:text-orange-700"
                      >
                        {payment.order.invoiceNumber}
                      </Link>

                      <p className="mt-1 text-sm text-slate-600">
                        Order {niceStatus(payment.order.status)}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Payment {niceStatus(payment.order.paymentStatus)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <span className="font-bold">Transaction/reference:</span>{" "}
                      {payment.transactionId || "N/A"}
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      <span className="font-bold">Checkout request:</span>{" "}
                      {payment.checkoutRequestId || "N/A"}
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      <span className="font-bold">Phone:</span>{" "}
                      {payment.phone || payment.user?.phone || "N/A"}
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      <span className="font-bold">Order total:</span>{" "}
                      {money(payment.order.totalAmount)}
                    </div>
                  </div>

                  {payment.failureReason ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                      {payment.failureReason}
                    </div>
                  ) : null}
                </div>
              ))}
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