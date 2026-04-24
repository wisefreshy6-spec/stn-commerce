"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function CompleteProfilePage() {
  const router = useRouter();

  const [country, setCountry] = useState<EastAfricaCountry>("Kenya");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [authProvider, setAuthProvider] = useState<"CREDENTIALS" | "GOOGLE" | null>(null);
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
          router.push("/auth/login");
          return;
        }

        if (data.user.onboardingCompleted) {
          router.push("/dashboard");
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
        router.push("/auth/login");
      } finally {
        setLoadingUser(false);
      }
    };

    void loadUser();
  }, [router]);

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
        }),
      });

      const data = (await response.json()) as CompleteProfileResponse;

      if (!response.ok) {
        setError(data.error || "Unable to complete your profile.");
        return;
      }

      setSuccess(data.message || "Profile completed successfully.");

      setTimeout(() => {
        router.push("/dashboard");
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
          <p className="text-sm text-slate-600">Loading your profile...</p>
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

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <select
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
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
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Phone number
            </label>

            <div className="flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-slate-950">
              <div className="flex min-w-[88px] items-center justify-center bg-slate-100 px-3 text-sm font-medium text-slate-700">
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
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
            placeholder="Street address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <input
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
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
            className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving profile..." : "Complete profile"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-500">
          <Link
            href="/dashboard"
            className="font-medium text-orange-600 hover:text-orange-700"
          >
            Back to dashboard
          </Link>
        </p>
      </section>
    </ProtectedShell>
  );
}