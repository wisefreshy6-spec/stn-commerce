"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
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
};

type FieldErrors = Partial<Record<keyof RegisterForm, string>>;

function getInputClass(hasError: boolean) {
  return [
    "h-11 w-full rounded-2xl border px-4 text-sm outline-none transition",
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500"
      : "border-slate-300 focus:border-slate-950",
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
      <p className="mb-2 text-sm font-medium text-slate-700">
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

export default function RegisterPage() {
  const router = useRouter();

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

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof RegisterForm, boolean>>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("");

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
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      setSuccess(
        data.message || "Account created successfully. Verify your email."
      );

      if (data.developmentVerifyUrl) {
        setVerifyUrl(data.developmentVerifyUrl);
      }

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

      setFieldErrors({});
      setTouched({});

      setTimeout(() => {
        router.push("/auth/verify-email");
      }, 1200);
    } catch {
      setError("Something went wrong while creating your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[32px] border border-white/50 bg-white/90 shadow-xl ring-1 ring-slate-200/70 backdrop-blur md:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-orange-600 p-8 text-white md:block">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white">
            Create your account
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight">
            One account for all your shopping and service needs.
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/80">
            Start with East Africa onboarding, verify email first, and keep the
            account flow clean and secure.
          </p>

          <div className="mt-8 space-y-3 text-sm text-white/85">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Live password checks help users before submission.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Invalid fields are highlighted clearly instead of failing silently.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Google signup is available here too, but still does not bypass
              onboarding or phone completion.
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Register
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Create your account with email and password, or continue with
              Google.
            </p>
          </div>

          <div className="mb-4">
            <GoogleSignInButton label="Sign up with Google" />
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
                    Boolean(touched.firstName && firstNameError)
                  )}
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  onBlur={() => handleBlur("firstName")}
                />
                {touched.firstName && firstNameError ? (
                  <p className="mt-1 text-sm text-red-600">{firstNameError}</p>
                ) : null}
              </div>

              <div>
                <input
                  className={getInputClass(
                    Boolean(touched.lastName && lastNameError)
                  )}
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  onBlur={() => handleBlur("lastName")}
                />
                {touched.lastName && lastNameError ? (
                  <p className="mt-1 text-sm text-red-600">{lastNameError}</p>
                ) : null}
              </div>
            </div>

            <div>
              <input
                type="email"
                className={getInputClass(Boolean(touched.email && emailError))}
                placeholder="Email address"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
              />
              {touched.email && emailError ? (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              ) : null}
            </div>

            <input
              className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
              placeholder="Street address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              onBlur={() => handleBlur("address")}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <select
                className="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
                value={form.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                onBlur={() => handleBlur("country")}
              >
                {EAST_AFRICA_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              <input
                className="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
                placeholder="City / Town"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                onBlur={() => handleBlur("city")}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phone number
              </label>
              <div
                className={`flex overflow-hidden rounded-2xl border transition focus-within:border-slate-950 ${
                  touched.phone && phoneError
                    ? "border-red-400 bg-red-50"
                    : "border-slate-300"
                }`}
              >
                <div className="flex min-w-[88px] items-center justify-center bg-slate-100 px-3 text-sm font-medium text-slate-700">
                  {selectedPhoneRule.dialCode}
                </div>
                <input
                  inputMode="numeric"
                  className="h-11 w-full bg-transparent px-4 text-sm outline-none"
                  placeholder={selectedPhoneRule.example}
                  value={form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => handleBlur("phone")}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Enter exactly {selectedPhoneRule.localDigits} digits after{" "}
                {selectedPhoneRule.dialCode}.
              </p>
              {touched.phone && phoneError ? (
                <p className="mt-1 text-sm text-red-600">{phoneError}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <input
                  type="password"
                  className={getInputClass(
                    Boolean(touched.password && passwordError)
                  )}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                />
                {touched.password && passwordError ? (
                  <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                ) : null}
              </div>

              <div>
                <input
                  type="password"
                  className={getInputClass(
                    Boolean(touched.confirmPassword && confirmPasswordError)
                  )}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  onBlur={() => handleBlur("confirmPassword")}
                />
                {touched.confirmPassword && confirmPasswordError ? (
                  <p className="mt-1 text-sm text-red-600">
                    {confirmPasswordError}
                  </p>
                ) : null}
              </div>
            </div>

            <PasswordChecklist password={form.password} />

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Phone rule: choose a country first, then enter only the remaining
              local digits. The full number is built automatically.
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

            {verifyUrl ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Development verification link:{" "}
                <a
                  href={verifyUrl}
                  className="font-medium underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open verification link
                </a>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !basicFormValid}
              className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-orange-600 hover:text-orange-700"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}