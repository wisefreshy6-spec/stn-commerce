"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { ArrowLeft, MoreHorizontal, ShoppingCart } from "lucide-react";

type CartItem = {
  quantity: number;
};

function getCartCount() {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem("stn_cart");
    const items = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

type MobileStoreTopBarProps = {
  showBack?: boolean;
  searchSlot?: ReactNode;
};

export default function MobileStoreTopBar({
  showBack = true,
  searchSlot,
}: MobileStoreTopBarProps) {
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const updateCart = () => setCartCount(getCartCount());

    updateCart();

    window.addEventListener("stn_cart_updated", updateCart);
    window.addEventListener("storage", updateCart);

    return () => {
      window.removeEventListener("stn_cart_updated", updateCart);
      window.removeEventListener("storage", updateCart);
    };
  }, []);

  return (
    <div className="sticky top-0 z-50 -mx-4 mb-3 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-slate-800"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        ) : null}

        <div className="min-w-0 flex-1">{searchSlot}</div>

        <Link
          href="/cart"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-900"
        >
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">
              {cartCount}
            </span>
          ) : null}
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-10 w-8 shrink-0 items-center justify-center rounded-full text-slate-900"
          >
            <MoreHorizontal className="h-6 w-6" />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <Link href="/dashboard" className="block border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800">
                Home
              </Link>
              <Link href="/online-store" className="block border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800">
                Store
              </Link>
              <Link href="/orders" className="block border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800">
                Orders
              </Link>
              <Link
                 href="/saved-items"
                 className="block border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800"
              >
                Saved Items
              </Link>
              <Link href="/settings" className="block px-4 py-3 text-sm font-bold text-slate-800">
                Account
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}