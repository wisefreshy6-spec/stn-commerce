"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Grid2X2,
  Heart,
  Home,
  ShoppingCart,
  UserCircle,
} from "lucide-react";

type CartItem = {
  quantity?: number;
};

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/online-store", label: "Categories", icon: Grid2X2 },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/saved-items", label: "Saved", icon: Heart },
  { href: "/settings", label: "Account", icon: UserCircle },
];

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

function getSavedCount() {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem("stn_saved_products");
    const items = raw ? (JSON.parse(raw) as string[]) : [];

    return Array.isArray(items) ? items.length : 0;
  } catch {
    return 0;
  }
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  const hideOnPaths = [
    "/online-store/", // product details like /online-store/123
    "/checkout",
  ];

  const shouldHide = hideOnPaths.some(
    (path) => pathname.startsWith(path) && pathname !== "/online-store"
  );

  useEffect(() => {
    const updateCount = () => {
      setCartCount(getCartCount());
      setSavedCount(getSavedCount());
  };

    updateCount();

    window.addEventListener("stn_cart_updated", updateCount);
    window.addEventListener("stn_saved_products_updated", updateCount);
    window.addEventListener("storage", updateCount);

    return () => {
      window.removeEventListener("stn_cart_updated", updateCount);
      window.removeEventListener("stn_saved_products_updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                active ? "text-orange-600" : "text-slate-600"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />

                {item.label === "Cart" && cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[9px] font-black text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}

                {item.label === "Saved" && savedCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
                  {savedCount > 99 ? "99+" : savedCount}
                </span>
              ) : null}
              </div>
            
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}