"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";

type RiskOrder = {
  id: string;
  invoiceNumber: string;
  totalAmount: string | number;
  paymentMethod?: string | null;
  paymentStatus: string;
  status: string;
  riskStatus?: string | null;
  riskReason?: string | null;
  createdAt: string;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};

type RiskResponse = {
  orders?: RiskOrder[];
  error?: string;
};

function money(value: string | number) {
  return `KES ${Number(value).toLocaleString()}`;
}

function customerName(order: RiskOrder) {
  return (
    [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
    order.user?.email ||
    "Customer"
  );
}

export default function AdminRiskAlerts() {
  const [orders, setOrders] = useState<RiskOrder[]>([]);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("stn_risk_alerts_closed");

    if (dismissed === "yes") {
      setClosed(true);
      return;
    }

    const loadAlerts = async () => {
      try {
        const response = await fetch("/api/admin/risk-alerts");
        const data = (await response.json()) as RiskResponse;

        if (response.ok) {
          setOrders(data.orders || []);
        }
      } catch {
        setOrders([]);
      }
    };

    void loadAlerts();
  }, []);

  if (closed || orders.length === 0) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-[80] mx-auto max-w-3xl rounded-[28px] border border-red-200 bg-white p-5 shadow-2xl ring-1 ring-red-100">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Urgent risk review needed
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {orders.length} order{orders.length === 1 ? "" : "s"} require
                admin review before progressing.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem("stn_risk_alerts_closed", "yes");
                setClosed(true);
              }}
              className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-red-100 bg-red-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-red-800">
                      {order.invoiceNumber} · {money(order.totalAmount)}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-700">
                      {customerName(order)} · {order.paymentMethod || "N/A"} ·{" "}
                      Payment {order.paymentStatus}
                    </p>

                    <p className="mt-1 text-xs font-bold leading-5 text-red-800">
                      Reason: {order.riskReason || "High-risk order flagged."}
                    </p>
                  </div>

                  <Link
                    href={`/admin/orders`}
                    className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700"
                  >
                    Review now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}