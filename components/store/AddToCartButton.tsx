"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { addCartItem } from "@/lib/cart";

type AddToCartButtonProps = {
  product: {
    id: string;
    name: string;
    price: string | number;
    imageUrl?: string | null;
    section: string;
    category?: string | null;
    stock: number;
  };
};

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  const disabled = product.stock <= 0;

  const handleAdd = () => {
    if (disabled) return;

    addCartItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      section: product.section,
      category: product.category,
      stock: product.stock,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1200);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleAdd}
      className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {disabled ? "Out of stock" : added ? "Added to cart" : "Add to cart"}
    </button>
  );
}