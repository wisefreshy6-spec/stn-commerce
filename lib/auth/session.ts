import { createHmac, timingSafeEqual } from "crypto";
import type { UserRole } from "@/lib/auth/roles";

export const SESSION_COOKIE_NAME = "stn_session";

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
const REMEMBER_ME_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionAuthProvider = "CREDENTIALS" | "GOOGLE";

export type SessionPayload = {
  userId: string;
  role: UserRole;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  authProvider: SessionAuthProvider;
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Use at least 32 characters."
    );
  }

  return secret;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(input: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(input)
    .digest("base64url");
}

export function createSessionValue(input: {
  userId: string;
  role: UserRole;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  authProvider: SessionAuthProvider;
  rememberMe?: boolean;
}): string {
  const maxAge = input.rememberMe
    ? REMEMBER_ME_SESSION_MAX_AGE_SECONDS
    : DEFAULT_SESSION_MAX_AGE_SECONDS;

  const payload: SessionPayload = {
    userId: input.userId,
    role: input.role,
    emailVerified: input.emailVerified,
    onboardingCompleted: input.onboardingCompleted,
    authProvider: input.authProvider,
    exp: Math.floor(Date.now() / 1000) + maxAge,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function parseSessionValue(value: string): SessionPayload | null {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const given = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (given.length !== expected.length) {
    return null;
  }

  if (!timingSafeEqual(given, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;

    if (
      !payload?.userId ||
      !payload?.role ||
      typeof payload.emailVerified !== "boolean" ||
      typeof payload.onboardingCompleted !== "boolean" ||
      !payload?.authProvider ||
      !payload?.exp
    ) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(rememberMe = false) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: rememberMe
      ? REMEMBER_ME_SESSION_MAX_AGE_SECONDS
      : DEFAULT_SESSION_MAX_AGE_SECONDS,
  };
}