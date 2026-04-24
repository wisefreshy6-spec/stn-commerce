"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type ResetPasswordResponse = {
  message?: string;
  error?: string;
};

function PasswordChecklist({ password }: { password: string }) {
  const checks = [
    {
      label: "At least 8 characters",
      passed: password.length >= 8,
    },
    {
      label: "Starts with uppercase letter",
      passed: /^[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter",
      passed: /[a-z]/.test(password),
    },
    {
      label: "Contains a number",
      passed: /[0-9]/.test(password),
    },
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasStrongPassword =
    password.length >= 8 &&
    /^[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const canSubmit = Boolean(token) && hasStrongPassword && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = (await response.json()) as ResetPasswordResponse;

      if (!response.ok) {
        setError(data.error || "Unable to reset password.");
        return;
      }

      setSuccess(data.message || "Password reset successful.");

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/auth/login?success=password_reset");
      }, 1500);
    } catch {
      setError("Something went wrong while resetting your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-xl ring-1 ring-slate-200/70 md:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-orange-600 p-8 text-white md:block">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white">
            Reset password
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight">
            Choose a strong new password.
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/80">
            Reset links are temporary. Once used successfully, they should not
            be reused.
          </p>

          <div className="mt-8 space-y-3 text-sm text-white/85">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Strong password rules apply here too.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Invalid or expired reset links will be blocked safely.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              After success, you’ll return to login.
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Reset password
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter a new password for your account.
            </p>
          </div>

          {!token ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Reset token is missing. Open the full reset link from your email.
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
              disabled={loading}
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
              disabled={loading}
            />

            <PasswordChecklist password={password} />

            {confirmPassword.length > 0 && !passwordsMatch ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Passwords do not match.
              </div>
            ) : null}

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
              disabled={loading || !canSubmit}
              className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Resetting password..." : "Reset password"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Back to{" "}
            <Link
              href="/auth/login"
              className="font-medium text-orange-600 hover:text-orange-700"
            >
              login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}