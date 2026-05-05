"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

type LoginResponse = {
  message?: string;
  error?: string;
  otpRequired?: boolean;
  needsVerification?: boolean;
  email?: string;
  retryAfter?: number;
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
  if (success === "email_verified") return "Email verified successfully. You can now log in.";
  if (success === "password_reset") return "Password reset successful. You can now log in with your new password.";
  if (error === "missing_verification_token") return "Verification token is missing.";
  if (error === "invalid_verification_token") return "Verification link is invalid.";
  if (error === "expired_verification_token") return "Verification link has expired.";
  if (error === "verification_failed") return "Email verification failed.";
  if (error === "google_account_conflict") return "That email already belongs to a password account. Log in first, then link Google later from inside your account.";
  return "";
}

function safeNextPath(value: string | null) {
  if (!value) return "";
  if (!value.startsWith("/")) return "";
  if (value.startsWith("//")) return "";
  if (value.includes("://")) return "";
  return value;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");
  const nextPath = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpStep, setOtpStep] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState(
    errorParam ? getMessageFromParams(null, errorParam) : ""
  );
  const [success, setSuccess] = useState(
    successParam ? getMessageFromParams(successParam, null) : ""
  );
  const [loading, setLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const registerHref = nextPath
    ? `/auth/register?next=${encodeURIComponent(nextPath)}`
    : "/auth/register";

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (otpStep) {
      window.setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }
  }, [otpStep]);

  const redirectAfterLogin = (user?: LoginResponse["user"]) => {
    if (nextPath) {
      router.push(nextPath);
      return;
    }

    if (user?.role === "ADMIN") {
      router.push("/admin");
      return;
    }

    if (user?.role === "SUPPORT" || user?.role === "TEAM") {
      router.push("/admin/support");
      return;
    }

    router.push("/dashboard");
  };

  const requestLoginCode = async () => {
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (cooldown > 0) {
      setError(`Please wait ${cooldown}s before requesting another login code.`);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        if (data.retryAfter) setCooldown(data.retryAfter);

        if (data.needsVerification && data.email) {
          setError(data.error || "Verify your email before logging in.");
          return;
        }

        setError(data.error || "Login failed.");
        return;
      }

      if (data.otpRequired) {
        setOtpEmail(data.email || email.trim().toLowerCase());
        setOtpStep(true);
        setOtp(["", "", "", "", "", ""]);
        setCooldown(30);
        setSuccess(data.message || "Login code sent to your email.");
        return;
      }

      redirectAfterLogin(data.user);
    } catch {
      setError("Something went wrong while logging in.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otp.join("");

    setError("");
    setSuccess("");

    if (code.length !== 6) {
      setError("Enter the 6-digit login code.");
      return;
    }

    try {
      setVerifyingOtp(true);

      const response = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, code }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(data.error || "Invalid login code.");
        return;
      }

      setSuccess(data.message || "Login successful.");
      redirectAfterLogin(data.user);
    } catch {
      setError("Something went wrong while verifying the login code.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    setOtp((current) => {
      const next = [...current];
      next[index] = digit;

      const joined = next.join("");

      if (digit && index < 5) {
        window.setTimeout(() => otpRefs.current[index + 1]?.focus(), 20);
      }

      if (joined.length === 6 && !next.includes("")) {
        window.setTimeout(() => void verifyOtp(joined), 80);
      }

      return next;
    });
  };

  const handleOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (!pasted) return;

    const next = Array.from({ length: 6 }).map((_, index) => pasted[index] || "");
    setOtp(next);

    const focusIndex = Math.min(pasted.length, 5);
    window.setTimeout(() => otpRefs.current[focusIndex]?.focus(), 20);

    if (pasted.length === 6) {
      window.setTimeout(() => void verifyOtp(pasted), 80);
    }
  };

  const resendVerification = async () => {
    setError("");
    setSuccess("");

    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      setError("Enter your email first, then resend verification.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        if (data.retryAfter) setCooldown(data.retryAfter);
        setError(data.error || "Unable to resend verification email.");
        return;
      }

      setCooldown(30);
      setSuccess(data.message || "Verification email sent.");
    } catch {
      setError("Something went wrong while resending verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[32px] border border-white/50 bg-white/90 shadow-xl ring-1 ring-slate-200/70 backdrop-blur md:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-orange-600 p-8 text-white md:block">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-bold text-white">
            Welcome back
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight">
            Login securely with email verification.
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/80">
            Password login now sends a short email code before opening your STN
            Commerce workspace.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              {otpStep ? "Enter login code" : "Log in"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {otpStep
                ? `We sent a 6-digit code to ${otpEmail}.`
                : "Use your email and password to continue."}
            </p>
          </div>

          {!otpStep ? (
            <>
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

              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void requestLoginCode();
                }}
              >
                <input
                  type="email"
                  className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-orange-600"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  type="password"
                  className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-orange-600"
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
                    className="font-bold text-orange-600 hover:text-orange-700"
                  >
                    Forgot password?
                  </Link>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                    {error.toLowerCase().includes("verify your email") ? (
                      <button
                        type="button"
                        onClick={() => void resendVerification()}
                        disabled={loading || cooldown > 0}
                        className="mt-3 block rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white disabled:bg-slate-300"
                      >
                        {cooldown > 0
                          ? `Resend verification in ${cooldown}s`
                          : "Resend verification email"}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {success ? (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {success}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className="h-11 w-full rounded-2xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  {loading
                    ? "Checking..."
                    : cooldown > 0
                      ? `Wait ${cooldown}s`
                      : "Continue"}
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      otpRefs.current[index] = node;
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onPaste={handleOtpPaste}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onChange={(event) =>
                      handleOtpChange(index, event.target.value)
                    }
                    className="h-12 rounded-2xl border border-slate-300 text-center text-xl font-black text-slate-950 outline-none focus:border-orange-600"
                  />
                ))}
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
                type="button"
                onClick={() => void verifyOtp()}
                disabled={verifyingOtp || otp.join("").length !== 6}
                className="h-11 w-full rounded-2xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                {verifyingOtp ? "Verifying..." : "Verify and log in"}
              </button>

              <button
                type="button"
                onClick={() => void requestLoginCode()}
                disabled={loading || cooldown > 0}
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                  setSuccess("");
                }}
                className="h-11 w-full rounded-2xl bg-slate-100 text-sm font-black text-slate-700"
              >
                Change email/password
              </button>
            </div>
          )}

          <p className="mt-5 text-sm text-slate-500">
            Don’t have an account?{" "}
            <Link
              href={registerHref}
              className="font-bold text-orange-600 hover:text-orange-700"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <p className="text-sm font-bold text-slate-700">
              Loading login...
            </p>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}