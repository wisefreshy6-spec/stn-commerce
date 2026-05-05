"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Barcode,
  BarChart3,
  Bell,
  FileText,
  Headset,
  Home,
  ReceiptText,
  SearchCheck,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserCircle2,
  Users,
} from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";
import AdminRiskAlerts from "@/components/admin/AdminRiskAlerts";
import AdminNotificationBell from "@/components/admin/AdminNotificationBell";
import MobileBottomNav from "@/components/store/MobileBottomNav";

type ProtectedShellProps = {
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
};

type UserRole = "CUSTOMER" | "TEAM" | "SUPPORT" | "ADMIN";

type CurrentUserResponse = {
  user?: {
    role: UserRole;
  } | null;
};

export default function ProtectedShell({
  title,
  subtitle,
  badge = "Protected area",
  children,
}: ProtectedShellProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>("CUSTOMER");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = (await response.json()) as CurrentUserResponse;

        if (data.user?.role) setRole(data.user.role);
      } catch {
        setRole("CUSTOMER");
      }
    };

    void loadUser();
  }, []);

  const isStaff = role === "ADMIN" || role === "SUPPORT" || role === "TEAM";
  const isAdmin = role === "ADMIN";

  const navItems = useMemo(
    () => [
      { title: "Dashboard", href: "/dashboard", icon: Home },
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Online store", href: "/online-store", icon: Store },
      { title: "Cart", href: "/cart", icon: ShoppingBag },
      { title: "My orders", href: "/orders", icon: ReceiptText },
      { title: "Track order", href: "/track-order", icon: SearchCheck },
      { title: "Contact support", href: "/support", icon: Headset },
      { title: "My tickets", href: "/support/my-tickets", icon: Headset },
      { title: "Settings", href: "/settings", icon: Settings },
      { title: "Security", href: "/auth/change-password", icon: ShieldCheck },
      {
        title: "Complete profile",
        href: "/auth/complete-profile",
        icon: UserCircle2,
      },
      ...(isStaff
        ? [
            { title: "Support inbox", href: "/admin/support", icon: Headset },
            {
              title: "Data requests",
              href: "/admin/data-requests",
              icon: FileText,
            },
            { title: "POS cashier", href: "/admin/pos", icon: ReceiptText },
          ]
        : []),
      ...(isAdmin
        ? [
            { title: "Users", href: "/admin/users", icon: Users },
            { title: "Admin dashboard", href: "/admin", icon: ShieldCheck },
            { title: "Store manager", href: "/admin/products", icon: Store },
            { title: "Banners & ads", href: "/admin/banners", icon: BarChart3 },
            { title: "Mobile categories", href: "/admin/categories", icon: Store },
            {
              title: "Mobile sections",
              href: "/admin/mobile-sections",
              icon: BarChart3,
            },
            { title: "Promo codes", href: "/admin/promos", icon: BarChart3 },
            { title: "Admin orders", href: "/admin/orders", icon: ReceiptText },
            { title: "Payments", href: "/admin/payments", icon: ShoppingBag },
            { title: "Sales analytics", href: "/admin/sales", icon: BarChart3 },
            { title: "Barcode labels", href: "/admin/barcodes", icon: Barcode },
          ]
        : []),
    ],
    [isAdmin, isStaff]
  );

  return (
    <main className="min-h-screen px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:px-8">
      {isAdmin ? <AdminRiskAlerts /> : null}

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden rounded-[32px] border border-white/50 bg-white/90 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur lg:block">
          <div className="flex items-start justify-between gap-3">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-500/25">
                STN
              </div>

              <div className="min-w-0">
                <div className="truncate text-lg font-black tracking-tight text-slate-950">
                  STN Commerce
                </div>
                <div className="truncate text-xs text-slate-500">
                  {isStaff ? "Staff workspace" : "Customer workspace"}
                </div>
              </div>
            </Link>

            {isAdmin ? <AdminNotificationBell /> : null}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Navigation
            </div>

            <nav className="mt-3 flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-orange-600 hover:text-white"
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-6">
            <LogoutButton />
          </div>
        </aside>

        <section className="space-y-6">
          <div className="hidden overflow-hidden rounded-[32px] border border-white/50 bg-white/90 shadow-xl ring-1 ring-slate-200/70 backdrop-blur lg:block">
            <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="p-8 sm:p-10">
                <div className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-bold text-orange-700">
                  {badge}
                </div>

                <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  {title}
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  {subtitle}
                </p>
              </div>

              <div className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-orange-600 p-8 text-white sm:p-10 lg:block">
                <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-bold text-white">
                  STN workspace
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-black text-white">
                      Consistent workspace
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/75">
                      Dashboard, store, orders, support, and admin tools share
                      one clean layout.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-black text-white">
                      Secure controls
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/75">
                      Role-based navigation keeps customer, support, team, and
                      admin actions separated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {children}
        </section>
      </div>

      <MobileBottomNav />
    </main>
  );
}