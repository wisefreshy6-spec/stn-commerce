import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionValue,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

type LoginBody = {
  email?: string;
  password?: string;
  rememberMe?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const rememberMe = Boolean(body.rememberMe);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        emailVerified: true,
        status: true,
        firstName: true,
        lastName: true,
        authProvider: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.authProvider === "GOOGLE" && !user.passwordHash) {
      return NextResponse.json(
        {
          error:
            "This account uses Google sign-in. Continue with Google or set a password later from your account settings.",
        },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account does not currently support password login." },
        { status: 403 }
      );
    }

    const passwordOk = verifyPassword(password, user.passwordHash);

    if (!passwordOk) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Verify your email before logging in." },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED" || user.status === "DELETED") {
      return NextResponse.json(
        { error: "This account cannot log in right now." },
        { status: 403 }
      );
    }

    const sessionValue = createSessionValue({
      userId: user.id,
      role: user.role,
      emailVerified: user.emailVerified,
      onboardingCompleted: user.onboardingCompleted,
      authProvider: user.authProvider,
      rememberMe,
    });

    const cookieStore = await cookies();
    cookieStore.set(
      SESSION_COOKIE_NAME,
      sessionValue,
      getSessionCookieOptions(rememberMe)
    );

    return NextResponse.json({
      message: "Login successful.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        authProvider: user.authProvider,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    return NextResponse.json(
      { error: "Unable to log in right now." },
      { status: 500 }
    );
  }
}