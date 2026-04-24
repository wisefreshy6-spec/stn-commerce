"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedShell from "@/components/layout/ProtectedShell";

type CurrentUserResponse = {
  user?: {
    id: string;
    email: string;
    authProvider: "CREDENTIALS" | "GOOGLE";
    onboardingCompleted: boolean;
  } | null;
};

type SetPasswordResponse = {
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

export default function SetPasswordPage() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = (await response.json()) as CurrentUserResponse;

        if (!response.ok || !data.user) {
          router.push("/auth/login");
          return;
        }

        if (data.user.authProvider !== "GOOGLE") {
          router.push("/dashboard");
          return;
        }
      } catch {
        router.push("/auth/login");
      } finally {
        setLoadingUser(false);
      }
    };

    void loadUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          confirmPassword,
        }),
      });

      const data = (await response.json()) as SetPasswordResponse;

      if (!response.ok) {
        setError(data.error || "Unable to set password.");
        return;
      }

      setSuccess(
        data.message ||
          "Password set successfully. You can now log in with email and password."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch {
      setError("Something went wrong while setting your password.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <ProtectedShell
      badge="Password tools"
      title="Add password login"
      subtitle="Keep Google sign-in active and add email/password as another secure login method if you want it."
    >
      <section className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Set password
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          This does not remove Google sign-in. It only adds password login to
          your account.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="password"
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <PasswordChecklist password={password} />

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Password must be strong and must match confirmation before it can be
            saved.
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
            disabled={saving}
            className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving password..." : "Set password"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-500">
          <Link
            href="/settings"
            className="font-medium text-orange-600 hover:text-orange-700"
          >
            Back to settings
          </Link>
        </p>
      </section>
    </ProtectedShell>
  );
}