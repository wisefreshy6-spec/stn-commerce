"use client";

import { useEffect, useMemo, useState } from "react";
import MobileBottomNav from "@/components/store/MobileBottomNav";
import SiteBannerStrip from "@/components/store/SiteBannerStrip";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

type CartItem = {
  productId: string;
  variantKey?: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  quantity: number;
  stock: number;
  size?: string;
  color?: string;
};

type Product = {
  id: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  stock: number;
  category?: string | null;
  brand?: string | null;
};

  const recommendationLinks = [
  { label: "Phones", href: "/online-store?category=Phones" },
  { label: "Appliances", href: "/online-store?category=Appliances" },
  { label: "Flash Deals", href: "/online-store?deals=1" },
  { label: "Beauty", href: "/online-store?category=Beauty" },
  ];

function money(value: number) {
  return `KES ${value.toLocaleString()}`;
}

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const items = JSON.parse(localStorage.getItem("stn_cart") || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem("stn_cart", JSON.stringify(items));
  window.dispatchEvent(new Event("stn_cart_updated"));
  window.dispatchEvent(new Event("stn-cart-updated"));
}

function itemKey(item: CartItem) {
  return (
    item.variantKey ||
    `${item.productId}-${item.size || ""}-${item.color || ""}`
  );
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [checkingAuth, setCheckingAuth] = useState(false);

  useEffect(() => {
    setItems(getCart());
  }, []);

  useEffect(() => {
  const loadRecommendations = async () => {
    try {
      const response = await fetch("/api/store/products?section=ONLINE_STORE&limit=8");

      if (!response.ok) return;

      const data = await response.json();
      const products = Array.isArray(data.products) ? data.products : [];

      const cartProductIds = new Set(getCart().map((item) => item.productId));

      const filteredProducts = products.filter(
        (product: Product) => !cartProductIds.has(product.id)
    );

      setRecommendations(filteredProducts.slice(0, 8));

    } catch {
      setRecommendations([]);
    }
  };

  void loadRecommendations();
}, []);

  const summary = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    return { totalItems, subtotal };
  }, [items]);

  const updateQty = (key: string, qty: number, stock: number) => {
    const safeQty = Math.max(1, Math.min(qty, stock));

    const updated = items.map((item) =>
      itemKey(item) === key ? { ...item, quantity: safeQty } : item
    );

    setItems(updated);
    saveCart(updated);
  };

  const removeItem = (key: string) => {
    const updated = items.filter((item) => itemKey(item) !== key);

    setItems(updated);
    saveCart(updated);
  };

  const clearCart = () => {
    const confirmed = window.confirm("Clear all items from your basket?");

    if (!confirmed) return;

    setItems([]);
    saveCart([]);
  };

  const goToCheckout = async () => {
    try {
      setCheckingAuth(true);

      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (!data.user) {
        window.location.href = "/auth/login?next=/checkout";
        return;
      }

      window.location.href = "/checkout";
    } catch {
      window.location.href = "/auth/login?next=/checkout";
    } finally {
      setCheckingAuth(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 pb-32 sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        <SiteBannerStrip placement="CART" />
        <div className="rounded-[24px] bg-white p-4 shadow-md ring-1 ring-slate-200 sm:rounded-[32px] sm:p-8 sm:shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-black text-orange-700">
                Basket
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:mt-4 sm:text-5xl">
                Your basket
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Review your products, selected options, quantities, and subtotal
                before checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-row">
              <Link
                href="/online-store"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50 sm:h-12"
              >
                Continue shopping
              </Link>

              {items.length > 0 ? (
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-black text-red-700 hover:bg-red-100 sm:h-12"
                >
                  Clear basket
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-sm sm:rounded-[32px] sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100">
              <ShoppingBag className="h-8 w-8 text-orange-700" />
            </div>

            <h2 className="mt-4 text-xl font-black text-slate-950 sm:text-2xl">
              Your basket is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Add items from the store first. Your basket will show quantities,
              options, and checkout totals here.
            </p>

            <Link
              href="/online-store"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700"
            >
              Go to store
              <ArrowRight className="ml-2 h-4 w-4 text-white" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:gap-6">
            <div className="space-y-3 sm:space-y-4">
              {items.map((item) => {
                const key = itemKey(item);
                const price = Number(item.price);
                const lineTotal = price * item.quantity;
                const canAddMore = item.quantity < item.stock;

                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-[28px] sm:p-5"
                  >
                    <div className="grid grid-cols-[76px_1fr] gap-3 sm:grid-cols-[96px_1fr] sm:gap-4">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-20 w-20 rounded-xl object-cover sm:h-24 sm:w-24 sm:rounded-2xl"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-orange-100 text-xs font-black text-orange-700 sm:h-24 sm:w-24 sm:rounded-2xl">
                          STN
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 text-sm font-black text-slate-950 sm:text-lg">
                              {item.name}
                            </h3>

                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {money(price)} each
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                              {item.size ? (
                                <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black text-blue-700 sm:px-3 sm:text-xs">
                                  Size: {item.size}
                                </span>
                              ) : null}

                              {item.color ? (
                                <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-black text-purple-700 sm:px-3 sm:text-xs">
                                  Color: {item.color}
                                </span>
                              ) : null}

                              <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-black text-green-700 sm:px-3 sm:text-xs">
                                Stock {item.stock}
                              </span>
                            </div>
                          </div>

                          <div className="lg:text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">
                              Line total
                            </p>
                            <p className="mt-1 text-base font-black text-slate-950 sm:text-xl">
                              {money(lineTotal)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 sm:mt-5">
                          <div className="flex items-center gap-3">
                           <button
                             type="button"
                             onClick={() =>
                               updateQty(key, item.quantity - 1, item.stock)
                             }
                             className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm"
                             aria-label="Reduce quantity"
                           >
                             <Minus className="h-4 w-4" />
                           </button>

                           <span className="min-w-5 text-center text-sm font-black text-slate-950">
                            {item.quantity}
                           </span>

                           <button
                              type="button"
                              onClick={() =>
                               updateQty(key, item.quantity + 1, item.stock)
                             }
                             disabled={!canAddMore}
                             className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm disabled:bg-slate-300"
                             aria-label="Increase quantity"
                           >
                           <Plus className="h-4 w-4" />
                          </button>
                        </div>
                          <button
                            type="button"
                            onClick={() => removeItem(key)}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 hover:bg-red-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm"
                          >
                            <Trash2 className="mr-1.5 h-4 w-4 sm:mr-2" />
                            Remove
                          </button>
                        </div>

                        {!canAddMore ? (
                          <p className="mt-3 text-xs font-bold text-amber-700">
                            Maximum available stock selected.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="h-fit rounded-[24px] border border-slate-200 bg-white p-4 shadow-md sm:rounded-[32px] sm:p-6 sm:shadow-xl lg:sticky lg:top-6">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                Basket summary
              </h2>

              <div className="mt-5 space-y-4 text-sm sm:mt-6">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total items</span>
                  <span className="font-black text-slate-950">
                    {summary.totalItems}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-black text-slate-950">
                    {money(summary.subtotal)}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                  Delivery is calculated on checkout after selecting a county
                  and G4S pickup station.
                </div>

                {summary.subtotal >= 20000 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-900">
                    Orders of KES 20,000 and above require prepayment by M-Pesa
                    or card. Cash will be disabled at checkout.
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => void goToCheckout()}
                disabled={checkingAuth}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                {checkingAuth ? "Checking account..." : "Proceed to checkout"}
                <ArrowRight className="ml-2 h-4 w-4 text-white" />
              </button>

              <Link
                href="/online-store"
                className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Add more items
              </Link>
            </aside>
          </div>
        )}

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
  <div className="flex items-center justify-between">
    <h2 className="text-base font-black text-slate-950">
      You might also like
    </h2>

    <Link href="/online-store" className="text-xs font-black text-orange-600">
      See all
    </Link>
  </div>

  {recommendations.length > 0 ? (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
      {recommendations.map((product) => (
        <Link
          key={product.id}
          href={`/online-store/${product.id}`}
          className="min-w-[135px] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 active:scale-[0.98] sm:min-w-0"
        >
          <div className="flex h-24 items-center justify-center bg-white">
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
          </div>

          <div className="p-2">
            <p className="line-clamp-2 min-h-8 text-[11px] font-black leading-4 text-slate-900">
              {product.name}
            </p>

            <p className="mt-1 text-xs font-black text-orange-700">
              {money(Number(product.price))}
            </p>

            {product.category ? (
              <p className="mt-1 truncate text-[10px] font-bold text-slate-500">
                {product.category}
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <div className="mt-3 grid grid-cols-4 gap-2">
      {recommendationLinks.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="rounded-2xl bg-slate-50 px-2 py-3 text-center text-[11px] font-black text-slate-700 active:scale-95"
        >
          {item.label}
        </Link>
      ))}
    </div>
  )}
</div>
</section>

{items.length > 0 ? (
  <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-slate-200 bg-white px-3 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-500">Subtotal</p>
        <p className="truncate text-base font-black text-slate-950">
          {money(summary.subtotal)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => void goToCheckout()}
        disabled={checkingAuth}
        className="h-11 rounded-2xl bg-orange-600 px-5 text-sm font-black text-white disabled:bg-slate-300 disabled:text-slate-600"
      >
        {checkingAuth ? "Checking..." : "Checkout"}
      </button>
    </div>
  </div>
) : null}

<MobileBottomNav />
</main>
);
}