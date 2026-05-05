export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  section: string;
  category?: string | null;
  stock: number;
  quantity: number;
};

export const CART_STORAGE_KEY = "stn_cart";

export function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("stn-cart-updated"));
}

export function addCartItem(item: Omit<CartItem, "quantity">) {
  const current = getCartItems();

  const existing = current.find((cartItem) => cartItem.id === item.id);

  if (existing) {
    const next = current.map((cartItem) =>
      cartItem.id === item.id
        ? {
            ...cartItem,
            quantity: Math.min(cartItem.quantity + 1, cartItem.stock),
          }
        : cartItem
    );

    saveCartItems(next);
    return;
  }

  saveCartItems([...current, { ...item, quantity: 1 }]);
}

export function updateCartItemQuantity(productId: string, quantity: number) {
  const current = getCartItems();

  const next = current
    .map((item) =>
      item.id === productId
        ? {
            ...item,
            quantity: Math.max(1, Math.min(quantity, item.stock)),
          }
        : item
    )
    .filter((item) => item.quantity > 0);

  saveCartItems(next);
}

export function removeCartItem(productId: string) {
  const current = getCartItems();
  saveCartItems(current.filter((item) => item.id !== productId));
}

export function clearCart() {
  saveCartItems([]);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartTotalItems(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getDeliveryFee(area: string) {
  if (area === "NAIROBI_CBD") return 0;
  if (area === "NAIROBI_OUTSIDE_CBD") return 200;
  return 400;
}