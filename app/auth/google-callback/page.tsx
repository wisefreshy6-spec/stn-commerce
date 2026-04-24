"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type GoogleBridgeResponse = {
  message?: string;
  error?: string;
  redirectTo?: string;
};

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const finishGoogleLogin = async () => {
      try {
        const response = await fetch("/api/auth/google-session", {
          method: "POST",
        });

        const data = (await response.json()) as GoogleBridgeResponse;

        if (!response.ok) {
          setError(data.error || "Unable to complete Google sign-in.");
          return;
        }

        router.push(data.redirectTo || "/dashboard");
      } catch {
        setError("Something went wrong while finishing Google sign-in.");
      }
    };

    void finishGoogleLogin();
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200/70 sm:p-10">
        <div className="inline-flex rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-700">
          Google sign-in
        </div>

        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Finalizing your Google sign-in.
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
          Please wait while we securely finish your account session and check
          whether your onboarding is complete.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Working...
          </div>
        )}
      </div>
    </main>
  );
}