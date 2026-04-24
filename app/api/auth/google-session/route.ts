import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createSessionValue,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();

    const email = session?.user?.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { error: "Google session not found." },
        { status: 401 }
      );
    }

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

    const redirectTo = user.onboardingCompleted
      ? user.role === "ADMIN"
        ? "/admin"
        : "/dashboard"
      : "/auth/complete-profile";

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