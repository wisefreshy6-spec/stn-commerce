import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { resolveRoleFromEmail } from "@/lib/auth/admin";
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

    const resolvedRole = resolveRoleFromEmail(user.email);

    const updatedUser =
      resolvedRole !== user.role
        ? await db.user.update({
            where: { id: user.id },
            data: { role: resolvedRole },
            select: {
              id: true,
              email: true,
              role: true,
              firstName: true,
              lastName: true,
              authProvider: true,
              emailVerified: true,
              onboardingCompleted: true,
            },
          })
        : user;

    const sessionValue = createSessionValue({
      userId: updatedUser.id,
      role: updatedUser.role,
      emailVerified: updatedUser.emailVerified,
      onboardingCompleted: updatedUser.onboardingCompleted,
      authProvider: updatedUser.authProvider,
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
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        authProvider: updatedUser.authProvider,
        onboardingCompleted: updatedUser.onboardingCompleted,
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