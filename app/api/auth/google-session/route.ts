import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createSessionValue,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { NextResponse } from "next/server";

type Body = {
  next?: string;
};

function safeNextPath(value: unknown) {
  const path = typeof value === "string" ? value.trim() : "";

  if (!path) return "";
  if (!path.startsWith("/")) return "";
  if (path.startsWith("//")) return "";
  if (path.includes("://")) return "";

  return path;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { error: "Google session not found." },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Body;
    const nextPath = safeNextPath(body.next);

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        emailVerified: true,
        authProvider: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User record not found." },
        { status: 404 }
      );
    }

    const sessionValue = createSessionValue({
      userId: user.id,
      role: user.role,
      emailVerified: user.emailVerified,
      onboardingCompleted: user.onboardingCompleted,
      authProvider: user.authProvider,
      rememberMe: true,
    });

    const cookieStore = await cookies();
    cookieStore.set(
      SESSION_COOKIE_NAME,
      sessionValue,
      getSessionCookieOptions(true)
    );

    let redirectTo = "/dashboard";

    if (!user.onboardingCompleted) {
      redirectTo = nextPath
        ? `/auth/complete-profile?next=${encodeURIComponent(nextPath)}`
        : "/auth/complete-profile";
    } else if (nextPath) {
      redirectTo = nextPath;
    } else if (user.role === "ADMIN") {
      redirectTo = "/admin";
    } else if (user.role === "SUPPORT" || user.role === "TEAM") {
      redirectTo = "/admin/support";
    }

    return NextResponse.json({
      message: "Google session bridged successfully.",
      redirectTo,
    });
  } catch (error) {
    console.error("GOOGLE_SESSION_BRIDGE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to complete Google sign-in." },
      { status: 500 }
    );
  }
}