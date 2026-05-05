"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

type GoogleSignInButtonProps = {
  label?: string;
};

function safeNextPath(value: string | null) {
  if (!value) return "";
  if (!value.startsWith("/")) return "";
  if (value.startsWith("//")) return "";
  if (value.includes("://")) return "";
  return value;
}

export default function GoogleSignInButton({
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const handleGoogleSignIn = async () => {
    const callbackUrl = nextPath
      ? `/auth/google-callback?next=${encodeURIComponent(nextPath)}`
      : "/auth/google-callback";

    await signIn("google", {
      redirectTo: callbackUrl,
    });
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="h-11 w-full rounded-2xl border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50"
    >
      {label}
    </button>
  );
}