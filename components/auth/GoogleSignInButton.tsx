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
    className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#3c4043] shadow-sm transition hover:bg-slate-50"
  >
    <img
      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
      alt="Google"
      className="h-5 w-5"
    />
    {label}
  </button>
);
}