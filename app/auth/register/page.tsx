"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { Eye, EyeOff } from "lucide-react";
import {
  COUNTRY_PHONE_RULES,
  EAST_AFRICA_COUNTRIES,
  type EastAfricaCountry,
} from "@/lib/constants/countries";
import {
  buildFullPhoneNumber,
  sanitizeLocalPhoneDigits,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
  validatePhoneForCountry,
} from "@/lib/validators/auth";

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  country: EastAfricaCountry;
  city: string;
  password: string;
  confirmPassword: string;
};

type ApiResponse = {
  message?: string;
  error?: string;
  developmentVerifyUrl?: string;
  retryAfter?: number;
};

type FieldErrors = Partial<Record<keyof RegisterForm, string>>;

function safeNextPath(value: string | null) {
  if (!value) return "";
  if (!value.startsWith("/")) return "";
  if (value.startsWith("//")) return "";
  if (value.includes("://")) return "";
  return value;
}

function getInputClass(hasError: boolean) {
  return [
    "h-11 w-full rounded-2xl border px-4 text-sm outline-none transition",
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500"
      : "border-slate-300 bg-white focus:border-orange-600",
  ].join(" ");
}

function PasswordChecklist({ password }: { password: string }) {
  const checks = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "Starts with uppercase letter", passed: /^[A-Z]/.test(password) },
    { label: "Contains lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Contains a number", passed: /[0-9]/.test(password) },
    {
      label: "Contains a special character",
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-sm font-bold text-slate-700">
        Password requirements
      </p>

      <div className="space-y-1">
        {checks.map((check) => (
          <div
            key={check.label}
            className={`text-sm ${
              check.passed ? "text-green-700" : "text-slate-500"
            }`}
          >
            {check.passed ? "✓" : "•"} {check.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "Kenya",
    city: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof RegisterForm, boolean>>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("");

  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendingVerification, setResendingVerification] = useState(false);

  const selectedPhoneRule = useMemo(
    () => COUNTRY_PHONE_RULES[form.country],
    [form.country]
  );

  const firstNameError = validateName(form.firstName, "First name");
  const lastNameError = validateName(form.lastName, "Last name");
  const emailError = validateEmail(form.email);
  const phoneError = validatePhoneForCountry(form.country, form.phone);
  const passwordError = validatePassword(form.password);
  const confirmPasswordError = validateConfirmPassword(
    form.password,
    form.confirmPassword
  );

  const basicFormValid =
    !firstNameError &&
    !lastNameError &&
    !emailError &&
    !phoneError &&
    !passwordError &&
    !confirmPasswordError;

  const loginHref = nextPath
    ? `/auth/login?next=${encodeURIComponent(nextPath)}`
    : "/auth/login";

  const handleChange = (key: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = (key: keyof RegisterForm) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handleCountryChange = (value: string) => {
    const nextCountry = value as EastAfricaCountry;

    setForm((prev) => ({
      ...prev,
      country: nextCountry,
      phone: "",
    }));

    setTouched((prev) => ({
      ...prev,
      country: true,
      phone: false,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      country: "",
      phone: "",
    }));
  };

  const handlePhoneChange = (value: string) => {
    const digitsOnly = sanitizeLocalPhoneDigits(value).slice(
      0,
      selectedPhoneRule.localDigits
    );

    setForm((prev) => ({
      ...prev,
      phone: digitsOnly,
    }));
  };

  const runValidation = (): boolean => {
    const nextErrors: FieldErrors = {};

    const firstNameValidation = validateName(form.firstName, "First name");
    if (firstNameValidation) nextErrors.firstName = firstNameValidation;

    const lastNameValidation = validateName(form.lastName, "Last name");
    if (lastNameValidation) nextErrors.lastName = lastNameValidation;

    const emailValidation = validateEmail(form.email);
    if (emailValidation) nextErrors.email = emailValidation;

    const phoneValidation = validatePhoneForCountry(form.country, form.phone);
    if (phoneValidation) nextErrors.phone = phoneValidation;

    const passwordValidation = validatePassword(form.password);
    if (passwordValidation) nextErrors.password = passwordValidation;

    const confirmPasswordValidation = validateConfirmPassword(
      form.password,
      form.confirmPassword
    );
    if (confirmPasswordValidation) {
      nextErrors.confirmPassword = confirmPasswordValidation;
    }

    setFieldErrors(nextErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      country: true,
      city: true,
      password: true,
      confirmPassword: true,
    });

    return Object.keys(nextErrors).length === 0;
  };

useEffect(() => {
  if (resendCooldown <= 0) return;

  const timer = window.setInterval(() => {
    setResendCooldown((current) => Math.max(0, current - 1));
  }, 1000);

  return () => window.clearInterval(timer);
}, [resendCooldown]);

const resendVerification = async () => {
  setError("");
  setSuccess("");

  if (!registeredEmail) {
    setError("Register first before resending verification.");
    return;
  }

  try {
    setResendingVerification(true);

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: registeredEmail }),
    });

    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      if (data.retryAfter) setResendCooldown(data.retryAfter);
      setError(data.error || "Unable to resend verification email.");
      return;
    }

    setResendCooldown(30);
    setSuccess(data.message || "Verification email sent again.");
  } catch {
    setError("Something went wrong while resending verification.");
  } finally {
    setResendingVerification(false);
  }
};

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setVerifyUrl("");

    const isValid = runValidation();

    if (!isValid) {
      setError("Please fix the highlighted fields before continuing.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          phone: buildFullPhoneNumber(form.country, form.phone),
          next: nextPath || undefined,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      setSuccess(
        nextPath
          ? "Account created successfully. Verify your email, then log in to continue."
          : data.message || "Account created successfully. Verify your email."
      );

      if (data.developmentVerifyUrl) {
        setVerifyUrl(data.developmentVerifyUrl);
      }

      setRegisteredEmail(form.email.trim().toLowerCase());
      setResendCooldown(30);

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        country: "Kenya",
        city: "",
        password: "",
        confirmPassword: "",
      });

      setTouched({});
      setFieldErrors({});
    } catch {
      setError("Something went wrong while registering.");
    } finally {
      setLoading(false);
    }
  };

  const showError = (key: keyof RegisterForm, computedError: string | null | undefined) =>
    (touched[key] || fieldErrors[key]) && computedError;

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[32px] border border-white/50 bg-white/90 shadow-xl ring-1 ring-slate-200/70 backdrop-blur lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-orange-600 p-8 text-white lg:block">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-bold text-white">
            Create account
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight">
            Join STN Commerce and shop across all sections.
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/80">
            Create one account for store browsing, checkout, orders, support,
            and future account security features.
          </p>

          {nextPath ? (
            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-white/80">
              After signup and login, continue to:{" "}
              <span className="font-black text-white">{nextPath}</span>
            </div>
          ) : null}
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Sign up
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Fill in your details carefully. Phone number follows the selected
              country format.
            </p>
          </div>

          <div className="mb-4">
            <GoogleSignInButton label="Continue with Google" />
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs uppercase tracking-wide text-slate-400">
              or
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <input
                  className={getInputClass(
                    Boolean(showError("firstName", firstNameError))
                  )}
                  placeholder="First name"
                  value={form.firstName}
                  onBlur={() => handleBlur("firstName")}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
                {showError("firstName", firstNameError) ? (
                  <p className="mt-1 text-xs text-red-600">{firstNameError}</p>
                ) : null}
              </div>

              <div>
                <input
                  className={getInputClass(
                    Boolean(showError("lastName", lastNameError))
                  )}
                  placeholder="Last name"
                  value={form.lastName}
                  onBlur={() => handleBlur("lastName")}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
                {showError("lastName", lastNameError) ? (
                  <p className="mt-1 text-xs text-red-600">{lastNameError}</p>
                ) : null}
              </div>
            </div>

            <div>
              <input
                type="email"
                className={getInputClass(
                  Boolean(showError("email", emailError))
                )}
                placeholder="Email address"
                value={form.email}
                onBlur={() => handleBlur("email")}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {showError("email", emailError) ? (
                <p className="mt-1 text-xs text-red-600">{emailError}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-[0.85fr_1.15fr]">
              <select
                className={getInputClass(false)}
                value={form.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                onBlur={() => handleBlur("country")}
              >
                {EAST_AFRICA_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country} ({COUNTRY_PHONE_RULES[country].dialCode})
                  </option>
                ))}
              </select>

              <div>
                <div className="flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-orange-600">
                  <div className="flex h-11 items-center border-r border-slate-200 px-4 text-sm font-bold text-slate-600">
                    {selectedPhoneRule.dialCode}
                  </div>

                  <input
                    inputMode="numeric"
                    className="h-11 min-w-0 flex-1 px-4 text-sm outline-none"
                    placeholder={
                      selectedPhoneRule.example ||
                      `${selectedPhoneRule.localDigits} digits`
                    }
                    value={form.phone}
                    onBlur={() => handleBlur("phone")}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                  />
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Enter exactly {selectedPhoneRule.localDigits} digits after{" "}
                  {selectedPhoneRule.dialCode}.
                </p>

                {showError("phone", phoneError) ? (
                  <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className={getInputClass(false)}
                placeholder="City"
                value={form.city}
                onBlur={() => handleBlur("city")}
                onChange={(e) => handleChange("city", e.target.value)}
              />

              <input
                className={getInputClass(false)}
                placeholder="Address optional"
                value={form.address}
                onBlur={() => handleBlur("address")}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={getInputClass(
                    Boolean(showError("password", passwordError))
                  )}
                  placeholder="Password"
                  value={form.password}
                  onBlur={() => handleBlur("password")}
                  onChange={(e) => handleChange("password", e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {showError("password", passwordError) ? (
                <p className="mt-1 text-xs text-red-600">{passwordError}</p>
              ) : null}
            </div>

            <div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={getInputClass(
                    Boolean(showError("confirmPassword", confirmPasswordError))
                  )}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onBlur={() => handleBlur("confirmPassword")}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {showError("confirmPassword", confirmPasswordError) ? (
                <p className="mt-1 text-xs text-red-600">
                  {confirmPasswordError}
                </p>
              ) : null}
            </div>

            {form.password && form.password.length < 8 && (
              <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-700">
                This password is weak. Try adding numbers, symbols, or making it longer.
              </div>
            )}

            <PasswordChecklist password={form.password} />

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

            {registeredEmail ? (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
              <p>
                Verification sent to <strong>{registeredEmail}</strong>. Check inbox or
                spam folder.
              </p>

              <button
                type="button"
                disabled={resendingVerification || resendCooldown > 0}
                onClick={() => void resendVerification()}
                className="mt-3 rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {resendingVerification
                ? "Resending..."
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend verification email"}
              </button>
            </div>
          ) : null}

            {verifyUrl ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Development verification link:{" "}
                <Link
                  href={verifyUrl}
                  className="font-bold text-orange-700 underline"
                >
                  Verify email
                </Link>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !basicFormValid}
              className="h-11 w-full rounded-2xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="!text-orange-600 font-semibold hover:!text-orange-700 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <p className="text-sm font-bold text-slate-700">
              Loading signup...
            </p>
          </div>
        </main>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}