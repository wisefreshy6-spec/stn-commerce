"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type VerifyResponse = {
  message?: string;
  error?: string;
  orderId?: string;
};

function PaystackCallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || "";

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Verifying card payment...");
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setError("Missing Paystack reference.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/payments/paystack/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reference }),
        });

        const data = (await response.json()) as VerifyResponse;

        if (!response.ok) {
          setError(data.error || "Unable to verify card payment.");
          return;
        }

        setMessage(data.message || "Payment verified successfully.");
        setOrderId(data.orderId || "");
      } catch {
        setError("Something went wrong while verifying card payment.");
      } finally {
        setLoading(false);
      }
    };

    void verifyPayment();
  }, [reference]);

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-bold text-orange-700">
          Card payment
        </div>

        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
          Payment confirmation
        </h1>

        {loading ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
            {message}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            {message}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {orderId ? (
            <Link
              href={`/orders/${orderId}`}
              className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-6 py-3 text-sm font-black text-white hover:bg-orange-700"
            >
              Open invoice
            </Link>
          ) : null}

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function PaystackCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
          <section className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <p className="text-sm font-bold text-slate-700">
              Preparing payment confirmation...
            </p>
          </section>
        </main>
      }
    >
      <PaystackCallbackContent />
    </Suspense>
  );
}