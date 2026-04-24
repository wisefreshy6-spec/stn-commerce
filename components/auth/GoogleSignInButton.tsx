"use client";

import { signIn } from "next-auth/react";

type GoogleSignInButtonProps = {
  label?: string;
};

export default function GoogleSignInButton({
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  const handleGoogleSignIn = async () => {
    await signIn("google", {
      redirectTo: "/auth/google-callback",
    });
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="h-11 w-full rounded-2xl border border-slate-300 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {label}
    </button>
  );
}