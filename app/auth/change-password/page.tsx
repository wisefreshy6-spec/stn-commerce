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
  } | null;
};

type ChangePasswordResponse = {
  message?: string;
  error?: string;
};

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
        New password requirements
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

export default function ChangePasswordPage() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
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

        if (data.user.authProvider === "GOOGLE") {
          router.push("/auth/set-password");
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

  const passwordsMatch =
    confirmNewPassword.length > 0 && newPassword === confirmNewPassword;

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmNewPassword.length > 0 &&
    passwordsMatch &&
    !saving;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = (await response.json()) as ChangePasswordResponse;

      if (!response.ok) {
        setError(data.error || "Unable to change password.");
        return;
      }

      setSuccess(data.message || "Password changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      setError("Something went wrong while changing your password.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <p className="text-sm text-slate-600">Loading password tools...</p>
        </div>
      </main>
    );
  }

  return (
    <ProtectedShell
      badge="Password security"
      title="Change your password"
      subtitle="Confirm your current password, then choose a stronger new password. Later this can be upgraded to require email or phone OTP before final confirmation."
    >
      <section className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Password change
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          For now, this verifies your current password before changing it. The
          OTP confirmation layer will be added later when email/phone OTP
          sending is ready.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="password"
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setError("");
              setSuccess("");
            }}
          />

          <input
            type="password"
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError("");
              setSuccess("");
            }}
          />

          <input
            type="password"
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
              setError("");
              setSuccess("");
            }}
          />

          <PasswordChecklist password={newPassword} />

          {confirmNewPassword.length > 0 && !passwordsMatch ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              New password and confirmation do not match.
            </div>
          ) : null}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Coming later: after current password is confirmed, send an email or
            phone OTP before final password change.
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
            disabled={!canSubmit}
            className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Changing password..." : "Change password"}
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