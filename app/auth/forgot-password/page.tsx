"use client";

import { useState } from "react";
import Link from "next/link";

type ForgotPasswordResponse = {
  message?: string;
  error?: string;
  developmentResetUrl?: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResetUrl("");

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as ForgotPasswordResponse;

      if (!response.ok) {
        setError(data.error || "Unable to send reset request.");
        return;
      }

      setSubmitted(true);
      setSuccess(
        data.message ||
          "If that email exists in our system, a reset link has been prepared."
      );

      if (data.developmentResetUrl) {
        setResetUrl(data.developmentResetUrl);
      }
    } catch {
      setError("Something went wrong while requesting password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-xl ring-1 ring-slate-200/70 md:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-rose-600 p-8 text-white md:block">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white">
            Password recovery
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight">
            Recover access safely.
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/80">
            Request a reset link securely. If the account exists, the system
            prepares a reset path without exposing account details publicly.
          </p>

          <div className="mt-8 space-y-3 text-sm text-white/85">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              We do not reveal whether an email exists publicly.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Reset links are temporary and should only be used once.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Strong password rules still apply when setting the new password.
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Forgot password
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your email address and we’ll prepare a reset link.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
              disabled={loading}
            />

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

            {resetUrl ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Development reset link:{" "}
                <a
                  href={resetUrl}
                  className="font-medium underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open reset link
                </a>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Preparing reset link..." : "Send reset link"}
            </button>
          </form>

          {submitted ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Didn’t receive anything yet? Check spam/junk, then try again if
                needed.
              </p>
            </div>
          ) : null}

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