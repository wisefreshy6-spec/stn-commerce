"use client";

import { useEffect, useState } from "react";
import ProtectedShell from "@/components/layout/ProtectedShell";

type Promo = {
  id: string;
  code: string;
  description?: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: string | number;
  minOrderValue?: string | number | null;
  maxDiscount?: string | number | null;
  usageLimit?: number | null;
  usedCount?: number | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
};

type PromoResponse = {
  promos?: Promo[];
  promo?: Promo;
  message?: string;
  error?: string;
};

function money(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "None";
  return `KES ${Number(value).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "No limit";
  return new Date(value).toLocaleString();
}

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">(
    "PERCENT"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPromos = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/promos");
      const data = (await response.json()) as PromoResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load promo codes.");
        return;
      }

      setPromos(data.promos || []);
    } catch {
      setError("Something went wrong while loading promo codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPromos();
  }, []);

  const createPromo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setSaving(true);

      const response = await fetch("/api/admin/promos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          description,
          discountType,
          discountValue,
          minOrderValue,
          maxDiscount,
          usageLimit,
          isActive,
          startsAt,
          endsAt,
        }),
      });

      const data = (await response.json()) as PromoResponse;

      if (!response.ok) {
        setError(data.error || "Unable to create promo code.");
        return;
      }

      setMessage(data.message || "Promo code created successfully.");
      setCode("");
      setDescription("");
      setDiscountType("PERCENT");
      setDiscountValue("");
      setMinOrderValue("");
      setMaxDiscount("");
      setUsageLimit("");
      setStartsAt("");
      setEndsAt("");
      setIsActive(true);

      await loadPromos();
    } catch {
      setError("Something went wrong while creating promo code.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedShell
      badge="Admin promos"
      title="Promo codes"
      subtitle="Create and manage checkout discount codes for customers."
    >
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Create promo code
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Example codes: STN10, WELCOME50, APRIL18.
          </p>

          <form className="mt-6 space-y-4" onSubmit={createPromo}>
            <input
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm uppercase outline-none focus:border-orange-600"
              placeholder="Promo code e.g. STN10"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />

            <input
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
              placeholder="Description optional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <select
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as "PERCENT" | "FIXED")
                }
              >
                <option value="PERCENT">Percent discount</option>
                <option value="FIXED">Fixed amount</option>
              </select>

              <input
                type="number"
                min="0"
                step="0.01"
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder={
                  discountType === "PERCENT"
                    ? "Discount % e.g. 10"
                    : "Amount e.g. 500"
                }
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <input
                type="number"
                min="0"
                step="0.01"
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder="Min order optional"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
              />

              <input
                type="number"
                min="0"
                step="0.01"
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder="Max discount optional"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
              />

              <input
                type="number"
                min="1"
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder="Usage limit optional"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Starts at optional
                </label>
                <input
                  type="datetime-local"
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Ends at optional
                </label>
                <input
                  type="datetime-local"
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Promo is active
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="h-11 w-full rounded-2xl bg-orange-600 text-sm font-black text-white transition hover:bg-orange-700 disabled:opacity-70"
            >
              {saving ? "Creating promo..." : "Create promo"}
            </button>
          </form>
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Existing promos
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Promo codes customers can use during checkout.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadPromos()}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-slate-600">Loading promos...</p>
          ) : promos.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              No promo codes yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {promos.map((promo) => (
                <div
                  key={promo.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                      {promo.code}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        promo.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {promo.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                      {promo.discountType}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-black text-slate-950">
                    {promo.discountType === "PERCENT"
                      ? `${Number(promo.discountValue).toLocaleString()}% off`
                      : `${money(promo.discountValue)} off`}
                  </h3>

                  {promo.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {promo.description}
                    </p>
                  ) : null}

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      Min order:{" "}
                      <span className="font-bold text-slate-950">
                        {money(promo.minOrderValue)}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      Max discount:{" "}
                      <span className="font-bold text-slate-950">
                        {money(promo.maxDiscount)}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      Usage:{" "}
                      <span className="font-bold text-slate-950">
                        {promo.usedCount || 0}
                        {promo.usageLimit ? ` / ${promo.usageLimit}` : ""}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      Starts:{" "}
                      <span className="font-bold text-slate-950">
                        {formatDate(promo.startsAt)}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 sm:col-span-2">
                      Ends:{" "}
                      <span className="font-bold text-slate-950">
                        {formatDate(promo.endsAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </ProtectedShell>
  );
}