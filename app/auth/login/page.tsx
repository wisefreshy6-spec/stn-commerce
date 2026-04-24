"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

type LoginResponse = {
  message?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};

function getMessageFromParams(
  success: string | null,
  error: string | null
): string {
  if (success === "email_verified") {
    return "Email verified successfully. You can now log in.";
  }

  if (success === "password_reset") {
    return "Password reset successful. You can now log in with your new password.";
  }

  if (error === "missing_verification_token") {
    return "Verification token is missing.";
  }

  if (error === "invalid_verification_token") {
    return "Verification link is invalid.";
  }

  if (error === "expired_verification_token") {
    return "Verification link has expired.";
  }

  if (error === "verification_failed") {
    return "Email verification failed.";
  }

  if (error === "google_account_conflict") {
    return "That email already belongs to a password account. Log in first, then link Google later from inside your account.";
  }

  return "";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");
  const nextParam = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(
    errorParam ? getMessageFromParams(null, errorParam) : ""
  );
  const [success, setSuccess] = useState(
    successParam ? getMessageFromParams(successParam, null) : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      setSuccess(data.message || "Login successful.");

      if (nextParam) {
        router.push(nextParam);
        return;
      }

      if (data.user?.role === "ADMIN") {
        router.push("/admin");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong while logging in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[32px] border border-white/50 bg-white/90 shadow-xl ring-1 ring-slate-200/70 backdrop-blur md:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-rose-600 p-8 text-white md:block">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white">
            Welcome back
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight">
            Login to continue across all store sections.
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/80">
            Use your email and password, or continue with Google without
            bypassing onboarding and phone completion.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Log in
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Use your email and password to continue.
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
            <input
              type="email"
              className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Remember me
              </label>

              <Link
                href="/auth/forgot-password"
                className="font-medium text-orange-600 hover:text-orange-700"
              >
                Forgot password?
              </Link>
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
              disabled={loading}
              className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-500">
            Don’t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-orange-600 hover:text-orange-700"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}