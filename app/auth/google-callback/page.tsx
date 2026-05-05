"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type GoogleBridgeResponse = {
  message?: string;
  error?: string;
  redirectTo?: string;
};

function safeNextPath(value: string | null) {
  if (!value) return "";
  if (!value.startsWith("/")) return "";
  if (value.startsWith("//")) return "";
  if (value.includes("://")) return "";
  return value;
}

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [error, setError] = useState("");

  useEffect(() => {
    const finishGoogleLogin = async () => {
      try {
        const response = await fetch("/api/auth/google-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            next: nextPath || undefined,
          }),
        });

        const data = (await response.json()) as GoogleBridgeResponse;

        if (!response.ok) {
          setError(data.error || "Unable to complete Google sign-in.");
          return;
        }

        router.push(nextPath || data.redirectTo || "/dashboard");
      } catch {
        setError("Something went wrong while finishing Google sign-in.");
      }
    };

    void finishGoogleLogin();
  }, [router, nextPath]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200/70 sm:p-10">
        <div className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-bold text-orange-700">
          Google sign-in
        </div>

        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Finalizing your Google sign-in.
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
          Please wait while we securely finish your account session and check
          whether your account setup is complete.
        </p>

        {nextPath ? (
          <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            After sign-in, you will continue to{" "}
            <span className="font-black">{nextPath}</span>.
          </div>
        ) : null}

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

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <p className="text-sm font-bold text-slate-700">
              Finishing Google sign-in...
            </p>
          </div>
        </main>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}