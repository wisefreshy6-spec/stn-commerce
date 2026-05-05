"use client";

import { useEffect, useState } from "react";
import ProtectedShell from "@/components/layout/ProtectedShell";

type AnalyticsData = {
  summary: {
    totalOrders: number;
    paidRevenue: number;
    pendingOrders: number;
    failedPayments: number;
    customers: number;
    products: number;
  };
  paymentSummary: Record<string, number>;
  stockSummary: {
    active: number;
    outOfStock: number;
    hidden: number;
  };
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  recentOrders: any[];
};

function money(value: number) {
  return `KES ${value.toLocaleString()}`;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();

        if (res.ok) setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <p className="p-6">Loading analytics...</p>;
  }

  if (!data) {
    return <p className="p-6 text-red-600">Failed to load analytics.</p>;
  }

  return (
    <ProtectedShell
      badge="Admin"
      title="Analytics dashboard"
      subtitle="Overview of sales, payments, products, and customers."
    >
      {/* SUMMARY */}
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card title="Orders" value={data.summary.totalOrders} />
        <Card title="Revenue" value={money(data.summary.paidRevenue)} />
        <Card title="Pending" value={data.summary.pendingOrders} />
        <Card title="Failed" value={data.summary.failedPayments} />
        <Card title="Customers" value={data.summary.customers} />
        <Card title="Products" value={data.summary.products} />
      </section>

      {/* PAYMENT SUMMARY */}
      <section className="mt-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold mb-4">Payment methods</h2>

        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(data.paymentSummary).map(([key, value]) => (
            <div
              key={key}
              className="rounded-xl border p-4 text-center"
            >
              <p className="text-sm text-gray-500">{key}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STOCK */}
      <section className="mt-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold mb-4">Stock status</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <Card title="Active" value={data.stockSummary.active} />
          <Card title="Out of stock" value={data.stockSummary.outOfStock} />
          <Card title="Hidden" value={data.stockSummary.hidden} />
        </div>
      </section>

      {/* TOP PRODUCTS */}
      <section className="mt-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold mb-4">Top products</h2>

        <div className="space-y-3">
          {data.topProducts.map((p, i) => (
            <div
              key={i}
              className="flex justify-between border rounded-xl p-3"
            >
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-500">
                  Sold: {p.quantity}
                </p>
              </div>

              <p className="font-bold">{money(p.revenue)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT ORDERS */}
      <section className="mt-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold mb-4">Recent orders</h2>

        <div className="space-y-3">
          {data.recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex justify-between border rounded-xl p-3"
            >
              <div>
                <p className="font-semibold">
                  {order.invoiceNumber}
                </p>
                <p className="text-sm text-gray-500">
                  {order.user?.email}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold">
                  {money(Number(order.totalAmount))}
                </p>
                <p className="text-xs text-gray-500">
                  {order.paymentStatus}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </ProtectedShell>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow text-center">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}