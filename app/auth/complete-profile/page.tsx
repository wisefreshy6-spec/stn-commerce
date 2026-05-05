"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProtectedShell from "@/components/layout/ProtectedShell";
import {
  COUNTRY_PHONE_RULES,
  EAST_AFRICA_COUNTRIES,
  type EastAfricaCountry,
} from "@/lib/constants/countries";
import {
  buildFullPhoneNumber,
  sanitizeLocalPhoneDigits,
  validatePhoneForCountry,
} from "@/lib/validators/auth";

type CurrentUserResponse = {
  user?: {
    id: string;
    email: string;
    authProvider: "CREDENTIALS" | "GOOGLE";
    onboardingCompleted: boolean;
    country?: string | null;
    city?: string | null;
    address?: string | null;
  } | null;
};

type CompleteProfileResponse = {
  message?: string;
  error?: string;
};

function safeNextPath(value: string | null) {
  if (!value) return "";
  if (!value.startsWith("/")) return "";
  if (value.startsWith("//")) return "";
  if (value.includes("://")) return "";
  return value;
}

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [country, setCountry] = useState<EastAfricaCountry>("Kenya");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [authProvider, setAuthProvider] = useState<
    "CREDENTIALS" | "GOOGLE" | null
  >(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedPhoneRule = useMemo(
    () => COUNTRY_PHONE_RULES[country],
    [country]
  );

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = (await response.json()) as CurrentUserResponse;

        if (!response.ok || !data.user) {
          const loginTarget = nextPath
            ? `/auth/login?next=${encodeURIComponent(
                `/auth/complete-profile?next=${encodeURIComponent(nextPath)}`
              )}`
            : "/auth/login?next=/auth/complete-profile";

          router.push(loginTarget);
          return;
        }

        if (data.user.onboardingCompleted) {
          router.push(nextPath || "/dashboard");
          return;
        }

        setAuthProvider(data.user.authProvider);

        if (
          data.user.country &&
          EAST_AFRICA_COUNTRIES.includes(data.user.country as EastAfricaCountry)
        ) {
          setCountry(data.user.country as EastAfricaCountry);
        }

        if (data.user.address) setAddress(data.user.address);
        if (data.user.city) setCity(data.user.city);
      } catch {
        router.push("/auth/login?next=/auth/complete-profile");
      } finally {
        setLoadingUser(false);
      }
    };

    void loadUser();
  }, [router, nextPath]);

  const phoneError = validatePhoneForCountry(country, phone);
  const formValid = !phoneError;

  const handlePhoneChange = (value: string) => {
    const digitsOnly = sanitizeLocalPhoneDigits(value).slice(
      0,
      selectedPhoneRule.localDigits
    );
    setPhone(digitsOnly);
  };

  const handleCountryChange = (value: string) => {
    setCountry(value as EastAfricaCountry);
    setPhone("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formValid) {
      setError("Please enter a valid phone number for the selected country.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country,
          phone: buildFullPhoneNumber(country, phone),
          address,
          city,
          next: nextPath || undefined,
        }),
      });

      const data = (await response.json()) as CompleteProfileResponse;

      if (response.status === 401) {
        router.push("/auth/login?next=/auth/complete-profile");
        return;
      }

      if (!response.ok) {
        setError(data.error || "Unable to complete your profile.");
        return;
      }

      setSuccess(data.message || "Profile completed successfully.");

      setTimeout(() => {
        router.push(nextPath || "/dashboard");
      }, 1000);
    } catch {
      setError("Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <p className="text-sm font-bold text-slate-600">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <ProtectedShell
      badge="Complete profile"
      title="Finish your account setup"
      subtitle={
        authProvider === "GOOGLE"
          ? "Google signup does not bypass onboarding. Add your phone and country details to finish access properly."
          : "Complete your remaining profile details to continue safely."
      }
    >
      <section className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Required onboarding details
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Choose your country first. The phone code and required number length
          will adjust automatically.
        </p>

        {nextPath ? (
          <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-900">
            After completing your profile, you will continue to{" "}
            <span className="font-black">{nextPath}</span>.
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <select
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-orange-600"
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
          >
            {EAST_AFRICA_COUNTRIES.map((countryItem) => (
              <option key={countryItem} value={countryItem}>
                {countryItem}
              </option>
            ))}
          </select>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Phone number
            </label>

            <div className="flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-orange-600">
              <div className="flex min-w-[88px] items-center justify-center bg-slate-100 px-3 text-sm font-bold text-slate-700">
                {selectedPhoneRule.dialCode}
              </div>

              <input
                inputMode="numeric"
                className="h-11 w-full px-4 text-sm outline-none"
                placeholder={selectedPhoneRule.example}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
              />
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Enter exactly {selectedPhoneRule.localDigits} digits after{" "}
              {selectedPhoneRule.dialCode}.
            </p>

            {phoneError ? (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            ) : null}
          </div>

          <input
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-orange-600"
            placeholder="Street address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <input
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-orange-600"
            placeholder="City / Town (optional)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            This keeps account access consistent for both Google and
            email/password users.
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving || !formValid}
            className="h-11 w-full rounded-2xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          >
            {saving ? "Saving profile..." : "Complete profile"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-500">
          <Link
            href={nextPath || "/dashboard"}
            className="font-bold text-orange-600 hover:text-orange-700"
          >
            {nextPath ? "Back to previous page" : "Back to dashboard"}
          </Link>
        </p>
      </section>
    </ProtectedShell>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <p className="text-sm font-bold text-slate-600">
              Loading profile setup...
            </p>
          </div>
        </main>
      }
    >
      <CompleteProfileContent />
    </Suspense>
  );
}