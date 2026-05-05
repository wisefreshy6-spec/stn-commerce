"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  ShieldCheck,
  Smartphone,
  Truck,
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

type CheckoutResponse = {
  message?: string;
  orderId?: string;
  paymentMethod?: "CASH" | "MPESA" | "CARD" | "PAYPAL";
  error?: string;
};

type MpesaResponse = {
  message?: string;
  error?: string;
};

type PaystackResponse = {
  message?: string;
  error?: string;
  authorizationUrl?: string;
  reference?: string;
};

const HIGH_VALUE_ORDER_LIMIT = 20000;
const ADMIN_REVIEW_ORDER_LIMIT = 50000;


const pickupStations = [
  { county: "Nairobi", station: "G4S Nairobi CBD Pickup Station", deliveryFee: 0 },
  { county: "Kiambu", station: "G4S Thika Pickup Station", deliveryFee: 250 },
  { county: "Nakuru", station: "G4S Nakuru Pickup Station", deliveryFee: 350 },
  { county: "Kisii", station: "G4S Kisii Pickup Station", deliveryFee: 400 },
  { county: "Nyamira", station: "G4S Keroka Pickup Station", deliveryFee: 400 },
  { county: "Mombasa", station: "G4S Mombasa Pickup Station", deliveryFee: 400 },
];

function money(value: string | number) {
  return `KES ${Number(value).toLocaleString()}`;
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

function itemKey(item: CartItem) {
  return (
    item.variantKey ||
    `${item.productId}-${item.size || ""}-${item.color || ""}`
  );
}

function normalizeKenyaPhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 12);
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  return digitsOnly(value)
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function detectCardBrand(value: string) {
  const digits = digitsOnly(value);

  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^2(2[2-9]|[3-6]|7[01]|720)/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "American Express";
  if (/^6(?:011|5)/.test(digits)) return "Discover";
  if (/^35/.test(digits)) return "JCB";
  if (/^3(?:0[0-5]|[68])/.test(digits)) return "Diners Club";
  if (!digits) return "Card";
  return "Unknown card";
}

function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);

  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function expectedCardLength(brand: string) {
  if (brand === "American Express") return 15;
  if (brand === "Diners Club") return 14;
  return 16;
}

function expectedCvvLength(brand: string) {
  return brand === "American Express" ? 4 : 3;
}

function isValidExpiry(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const year = Number(`20${match[2]}`);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  if (year > currentYear + 15) return false;

  return true;
}

function isValidDeliveryAddress(value: string) {
  const cleaned = value.trim();

  const hasEnoughLength = cleaned.length >= 10;
  const hasLetter = /[a-zA-Z]/.test(cleaned);
  const hasNumber = /\d/.test(cleaned);
  const hasLocationWord =
    /\b(road|rd|street|st|avenue|ave|estate|building|house|plot|flat|floor|near|opposite|behind|mall|stage|center|centre|po box|p\.o|box)\b/i.test(
      cleaned
    );

  return hasEnoughLength && hasLetter && (hasNumber || hasLocationWord);
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCounty, setDeliveryCounty] = useState("Nairobi");
  const [pickupStation, setPickupStation] = useState(
    "G4S Nairobi CBD Pickup Station"
  );

  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "MPESA" | "CARD" | "PAYPAL"
  >("CASH");

  const [mpesaPhone, setMpesaPhone] = useState("");

  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [loading, setLoading] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");
  const [error, setError] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (!data.user) {
          window.location.href = "/auth/login?next=/checkout";
          return;
        }

        setItems(getCart());

        if (data.user.phone) {
          setMpesaPhone(String(data.user.phone).replace(/\D/g, ""));
        }

        if (data.user.address) setDeliveryAddress(data.user.address);

        if (data.user.city) {
          setDeliveryAddress((current) =>
            current ? current : String(data.user.city)
          );
        }
      } catch {
        window.location.href = "/auth/login?next=/checkout";
      } finally {
        setCheckingAuth(false);
      }
    };

    void checkAuth();
  }, []);

  const availableStations = pickupStations.filter(
    (item) => item.county === deliveryCounty
  );

  const selectedStation = pickupStations.find(
    (item) => item.county === deliveryCounty && item.station === pickupStation
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      ),
    [items]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const deliveryFee = selectedStation?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;
  const payableTotal = Math.max(0, total - discountAmount);
  const requiresPrepayment = payableTotal >= HIGH_VALUE_ORDER_LIMIT;

  const allowedPaymentMethods = useMemo(
    () => 
    payableTotal >= HIGH_VALUE_ORDER_LIMIT
      ? ["MPESA", "CARD", "PAYPAL"]
      : ["CASH", "MPESA", "CARD"],
    [payableTotal]
  );

  const cardBrand = detectCardBrand(cardNumber);

  useEffect(() => {
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(requiresPrepayment ? "MPESA" : "CASH");
    }
  }, [allowedPaymentMethods, paymentMethod, requiresPrepayment]);

  const changeCounty = (county: string) => {
    setDeliveryCounty(county);
    setError("");

    const firstStation = pickupStations.find((item) => item.county === county);
    setPickupStation(firstStation?.station || "");
  };

  const startMpesaPayment = async (orderId: string) => {
    const response = await fetch("/api/payments/mpesa/stk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        phone: mpesaPhone,
      }),
    });

    const data = (await response.json()) as MpesaResponse;

    if (!response.ok) {
      throw new Error(data.error || "Unable to start M-Pesa payment.");
    }

    setPaymentNotice(
      data.message ||
        "M-Pesa prompt sent. Enter PIN on your phone to complete payment."
    );
  };

  const startCardPayment = async (orderId: string) => {
    const response = await fetch("/api/payments/paystack/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
      }),
    });

    const data = (await response.json()) as PaystackResponse;

    if (!response.ok || !data.authorizationUrl) {
      throw new Error(data.error || "Unable to start card payment.");
    }

    localStorage.removeItem("stn_cart");
    window.dispatchEvent(new Event("stn_cart_updated"));
    window.dispatchEvent(new Event("stn-cart-updated"));
    window.location.href = data.authorizationUrl;
  };

  const applyPromoCode = async () => {
    setPromoError("");
    setPromoSuccess("");
    setDiscountAmount(0);

    if (!promoCode.trim()) {
      setPromoError("Enter a promo code.");
      return;
    }

    if (subtotal <= 0) {
      setPromoError("Add items to your basket before applying a promo code.");
      return;
    }

    try {
      setPromoLoading(true);

      const res = await fetch("/api/public/promos/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          subtotal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPromoError(data.error || "Invalid promo code.");
        return;
      }

      setDiscountAmount(Number(data.discountAmount || 0));
      setPromoSuccess(data.message || "Promo applied.");
    } catch {
      setPromoError("Failed to apply promo.");
    } finally {
      setPromoLoading(false);
    }
  };

  const checkout = async () => {
    setError("");
    setPaymentNotice("");

    if (items.length === 0) {
      setError("Your basket is empty.");
      return;
    }

    if (!isValidDeliveryAddress(deliveryAddress)) {
      setError("Enter a realistic delivery address with house/plot/road/estate/landmark details.");
      return;
    }

    if (!deliveryCounty || !pickupStation) {
      setError("Select a supported G4S pickup station.");
      return;
    }

    if (requiresPrepayment && paymentMethod === "CASH") {
      setError(
        "Orders of KES 20,000 and above must be prepaid using M-Pesa or Card."
      );
      return;
    }

if (payableTotal >= ADMIN_REVIEW_ORDER_LIMIT) {
  setError(
    "Orders above KES 50,000 require admin review before payment. Please contact support or reduce the order amount."
  );
  return;
}

    if (paymentMethod === "PAYPAL") {
      setError("PayPal is reserved for later and is not active yet.");
      return;
    }

    if (paymentMethod === "MPESA" && !mpesaPhone.trim()) {
      setError("Enter the Safaricom number to receive the M-Pesa prompt.");
      return;
    }

    if (paymentMethod === "CARD") {
      const nameParts = cardholderName.trim().split(" ").filter(Boolean);
      const cardDigits = digitsOnly(cardNumber);
      const requiredCardLength = expectedCardLength(cardBrand);
      const requiredCvvLength = expectedCvvLength(cardBrand);

    if (nameParts.length < 2) {
      setError("Enter full cardholder name (first and last name).");
      return;
    }

    if (cardBrand === "Unknown card" || cardBrand === "Card") {
      setError("Enter a supported card number.");
      return;
    }

    if (cardDigits.length !== requiredCardLength) {
      setError(`${cardBrand} card number should be ${requiredCardLength} digits.`);
      return;
    }

    if (!isValidExpiry(cardExpiry)) {
      setError("Enter a valid future expiry date in MM/YY format.");
      return;
    }

    if (cardCvv.length !== requiredCvvLength) {
      setError(`${cardBrand} CVV should be ${requiredCvvLength} digits.`);
      return;
    }
  }

    try {
      setLoading(true);

      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryAddress,
          deliveryCounty,
          pickupStation,
          paymentMethod,
          promoCode: promoCode.trim().toUpperCase(),
          cardholderName,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size || "",
            color: item.color || "",
          })),
        }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (response.status === 401) {
        window.location.href = "/auth/login?next=/checkout";
        return;
      }

      if (!response.ok || !data.orderId) {
        setError(data.error || "Checkout failed.");
        return;
      }

      if (paymentMethod === "MPESA") {
        await startMpesaPayment(data.orderId);

        localStorage.removeItem("stn_cart");
        window.dispatchEvent(new Event("stn_cart_updated"));
        window.dispatchEvent(new Event("stn-cart-updated"));

        setTimeout(() => {
          window.location.href = `/orders/${data.orderId}`;
        }, 1800);

        return;
      }

      if (paymentMethod === "CARD") {
        await startCardPayment(data.orderId);
        return;
      }

      localStorage.removeItem("stn_cart");
      window.dispatchEvent(new Event("stn_cart_updated"));
      window.dispatchEvent(new Event("stn-cart-updated"));

      setTimeout(() => {
        window.location.href = `/orders/${data.orderId}`;
      }, 300);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while checking out.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
          <p className="text-sm font-bold text-slate-600">
            Checking your account...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/cart"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to basket
          </Link>

          <Link
            href="/online-store"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Continue shopping
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-[32px] bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
            <div className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-black text-orange-700">
              Secure checkout
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Complete your order
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Confirm delivery details, choose a pickup station, then select a
              payment method. Orders of KES 20,000 and above require prepayment.
            </p>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
                {error}
              </div>
            ) : null}

            {paymentNotice ? (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-black text-green-700">
                {paymentNotice}
              </div>
            ) : null}

            <div className="mt-8 space-y-7">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-700" />
                  <h2 className="text-xl font-black text-slate-950">
                    Delivery details
                  </h2>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-black text-slate-700">
                      Delivery address
                    </label>
                    <textarea
                      className="mt-2 min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-orange-600"
                      placeholder="House number, estate, road, nearby landmark"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-black text-slate-700">
                        County
                      </label>
                      <select
                        className="mt-2 h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none focus:border-orange-600"
                        value={deliveryCounty}
                        onChange={(e) => changeCounty(e.target.value)}
                      >
                        {Array.from(
                          new Set(pickupStations.map((item) => item.county))
                        ).map((county) => (
                          <option key={county} value={county}>
                            {county}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-black text-slate-700">
                        G4S pickup station
                      </label>
                      <select
                        className="mt-2 h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none focus:border-orange-600"
                        value={pickupStation}
                        onChange={(e) => setPickupStation(e.target.value)}
                      >
                        {availableStations.length === 0 ? (
                          <option value="">No station available</option>
                        ) : (
                          availableStations.map((item) => (
                            <option key={item.station} value={item.station}>
                              {item.station}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
                    <CheckCircle2 className="mb-2 h-5 w-5" />
                    Nairobi CBD pickup is free. Other supported pickup stations
                    are capped at KES 400.
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-orange-700" />
                  <h2 className="text-xl font-black text-slate-950">
                    Payment method
                  </h2>
                </div>

                {requiresPrepayment ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                    This order is KES 20,000 or above. Cash/pay on delivery is
                    disabled.
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {allowedPaymentMethods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      disabled={method === "PAYPAL"}
                      onClick={() => {
                        if (method !== "PAYPAL") {
                          setPaymentMethod(
                            method as "CASH" | "MPESA" | "CARD" | "PAYPAL"
                          );
                        }
                      }}
                      className={`rounded-2xl border p-4 text-left text-sm font-black transition ${
                        method === "PAYPAL"
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : paymentMethod === method
                            ? "border-orange-600 bg-orange-600 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {method === "MPESA"
                        ? "M-Pesa"
                        : method === "PAYPAL"
                          ? "PayPal soon"
                          : method === "CARD"
                            ? "Card"
                            : "Cash"}

                      <span className="mt-1 block text-xs font-semibold opacity-75">
                        {method === "MPESA"
                          ? "STK prompt"
                          : method === "CARD"
                            ? "Paystack checkout"
                            : method === "PAYPAL"
                              ? "Not active yet"
                              : "Pay on delivery"}
                      </span>
                    </button>
                  ))}
                </div>

                {paymentMethod === "MPESA" ? (
                  <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                    <label className="text-sm font-black text-green-800">
                      M-Pesa phone number
                    </label>

                    <div className="mt-2 flex overflow-hidden rounded-2xl border border-green-300 bg-white focus-within:border-green-600">
                      <div className="flex h-12 items-center bg-green-100 px-4 text-sm font-black text-green-800">
                        <Smartphone className="mr-2 h-4 w-4" />
                        M-Pesa
                      </div>

                      <input
                        inputMode="numeric"
                        className="h-12 min-w-0 flex-1 px-4 text-sm font-black text-slate-950 outline-none"
                        placeholder="2547XXXXXXXX"
                        value={mpesaPhone}
                        onChange={(e) =>
                          setMpesaPhone(normalizeKenyaPhoneInput(e.target.value))
                        }
                      />
                    </div>

                    <p className="mt-2 text-xs leading-5 text-green-800">
                      M-Pesa sandbox may still show credential errors until
                      Daraja is fully corrected. The code flow remains ready.
                    </p>
                  </div>
                ) : null}

                {paymentMethod === "CARD" ? (
                  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-black text-blue-800">
                        Card preview
                      </label>

                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-800 ring-1 ring-blue-200">
                        {cardBrand === "Visa" && (
                          <span className="text-blue-700 font-black">VISA</span>
                        )}

                        {cardBrand === "Mastercard" && (
                          <span className="flex items-center gap-1">
                            <span className="h-3 w-3 rounded-full bg-red-500"></span>
                            <span className="h-3 w-3 rounded-full bg-yellow-400 -ml-1"></span>
                            <span className="ml-1 text-xs font-black">Mastercard</span>
                          </span>
                        )}

                        {cardBrand === "American Express" && (
                          <span className="text-green-700 font-black">AMEX</span>
                        )}

                        {cardBrand === "Discover" && (
                          <span className="text-orange-600 font-black">Discover</span>
                        )}

                        {cardBrand === "JCB" && (
                          <span className="text-blue-600 font-black">JCB</span>
                        )}

                        {cardBrand === "Diners Club" && (
                          <span className="text-slate-700 font-black">Diners</span>
                        )}

                        {!["Visa","Mastercard","American Express","Discover","JCB","Diners Club"].includes(cardBrand) && (
                          <>
                            <CreditCard className="h-3 w-3" />
                            <span>{cardBrand}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="mt-3 space-y-3">
                      <input
                        className="h-12 w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none focus:border-blue-500"
                        placeholder="Cardholder name (e.g. John Doe)"
                        value={cardholderName}
                         onChange={(e) => {
                          const value = e.target.value;

                          // allow only letters + spaces
                          if (/^[a-zA-Z\s]*$/.test(value)) {
                            setCardholderName(value);
                          }
                        }}
                      />

                      <input
                        inputMode="numeric"
                        className="h-12 w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none focus:border-blue-500"
                        placeholder="Card number preview"
                        value={cardNumber}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (/^[0-9\s]*$/.test(value)) {
                            const detectedBrand = detectCardBrand(value);
                            const raw = digitsOnly(value).slice(0, expectedCardLength(detectedBrand));
                            setCardNumber(formatCardNumber(raw));
                          }
                        }}
                      />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          inputMode="numeric"
                          className="h-12 w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none focus:border-blue-500"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) =>
                            setCardExpiry(formatExpiry(e.target.value))
                          }
                        />

                        <input
                          inputMode="numeric"
                          className="h-12 w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none focus:border-blue-500"
                          placeholder="CVV"
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(digitsOnly(e.target.value).slice(0, expectedCvvLength(cardBrand)))
                          }
                        />
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-blue-800">
                      This preview helps detect the card type. Actual card entry
                      and payment happen securely on Paystack test checkout.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-[32px] bg-slate-950 p-6 text-white shadow-xl lg:sticky lg:top-6">
            <h2 className="text-2xl font-black">Order summary</h2>

            <div className="mt-4">
              <input
                type="text"
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-black !text-slate-950 outline-none focus:border-orange-600 placeholder:!text-slate-400"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError("");
                  setPromoSuccess("");
                  setDiscountAmount(0);
                }}
              />

              <button
                type="button"
                onClick={() => void applyPromoCode()}
                disabled={promoLoading || subtotal <= 0}
                className="mt-2 h-11 w-full rounded-2xl bg-orange-600 text-sm font-black text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {promoLoading ? "Checking..." : "Apply promo"}
              </button>

              {promoError ? (
                <p className="mt-2 text-xs text-red-400">{promoError}</p>
              ) : null}

              {promoSuccess ? (
                <p className="mt-2 text-xs text-green-400">{promoSuccess}</p>
              ) : null}
            </div>

            {items.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-white/10 p-5 text-sm text-white/70">
                Your basket is empty.
              </div>
            ) : (
              <div className="mt-6 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={itemKey(item)} className="rounded-2xl bg-white/10 p-4">
                    <div className="flex justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="mt-1 text-xs text-white/60">
                          Qty {item.quantity}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.size ? (
                            <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">
                              Size: {item.size}
                            </span>
                          ) : null}

                          {item.color ? (
                            <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">
                              Color: {item.color}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-right font-bold">
                        {money(Number(item.price) * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Items</span>
                <span className="font-bold">{totalItems}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="font-bold">{money(subtotal)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-white/60">Delivery</span>
                <span className="font-bold">
                  {deliveryFee === 0 ? "Free" : money(deliveryFee)}
                </span>
              </div>

              {discountAmount > 0 ? (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Discount</span>
                  <span>-{money(discountAmount)}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-xl font-black">
                <span>Total</span>
                <span>{money(payableTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void checkout()}
              disabled={loading || items.length === 0}
              className="mt-6 h-12 w-full rounded-2xl bg-orange-600 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {loading
                ? paymentMethod === "MPESA"
                  ? "Sending M-Pesa prompt..."
                  : paymentMethod === "CARD"
                    ? "Opening Paystack..."
                    : "Processing order..."
                : paymentMethod === "MPESA"
                  ? "Pay with M-Pesa"
                  : paymentMethod === "CARD"
                    ? "Pay securely by card"
                    : paymentMethod === "PAYPAL"
                      ? "PayPal unavailable"
                      : "Place cash order"}
            </button>

            <div className="mt-4 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-white/60">
              <MapPin className="mb-2 h-4 w-4" />
              Unsupported counties will be added later. For now, select one of
              the available pickup stations.
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}