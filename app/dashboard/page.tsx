"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Headset,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  ReceiptText,
  SearchCheck,
  Utensils,
  Sparkles,
  Wrench,
  Search,
} from "lucide-react";
import ProtectedShell from "@/components/layout/ProtectedShell";
import SiteBannerStrip from "@/components/store/SiteBannerStrip";

type Product = {
  id: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  stock: number;
  status: string;
  category?: string | null;
  brand?: string | null;
  discountPercent?: number;
};

type StoreResponse = {
  products?: Product[];
  error?: string;
};

const actions = [
  {
    title: "Shop online",
    description: "Browse products, add items to basket, and checkout safely.",
    href: "/online-store",
    icon: Store,
    primary: true,
  },
  {
    title: "My basket",
    description: "Review selected items, change quantity, or remove products.",
    href: "/cart",
    icon: ShoppingBag,
  },
  {
    title: "My orders",
    description: "View order history, invoices, receipts, and delivery details.",
    href: "/orders",
    icon: ReceiptText,
  },
  {
    title: "Track order",
    description: "Use your invoice number to check order progress.",
    href: "/track-order",
    icon: SearchCheck,
  },
  {
    title: "Support",
    description: "Get help with account, orders, payments, or navigation.",
    href: "/support",
    icon: Headset,
  },
  {
    title: "Profile & Settings",
    description: "Manage profile, phone, address, account, and security options.",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Security",
    description: "Change password or manage secure account access.",
    href: "/auth/change-password",
    icon: ShieldCheck,
  },
];

const stores = [
  {
    title: "Online Store",
    href: "/online-store",
    icon: Store,
    note: "Electronics, fashion, home",
  },
  {
    title: "Fast Food",
    href: "/fast-food",
    icon: Utensils,
    note: "Meals, snacks, drinks",
  },
  {
    title: "Exclusive",
    href: "/exclusive-store",
    icon: Sparkles,
    note: "Premium items",
  },
  {
    title: "Hardware",
    href: "/hardware",
    icon: Wrench,
    note: "Coming soon",
  },
];

const quickShopping = [
  { title: "Phones", href: "/online-store?category=Phones" },
  { title: "Appliances", href: "/online-store?category=Appliances" },
  { title: "Beauty", href: "/online-store?category=Beauty" },
  { title: "Shoes", href: "/online-store?category=Shoes" },
];

const shortcuts = [
  { title: "Orders", href: "/orders" },
  { title: "Track", href: "/track-order" },
  { title: "Support", href: "/support" },
  { title: "Account", href: "/settings" },
];

function money(value: string | number) {
  return `KES ${Number(value || 0).toLocaleString()}`;
}

function discountedPrice(price: string | number, discountPercent?: number) {
  const original = Number(price);
  const discount = Number(discountPercent || 0);

  if (!Number.isFinite(original) || discount <= 0) return original;

  return Math.max(0, original - (original * discount) / 100);
}

export default function DashboardPage() {
  const [mobileDeals, setMobileDeals] = useState<Product[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);

  useEffect(() => {
    const loadMobileDeals = async () => {
      try {
        setDealsLoading(true);

        const response = await fetch("/api/store/products?section=ONLINE_STORE");
        const data = (await response.json()) as StoreResponse;

        const products = (data.products || []).filter(
          (product) => product.status === "ACTIVE" && product.stock > 0
        );

        const sorted = [...products].sort((a, b) => {
          const discountA = Number(a.discountPercent || 0);
          const discountB = Number(b.discountPercent || 0);

          if (discountB !== discountA) return discountB - discountA;

          return Number(b.stock || 0) - Number(a.stock || 0);
        });

        setMobileDeals(sorted.slice(0, 8));
      } catch {
        setMobileDeals([]);
      } finally {
        setDealsLoading(false);
      }
    };

    void loadMobileDeals();
  }, []);

  const hasDiscountedDeals = useMemo(
    () => mobileDeals.some((product) => Number(product.discountPercent || 0) > 0),
    [mobileDeals]
  );

  return (
    <ProtectedShell
      badge="Customer dashboard"
      title="Welcome to STN Commerce"
      subtitle="A simple place to shop, manage your basket, check orders, track deliveries, and contact support."
    >
      {/* MOBILE HOME ONLY */}
      <section className="w-full max-w-full overflow-x-hidden space-y-4 rounded-[28px] bg-slate-50 p-2 lg:hidden">
        <Link
          href="/online-store"
          className="flex h-14 items-center rounded-[24px] border border-slate-200 bg-white px-4 shadow-sm"
        >
          <Search className="mr-3 h-5 w-5 text-slate-400" />
          <span className="text-sm font-bold text-slate-400">
            Search on STN Commerce
          </span>
        </Link>

        <SiteBannerStrip placement="DASHBOARD" />

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Stores</h2>
            <Link
              href="/online-store"
              className="text-xs font-black text-orange-600"
            >
              Shop now
            </Link>
          </div>

          <div className="flex w-full max-w-full gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stores.map((store) => {
              const Icon = store.icon;

              return (
                <Link
                  key={store.href}
                  href={store.href}
                  className="w-[138px] shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <Icon className="h-5 w-5 text-orange-600" />

                  <p className="mt-2 text-sm font-black text-slate-950">
                    {store.title}
                  </p>

                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                    {store.note}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-black text-slate-950">
              Quick shopping
            </h2>
            <Link
              href="/online-store"
              className="text-xs font-black text-orange-600"
            >
              See all
            </Link>
          </div>

          <div className="flex w-full max-w-full gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quickShopping.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-black text-slate-950">
              Your shortcuts
            </h2>
            <span className="text-xs font-black text-orange-600">Tools</span>
          </div>

          <div className="flex w-full max-w-full gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shortcuts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-black text-slate-950">
              {hasDiscountedDeals ? "Top deals" : "Recommended for you"}
            </h2>
            <Link
              href="/online-store"
              className="text-xs font-black text-orange-600"
            >
              See all
            </Link>
          </div>

          {dealsLoading ? (
            <p className="text-sm font-semibold text-slate-500">
              Loading deals...
            </p>
          ) : mobileDeals.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
              No active products yet. Add products from admin store manager.
            </div>
          ) : (
            <div className="flex w-full max-w-full gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {mobileDeals.map((product) => {
                const finalPrice = discountedPrice(
                  product.price,
                  product.discountPercent
                );
                const hasDiscount =
                  Number(product.discountPercent || 0) > 0;

                return (
                  <Link
                    key={product.id}
                    href={`/online-store/${product.id}`}
                    className="w-[136px] shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition active:scale-[0.98]"
                  >
                    <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-slate-300" />
                      )}

                      {hasDiscount ? (
                        <span className="absolute right-1 top-1 rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black text-orange-700">
                          -{product.discountPercent}%
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-700">
                      {product.name}
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-950">
                      {money(finalPrice)}
                    </p>

                    {hasDiscount ? (
                      <p className="text-[11px] font-bold text-slate-400 line-through">
                        {money(product.price)}
                      </p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50 p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wide text-orange-600">
            Start here
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-950">
            Shop safely, track easily.
          </h1>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Browse stores, add products to cart, checkout, then track your order
            anytime.
          </p>

          <Link
            href="/online-store"
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white"
          >
            Open store <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* DESKTOP ONLY - unchanged */}
      <div className="hidden space-y-6 lg:block">
        <SiteBannerStrip placement="DASHBOARD" />

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group rounded-[28px] border p-6 shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-lg ${
                  item.primary
                    ? "border-orange-200 bg-gradient-to-br from-orange-50 to-rose-50 ring-orange-100"
                    : "border-white/50 bg-white/90 ring-slate-200/70"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    item.primary
                      ? "bg-orange-600 text-white"
                      : "bg-gradient-to-br from-orange-100 to-rose-100 text-orange-700"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>

                <div className="mt-4 inline-flex items-center text-sm font-bold text-orange-700">
                  Open{" "}
                  <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Quick guide
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <span className="font-bold text-slate-950">1. Browse</span>
              <br />
              Open the store and choose a category like electronics or food.
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <span className="font-bold text-slate-950">2. Add to basket</span>
              <br />
              Select quantity before checkout. Stock is protected by the system.
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <span className="font-bold text-slate-950">3. Checkout</span>
              <br />
              Delivery address is required before an order can be completed.
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <span className="font-bold text-slate-950">4. Track</span>
              <br />
              Use your invoice number to follow order progress anytime.
            </div>
          </div>
        </section>
      </div>
    </ProtectedShell>
  );
}