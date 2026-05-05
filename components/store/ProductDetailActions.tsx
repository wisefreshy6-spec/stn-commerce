"use client";

import { useEffect, useState } from "react";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";

type ProductDetailActionsProps = {
  product: {
    id: string;
    name: string;
    price: string;
    imageUrl?: string | null;
    stock: number;
    sizes?: string[];
    colors?: string[];
  };
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

function makeVariantKey(productId: string, size?: string, color?: string) {
  return `${productId}::${size || "NO_SIZE"}::${color || "NO_COLOR"}`;
}

export default function ProductDetailActions({
  product,
}: ProductDetailActionsProps) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [message, setMessage] = useState("");

  const sizes = product.sizes || [];
  const colors = product.colors || [];
  const isSaved = savedIds.includes(product.id);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("stn_saved_products");
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];

      setSavedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedIds([]);
    }
  }, []);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [message]);

  const toggleSaved = () => {
    const next = isSaved
      ? savedIds.filter((id) => id !== product.id)
      : [...savedIds, product.id];

    setSavedIds(next);
    window.localStorage.setItem("stn_saved_products", JSON.stringify(next));
    window.dispatchEvent(new Event("stn_saved_products_updated"));
    setMessage(isSaved ? "Removed from saved items." : "Saved for later.");
  };

  const addToCart = () => {
    if (product.stock <= 0) {
      setMessage("This product is out of stock.");
      return;
    }

    if (sizes.length > 0 && !selectedSize) {
      setMessage("Choose a size first.");
      return;
    }

    if (colors.length > 0 && !selectedColor) {
      setMessage("Choose a color first.");
      return;
    }

    const variantKey = makeVariantKey(product.id, selectedSize, selectedColor);
    const currentCart = getCart();
    const existing = currentCart.find((item) => item.variantKey === variantKey);

    let nextCart: CartItem[];

    if (existing) {
      nextCart = currentCart.map((item) =>
        item.variantKey === variantKey
          ? {
              ...item,
              quantity: Math.min(item.quantity + quantity, product.stock),
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
          quantity,
          stock: product.stock,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
        },
      ];
    }

    saveCart(nextCart);
    setMessage("Added to cart.");
  };

  return (
    <>
      <div className="space-y-3">
        {message ? (
          <div className="animate-slideDown rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white md:mb-0">
            {message}
          </div>
        ) : null}

        {sizes.length > 0 ? (
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-black uppercase text-slate-500">Size</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-xl px-4 py-2 text-xs font-black ${
                    selectedSize === size
                      ? "bg-orange-600 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {colors.length > 0 ? (
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-black uppercase text-slate-500">Color</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`rounded-xl px-4 py-2 text-xs font-black ${
                    selectedColor === color
                      ? "bg-orange-600 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Desktop/tablet action controls only. Mobile uses sticky bar below. */}
        <div className="hidden rounded-2xl bg-slate-50 p-3 md:block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-slate-700">Quantity</span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="min-w-5 text-center text-sm font-black">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((current) => Math.min(product.stock, current + 1))
                }
                disabled={quantity >= product.stock}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white disabled:bg-slate-300"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_52px] gap-3">
            <button
              type="button"
              onClick={addToCart}
              disabled={product.stock <= 0}
              className={`inline-flex h-12 items-center justify-center rounded-2xl text-sm font-black ${
                product.stock <= 0
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-orange-600 text-white"
              }`}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {product.stock <= 0 ? "Out of stock" : "Add to cart"}
            </button>

            <button
              type="button"
              onClick={toggleSaved}
              className={`flex h-12 items-center justify-center rounded-2xl border transition active:scale-95 ${
                isSaved
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <Heart className={`h-5 w-5 ${isSaved ? "fill-white" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar */}
<div className="fixed bottom-0 left-0 right-0 z-[90] border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={toggleSaved}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition active:scale-95 ${
        isSaved
          ? "border-red-600 bg-red-600 text-white"
          : "border-slate-300 bg-white text-slate-700"
      }`}
      aria-label={isSaved ? "Remove from saved items" : "Save item"}
    >
      <Heart className={`h-5 w-5 ${isSaved ? "fill-white" : ""}`} />
    </button>

    <div className="flex h-11 shrink-0 items-center rounded-2xl border border-slate-200 bg-slate-50 px-1">
      <button
        type="button"
        onClick={() => setQuantity((current) => Math.max(1, current - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-900 active:bg-white"
        aria-label="Reduce quantity"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span className="min-w-[24px] text-center text-sm font-black text-slate-950">
        {quantity}
      </span>

      <button
        type="button"
        onClick={() =>
          setQuantity((current) => Math.min(product.stock, current + 1))
        }
        disabled={quantity >= product.stock}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-900 active:bg-white disabled:text-slate-300"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>

    <button
      type="button"
      onClick={addToCart}
      disabled={product.stock <= 0}
      className={`h-11 flex-1 rounded-2xl text-sm font-black shadow-sm transition active:scale-[0.98] ${
        product.stock <= 0
          ? "cursor-not-allowed bg-slate-200 text-slate-500"
          : "bg-orange-600 text-white shadow-orange-600/20"
      }`}
    >
      {product.stock <= 0 ? "Out of stock" : "Add to cart"}
    </button>
  </div>
</div>
    </>
  );
}