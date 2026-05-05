"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ProtectedShell from "@/components/layout/ProtectedShell";

type SalesData = {
  summary?: {
    totalRevenue: number;
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    totalExpenses: number;
    profit: number;
    totalOrders: number;
    todayOrders: number;
    weekOrders: number;
    monthOrders: number;
    activeProducts: number;
    lowStockCount: number;
    outOfStockProducts: number;
  };
  revenueTrend?: {
    date: string;
    label: string;
    revenue: number;
    orders: number;
  }[];
  paymentBreakdown?: {
    method: string;
    revenue: number;
    orders: number;
  }[];
  topProducts?: {
    name: string;
    quantitySold: number;
    revenue: number;
  }[];
  lowStockProducts?: {
    id: string;
    name: string;
    stock: number;
  }[];
  recentOrders?: {
    id: string;
    invoiceNumber?: string;
    total: string | number;
    createdAt: string;
    user?: {
      email?: string;
      firstName?: string | null;
      lastName?: string | null;
    };
  }[];
  error?: string;
};

function money(value: string | number) {
  return `KES ${Number(value).toLocaleString()}`;
}

export default function AdminSalesPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await fetch("/api/admin/sales");
      const result = (await response.json()) as SalesData;

      if (!response.ok) {
        setPageError(result.error || "Unable to load sales analytics.");
        setData(null);
        return;
      }

      setData(result);
    } catch {
      setPageError("Something went wrong while loading sales analytics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const summary = data?.summary;
  const revenueTrend = data?.revenueTrend || [];
  const paymentBreakdown = data?.paymentBreakdown || [];
  const topProducts = data?.topProducts || [];
  const lowStockProducts = data?.lowStockProducts || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <ProtectedShell
      badge="Admin analytics"
      title="Sales dashboard"
      subtitle="Admin-only revenue, expenses, profit, payment methods, product performance, and daily sales trends."
    >
      <section className="space-y-6">
        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Business overview
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Revenue, expenses, and profit are visible to admins only.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {pageError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}

          {loading ? (
            <p className="mt-6 text-sm text-slate-600">
              Loading sales analytics...
            </p>
          ) : !summary ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              No sales summary returned. Make sure you are logged in as ADMIN
              and `/api/admin/sales` is working.
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <StatCard
                  title="Total revenue"
                  value={money(summary.totalRevenue)}
                  dark
                />
                <StatCard
                  title="Total expenses"
                  value={money(summary.totalExpenses)}
                  danger
                />
                <StatCard
                  title="Profit"
                  value={money(summary.profit)}
                  profit={summary.profit >= 0}
                  danger={summary.profit < 0}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Today revenue"
                  value={money(summary.todayRevenue)}
                />
                <StatCard
                  title="7 days revenue"
                  value={money(summary.weekRevenue)}
                />
                <StatCard
                  title="30 days revenue"
                  value={money(summary.monthRevenue)}
                />
                <StatCard
                  title="Total orders"
                  value={summary.totalOrders}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Today orders" value={summary.todayOrders} />
                <StatCard title="7 days orders" value={summary.weekOrders} />
                <StatCard title="30 days orders" value={summary.monthOrders} />
                <StatCard title="Active products" value={summary.activeProducts} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <StatCard title="Low stock" value={summary.lowStockCount} warning />
                <StatCard title="Out of stock" value={summary.outOfStockProducts} danger />
              </div>
            </>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Real daily revenue trend
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Last 14 days grouped from actual paid orders in the database.
            </p>

            {revenueTrend.length === 0 ? (
              <p className="mt-6 text-sm text-slate-600">No trend data yet.</p>
            ) : (
              <div className="mt-6 h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "revenue"
                          ? money(value as number)
                          : Number(value).toLocaleString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      strokeWidth={3}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Payment method breakdown
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Revenue grouped by payment method.
            </p>

            {paymentBreakdown.length === 0 ? (
              <p className="mt-6 text-sm text-slate-600">
                No payment data yet.
              </p>
            ) : (
              <>
                <div className="mt-6 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="method" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) =>
                          name === "revenue"
                            ? money(value as number)
                            : Number(value).toLocaleString()
                        }
                      />
                      <Bar dataKey="revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 space-y-2">
                  {paymentBreakdown.map((item) => (
                    <div
                      key={item.method}
                      className="flex justify-between rounded-2xl bg-slate-50 p-3 text-sm"
                    >
                      <span className="font-semibold text-slate-700">
                        {item.method}
                      </span>
                      <span className="text-slate-600">
                        {item.orders} order(s) · {money(item.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Top selling products
            </h2>

            {topProducts.length === 0 ? (
              <p className="mt-6 text-sm text-slate-600">
                No product sales yet.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {topProducts.map((product, index) => (
                  <div
                    key={`${product.name}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="text-xs font-semibold text-orange-700">
                      #{index + 1}
                    </div>

                    <h3 className="mt-1 font-bold text-slate-950">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {product.quantitySold} sold
                    </p>

                    <p className="mt-2 text-sm font-bold text-slate-950">
                      {money(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Low stock alerts
            </h2>

            {lowStockProducts.length === 0 ? (
              <p className="mt-6 text-sm text-slate-600">
                No low-stock products.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-orange-200 bg-orange-50 p-4"
                  >
                    <h3 className="font-bold text-slate-950">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-orange-800">
                      {product.stock} left
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Recent orders
            </h2>

            {recentOrders.length === 0 ? (
              <p className="mt-6 text-sm text-slate-600">No recent orders.</p>
            ) : (
              <div className="mt-6 space-y-3">
                {recentOrders.map((order) => {
                  const customer =
                    [order.user?.firstName, order.user?.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    order.user?.email ||
                    "Customer";

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="text-xs font-semibold text-orange-700">
                        {order.invoiceNumber || "Invoice"}
                      </div>

                      <h3 className="mt-1 font-bold text-slate-950">
                        {money(order.total)}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">{customer}</p>

                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </ProtectedShell>
  );
}

function StatCard({
  title,
  value,
  dark = false,
  warning = false,
  danger = false,
  profit = false,
}: {
  title: string;
  value: string | number;
  dark?: boolean;
  warning?: boolean;
  danger?: boolean;
  profit?: boolean;
}) {
  if (dark) {
    return (
      <div className="rounded-[24px] bg-slate-950 p-6 text-white">
        <p className="text-sm text-white/60">{title}</p>
        <h3 className="mt-3 text-3xl font-black">{value}</h3>
      </div>
    );
  }

  return (
    <div
      className={`rounded-[24px] bg-white p-6 ring-1 ${
        danger
          ? "ring-red-200"
          : warning
            ? "ring-orange-200"
            : profit
              ? "ring-green-200"
              : "ring-slate-200"
      }`}
    >
      <p
        className={`text-sm ${
          danger
            ? "text-red-700"
            : warning
              ? "text-orange-700"
              : profit
                ? "text-green-700"
                : "text-slate-500"
        }`}
      >
        {title}
      </p>

      <h3
        className={`mt-3 text-3xl font-black ${
          danger
            ? "text-red-800"
            : warning
              ? "text-orange-800"
              : profit
                ? "text-green-800"
                : "text-slate-950"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}