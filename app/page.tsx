"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Gem,
  Hammer,
  Headset,
  ShieldCheck,
  ShoppingBag,
  Users,
  UtensilsCrossed,
} from "lucide-react";

type CurrentUserResponse = {
  user?: {
    role?: string;
  } | null;
};

const businessLines = [
  {
    title: "Fast Food",
    href: "/online-store?section=FAST_FOOD",
    description: "Meals, snacks, drinks, and quick ordering for pickup.",
    icon: UtensilsCrossed,
  },
  {
    title: "Hardware Store",
    href: "/online-store?section=HARDWARE",
    description: "Tools, plumbing, electricals, and building materials coming soon.",
    icon: Hammer,
  },
  {
    title: "Online Store",
    href: "/online-store",
    description: "General shopping with categories, search, basket, and checkout.",
    icon: ShoppingBag,
  },
  {
    title: "Exclusive Store",
    href: "/online-store?section=EXCLUSIVE_STORE",
    description: "Premium products with a refined shopping experience.",
    icon: Gem,
  },
];

const highlights = [
  {
    title: "One shared account",
    description: "Customers use one account across store, orders, and support.",
    icon: Users,
  },
  {
    title: "Secure controls",
    description: "Customer, support, team, and admin areas stay separated.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = (await response.json()) as CurrentUserResponse;
        setLoggedIn(Boolean(data.user));
      } catch {
        setLoggedIn(false);
      } finally {
        setCheckedAuth(true);
      }
    };

    void checkUser();
  }, []);

  const homeHref = loggedIn ? "/dashboard" : "/";
  const mainCtaHref = loggedIn ? "/dashboard" : "/auth/register";
  const mainCtaText = loggedIn ? "Go to dashboard" : "Create account";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href={homeHref} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-500/25">
              STN
            </div>

            <div>
              <div className="text-lg font-black tracking-tight text-slate-950">
                STN Commerce
              </div>
              <div className="text-xs text-slate-500">
                Food, retail, premium, and digital commerce
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-3 md:flex">
            <Link
              href="/support"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Support
            </Link>

            {checkedAuth && loggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-2xl bg-orange-600 px-4 py-2 text-sm font-black text-white transition hover:bg-orange-700"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Log in
                </Link>

                <Link
                  href="/auth/register"
                  className="rounded-2xl bg-orange-600 px-4 py-2 text-sm font-black text-white transition hover:bg-orange-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
        <div>
          <div className="inline-flex rounded-full border border-orange-200 bg-orange-100 px-4 py-1 text-sm font-bold text-orange-700">
            Clean launch first · Full platform later
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            One modern platform for food, online shopping, premium products, and
            future hardware.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Shop, track orders, manage your basket, and contact support from one
            simple STN Commerce account.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={mainCtaHref}
              className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
            >
              {mainCtaText} <ArrowRight className="ml-2 h-4 w-4 text-white" />
            </Link>

            <Link
              href="/online-store"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Browse store
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/30 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/20">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-bold text-white">
            Built for growth
          </div>

          <h2 className="mt-5 text-2xl font-black">
            Structure it right from day one.
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/80">
            Customer orders, support tickets, POS cashier, barcodes, admin sales,
            and inventory are built as one connected system.
          </p>

          <div className="mt-6 space-y-4">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <Icon className="h-5 w-5 text-orange-300" />
                  <div className="mt-3 font-black text-white">{item.title}</div>
                  <div className="mt-1 text-sm text-white/70">
                    {item.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-slate-100 px-4 py-1 text-sm font-bold text-slate-700">
              Business sections
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              One brand, clean sections
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Users can browse sections publicly, but protected actions like
            checkout, orders, tickets, and account settings require login.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {businessLines.map((line) => {
            const Icon = line.icon;

            return (
              <Link
                key={line.title}
                href={line.href}
                className="rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
                  <Icon className="h-5 w-5 text-orange-700" />
                </div>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  {line.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {line.description}
                </p>

                <div className="mt-4 inline-flex items-center text-sm font-black text-orange-600">
                  View section <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="font-semibold">
            © {new Date().getFullYear()} STN Commerce. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-orange-700">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-orange-700">
              Privacy
            </Link>
            <Link href="/refund-policy" className="hover:text-orange-700">
              Refund policy
            </Link>
            <Link href="/support" className="hover:text-orange-700">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}