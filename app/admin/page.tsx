"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShoppingBag,
  Users,
  BarChart3,
  ClipboardList,
  Star,
  Sparkles,
} from "lucide-react";
import ProtectedShell from "@/components/layout/ProtectedShell";
import MaintenanceToggle from "@/components/admin/MaintenanceToggle";

const adminActions = [
  {
    title: "Users",
    description: "Manage all users and accounts.",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Products",
    description: "Add, edit, and manage store items.",
    href: "/admin/products",
    icon: ShoppingBag,
  },
  {
    title: "Product Reviews",
    description: "Approve reviews, hide spam, and moderate verified feedback.",
    href: "/admin/reviews",
    icon: Star,
  },
  {
  title: "Mobile Sections",
  description: "Control Flash Sales, Deals, Recommended, and New Arrivals.",
  href: "/admin/mobile-sections",
  icon: Sparkles,
 },
  {
    title: "Orders",
    description: "View all orders and invoices.",
    href: "/admin/orders",
    icon: ClipboardList,
  },
  {
    title: "Sales analytics",
    description: "Revenue, profit, and insights dashboard.",
    href: "/admin/sales",
    icon: BarChart3,
  },
  {
    title: "Security review",
    description:
      "Future security logs, account flags, and suspicious activity checks.",
    href: "#",
    icon: ShieldCheck,
  },
];

export default function AdminPage() {
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const res = await fetch("/api/admin/reviews");
        const data = await res.json();

        if (res.ok) {
          const pending = (data.reviews || []).filter(
            (r: any) => !r.isApproved
          ).length;

          setPendingReviews(pending);
        }
      } catch {
        // silent fail (optional: log later)
      }
    };

    loadPending();
  }, []);

  return (
    <ProtectedShell
      badge="Admin panel"
      title="Admin dashboard"
      subtitle="Control your system, users, products, orders, and analytics from one place."
    >
      <section className="space-y-6">
        <MaintenanceToggle />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {adminActions.map((item) => {
            const Icon = item.icon;
            const isReviews = item.title === "Product Reviews";

            return (
              <div
                key={item.title}
                className={`rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg ${
                  isReviews && pendingReviews > 0
                    ? "ring-2 ring-red-200"
                    : ""
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100">
                  <Icon className="h-5 w-5 text-orange-700" />
                </div>

                {/* Title + Badge */}
                <div className="mt-4 flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-950">
                    {item.title}
                  </h3>

                  {isReviews && pendingReviews > 0 ? (
                    <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-black text-white">
                      {pendingReviews}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>

                {item.href !== "#" ? (
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    Open →
                  </Link>
                ) : (
                  <div className="mt-4 text-sm font-medium text-slate-400">
                    Coming soon
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </ProtectedShell>
  );
}