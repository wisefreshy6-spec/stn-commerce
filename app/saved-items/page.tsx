"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MobileBottomNav from "@/components/store/MobileBottomNav";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  X,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  stock: number;
  category?: string | null;
  brand?: string | null;
  discountPercent?: number;
};

type CartItem = {
  productId: string;
  variantKey: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  quantity: number;
  stock: number;
  size?: string;
  color?: string;
};

function money(value: string | number) {
  return `KES ${Number(value).toLocaleString()}`;
}

function discountedPrice(price: string | number, discountPercent?: number) {
  const original = Number(price);
  const discount = Number(discountPercent || 0);

  if (!Number.isFinite(original) || discount <= 0) return original;

  return Math.max(0, original - (original * discount) / 100);
}

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem("stn_cart");
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  window.localStorage.setItem("stn_cart", JSON.stringify(items));
  window.dispatchEvent(new Event("stn_cart_updated"));
}

function makeVariantKey(productId: string) {
  return `${productId}::NO_SIZE::NO_COLOR`;
}

function saveSavedItems(ids: string[]) {
  window.localStorage.setItem("stn_saved_products", JSON.stringify(ids));
  window.dispatchEvent(new Event("stn_saved_products_updated"));
}

export default function SavedItemsPage() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
  const updateSavedAndCart = () => {
    try {
      const raw = window.localStorage.getItem("stn_saved_products");
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];

      setSavedIds(Array.isArray(parsed) ? parsed : []);
      setCartItems(getCart());
    } catch {
      setSavedIds([]);
      setCartItems([]);
    }
  };

  updateSavedAndCart();

  window.addEventListener("stn_saved_products_updated", updateSavedAndCart);
  window.addEventListener("stn_cart_updated", updateSavedAndCart);
  window.addEventListener("storage", updateSavedAndCart);

  return () => {
    window.removeEventListener("stn_saved_products_updated", updateSavedAndCart);
    window.removeEventListener("stn_cart_updated", updateSavedAndCart);
    window.removeEventListener("storage", updateSavedAndCart);
  };
}, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/store/products?section=ONLINE_STORE&limit=24");

        if (!response.ok) return;

        const data = await response.json();
        const items = Array.isArray(data.products) ? data.products : [];

        setProducts(items);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [message]);

  const savedProducts = useMemo(() => {
    return products.filter((product) => savedIds.includes(product.id));
  }, [products, savedIds]);

  const removeSaved = (productId: string) => {
    const updated = savedIds.filter((id) => id !== productId);

    setSavedIds(updated);
    saveSavedItems(updated);
  };

  const getProductCartQuantity = (productId: string) => {
    const variantKey = makeVariantKey(productId);
    const item = cartItems.find((cartItem) => cartItem.variantKey === variantKey);

    return item?.quantity || 0;
  };

  const updateCartQuantity = (product: Product, quantity: number) => {
    const variantKey = makeVariantKey(product.id);
    const currentCart = getCart();

    let nextCart: CartItem[];

    if (quantity <= 0) {
      nextCart = currentCart.filter((item) => item.variantKey !== variantKey);
      setMessage(`${product.name} removed from cart.`);
    } else {
      const safeQty = Math.max(1, Math.min(quantity, product.stock));
      const existing = currentCart.find((item) => item.variantKey === variantKey);

      if (existing) {
        nextCart = currentCart.map((item) =>
          item.variantKey === variantKey
            ? {
                ...item,
                quantity: safeQty,
                stock: product.stock,
              }
            : item
        );
      } else {
        nextCart = [
          ...currentCart,
          {
            productId: product.id,
            variantKey,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: safeQty,
            stock: product.stock,
          },
        ];
      }

      setMessage("Cart successfully updated.");
    }

    setCartItems(nextCart);
    saveCart(nextCart);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 pb-32 sm:px-6 sm:py-8 lg:px-8">
      {message ? (
        <div className="fixed left-0 right-0 top-0 z-[70] mx-auto flex max-w-6xl items-center justify-between bg-green-600 px-4 py-3 text-sm font-black text-white shadow-lg sm:top-4 sm:rounded-2xl">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {message}
          </span>

          <button type="button" onClick={() => setMessage("")}>
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      ) : null}

      <section className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        <div className="rounded-[24px] bg-white p-4 shadow-md ring-1 ring-slate-200 sm:rounded-[32px] sm:p-8 sm:shadow-xl">
          <div className="inline-flex rounded-full bg-red-100 px-4 py-1 text-sm font-black text-red-700">
            Saved Items
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Your saved items
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Items you saved for later will appear here.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border bg-white p-3"
              >
                <div className="h-28 rounded-xl bg-slate-200" />
                <div className="mt-3 h-3 w-3/4 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : savedProducts.length === 0 ? (
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-sm sm:rounded-[32px] sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100">
              <Heart className="h-8 w-8 text-red-700" />
            </div>

            <h2 className="mt-4 text-xl font-black text-slate-950 sm:text-2xl">
              No saved items yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Tap the heart icon on products you like so you can find them here
              later.
            </p>

            <Link
              href="/online-store"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700"
            >
              Browse store
              <ArrowRight className="ml-2 h-4 w-4 text-white" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {savedProducts.map((product) => {
              const finalPrice = discountedPrice(
                product.price,
                product.discountPercent
              );
              const hasDiscount =
                product.discountPercent && product.discountPercent > 0;
              const quantity = getProductCartQuantity(product.id);
              const isInCart = quantity > 0;

              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="grid grid-cols-[92px_1fr] gap-3">
                    <Link href={`/online-store/${product.id}`}>
                      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
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
                    </Link>

                    <div className="min-w-0">
                      <Link href={`/online-store/${product.id}`}>
                        <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                        {product.name}
                        </h3>

                        {isInCart ? (
                          <p className="mt-1 text-[11px] font-black text-green-700">
                            Already in cart · Qty {quantity}
                          </p>
                        ) : null}
                      </Link>

                      <div className="mt-2 flex items-center gap-2">
                        <p className="text-base font-black text-slate-950">
                          {money(finalPrice)}
                        </p>

                        {hasDiscount ? (
                          <span className="rounded bg-orange-50 px-1.5 py-0.5 text-xs font-black text-orange-700">
                            -{product.discountPercent}%
                          </span>
                        ) : null}
                      </div>

                      {hasDiscount ? (
                        <p className="text-xs font-bold text-slate-400 line-through">
                          {money(product.price)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => removeSaved(product.id)}
                      className="px-2 text-sm font-black text-orange-600"
                    >
                      Remove
                    </button>

                    {isInCart ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(product, quantity - 1)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm"
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <span className="min-w-5 text-center text-sm font-black text-slate-950">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(product, quantity + 1)
                          }
                          disabled={quantity >= product.stock}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm disabled:bg-slate-300"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(product, 1)}
                        disabled={product.stock <= 0}
                        className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-black shadow-sm ${
                          product.stock <= 0
                            ? "cursor-not-allowed bg-slate-200 text-slate-500"
                            : "bg-orange-500 text-white"
                        }`}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {product.stock <= 0 ? "Out of stock" : "Add To Cart"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <MobileBottomNav />
    </main>
  );
}