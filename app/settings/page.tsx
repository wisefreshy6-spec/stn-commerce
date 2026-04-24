"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Lock,
  ShieldCheck,
  UserCircle2,
  WalletCards,
} from "lucide-react";
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

type UserData = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
  country?: string | null;
  city?: string | null;
  phone?: string | null;
  address?: string | null;
  emailVerified: boolean;
  status: string;
  authProvider: "CREDENTIALS" | "GOOGLE";
  onboardingCompleted: boolean;
};

type CurrentUserResponse = {
  user?: UserData | null;
  error?: string;
};

type UpdateProfileResponse = {
  message?: string;
  error?: string;
  user?: UserData;
};

type DataRequestResponse = {
  message?: string;
  error?: string;
};

function getLocalPhoneFromFullNumber(
  country: EastAfricaCountry,
  fullPhone?: string | null
) {
  const rule = COUNTRY_PHONE_RULES[country];

  if (!fullPhone) return "";

  if (fullPhone.startsWith(rule.dialCode)) {
    return sanitizeLocalPhoneDigits(fullPhone.slice(rule.dialCode.length)).slice(
      0,
      rule.localDigits
    );
  }

  return "";
}

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [loadError, setLoadError] = useState("");

  const [country, setCountry] = useState<EastAfricaCountry>("Kenya");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [requestingData, setRequestingData] = useState(false);
  const [dataRequestError, setDataRequestError] = useState("");
  const [dataRequestSuccess, setDataRequestSuccess] = useState("");

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

        setUser(data.user);

        const safeCountry =
          data.user.country &&
          EAST_AFRICA_COUNTRIES.includes(data.user.country as EastAfricaCountry)
            ? (data.user.country as EastAfricaCountry)
            : "Kenya";

        setCountry(safeCountry);
        setPhone(getLocalPhoneFromFullNumber(safeCountry, data.user.phone));
        setAddress(data.user.address ?? "");
        setCity(data.user.city ?? "");
      } catch {
        setLoadError("Unable to load account settings.");
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [router]);

  const phoneError = validatePhoneForCountry(country, phone);
  const formValid = !phoneError;

  const handleCountryChange = (value: string) => {
    setCountry(value as EastAfricaCountry);
    setPhone("");
    setFormError("");
    setFormSuccess("");
  };

  const handlePhoneChange = (value: string) => {
    const digitsOnly = sanitizeLocalPhoneDigits(value).slice(
      0,
      selectedPhoneRule.localDigits
    );

    setPhone(digitsOnly);
    setFormError("");
    setFormSuccess("");
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formValid) {
      setFormError("Please fix the highlighted profile fields before saving.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/account/profile", {
        method: "PATCH",
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

      const data = (await response.json()) as UpdateProfileResponse;

      if (!response.ok) {
        setFormError(data.error || "Unable to update profile.");
        return;
      }

      if (data.user) {
        setUser(data.user);
      }

      setFormSuccess(data.message || "Profile updated successfully.");
    } catch {
      setFormError("Something went wrong while updating your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestData = async () => {
    setDataRequestError("");
    setDataRequestSuccess("");

    try {
      setRequestingData(true);

      const response = await fetch("/api/account/data-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestType: "ACCOUNT_DATA_EXPORT",
        }),
      });

      const data = (await response.json()) as DataRequestResponse;

      if (!response.ok) {
        setDataRequestError(data.error || "Unable to submit data request.");
        return;
      }

      setDataRequestSuccess(
        data.message || "Your account data request has been submitted."
      );
    } catch {
      setDataRequestError("Something went wrong while submitting your request.");
    } finally {
      setRequestingData(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <p className="text-sm text-slate-600">Loading settings...</p>
        </div>
      </main>
    );
  }

  if (loadError || !user) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError || "Unable to load account settings."}
          </div>
        </div>
      </main>
    );
  }

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";

  const isGoogleOnly = user.authProvider === "GOOGLE";

  return (
    <ProtectedShell
      badge="Account settings"
      title="Manage your account"
      subtitle="Review and update contact details, phone, provider type, account state, and password options."
    >
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Update profile
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Update your contact details. Ownership names are locked after
            account setup and will later require verification to change.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSaveProfile}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div>
                <span className="font-semibold">Ownership name:</span>{" "}
                {fullName}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Names are locked for account ownership protection. Later,
                verified name changes can be handled through email/phone OTP or
                document review.
              </p>
            </div>

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
              placeholder="Street address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setFormError("");
                setFormSuccess("");
              }}
            />

            <input
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
              placeholder="City / Town"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setFormError("");
                setFormSuccess("");
              }}
            />

            {formError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            {formSuccess ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {formSuccess}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving || !formValid}
              className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving profile..." : "Save profile changes"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Current profile summary
            </h2>

            <div className="mt-6 space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold">Name:</span> {fullName}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold">Email:</span> {user.email}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold">Phone:</span>{" "}
                {user.phone || "Not added"}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold">Country:</span>{" "}
                {user.country || "Not set"}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold">City:</span>{" "}
                {user.city || "Not set"}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold">Address:</span>{" "}
                {user.address || "Not set"}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Account status
            </h2>

            <div className="mt-6 space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold">Auth provider:</span>{" "}
                {user.authProvider}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold">Email verified:</span>{" "}
                {user.emailVerified ? "Yes" : "No"}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold">Onboarding completed:</span>{" "}
                {user.onboardingCompleted ? "Yes" : "No"}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold">Role:</span> {user.role}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold">Account status:</span>{" "}
                {user.status}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Password options
            </h2>

            {isGoogleOnly ? (
              <>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Your account currently uses Google sign-in. You can add a
                  password if you also want to log in with email and password.
                </p>

                <Link
                  href="/auth/set-password"
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                >
                  Set password <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Your account already supports password login. More password
                  tools can be added here later.
                </p>

                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  Password login is active for this account.
                </div>
              </>
            )}
          </div>

          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Account data request
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Request a copy/export of the account data linked to your profile.
              For now, this creates a pending request for admin/support handling.
            </p>

            {dataRequestError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {dataRequestError}
              </div>
            ) : null}

            {dataRequestSuccess ? (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {dataRequestSuccess}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleRequestData}
              disabled={requestingData}
              className="mt-6 h-11 w-full rounded-2xl bg-slate-950 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {requestingData
                ? "Submitting request..."
                : "Request my account data"}
            </button>
          </div>

          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Quick actions
            </h2>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <UserCircle2 className="mr-2 h-4 w-4" />
                Back to dashboard
              </Link>

              {!user.onboardingCompleted ? (
                <Link
                  href="/auth/complete-profile"
                  className="inline-flex items-center justify-center rounded-2xl border border-orange-300 bg-orange-50 px-6 py-3 text-sm font-medium text-orange-700 transition hover:bg-orange-100"
                >
                  <WalletCards className="mr-2 h-4 w-4" />
                  Complete profile
                </Link>
              ) : null}

              <Link
                href={
                  isGoogleOnly ? "/auth/set-password" : "/auth/change-password"
                }
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Lock className="mr-2 h-4 w-4" />
                Password tools
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ProtectedShell>
  );
}