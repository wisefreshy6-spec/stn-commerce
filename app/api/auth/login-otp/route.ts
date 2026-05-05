import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { resolveRoleFromEmail } from "@/lib/auth/admin";
import { hashToken } from "@/lib/auth/tokens";
import {
  createSessionValue,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

type Body = {
  email?: string;
  code?: string;
};

function cleanCode(value: unknown) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;

    const email = body.email?.trim().toLowerCase() || "";
    const code = cleanCode(body.code);

    if (!email || code.length !== 6) {
      return NextResponse.json(
        { error: "Enter the 6-digit login code." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        authProvider: true,
        emailVerified: true,
        onboardingCompleted: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid login code." },
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

    const codeHash = hashToken(code);

    const otp = await db.loginOtpToken.findFirst({
      where: {
        userId: user.id,
        codeHash,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otp) {
      await db.loginOtpToken.updateMany({
        where: { userId: user.id },
        data: { attempts: { increment: 1 } },
      });

      return NextResponse.json(
        { error: "Invalid login code." },
        { status: 401 }
      );
    }

    if (otp.attempts >= 5) {
      await db.loginOtpToken.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json(
        { error: "Too many attempts. Please request a new login code." },
        { status: 429 }
      );
    }

    if (otp.expiresAt < new Date()) {
      await db.loginOtpToken.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json(
        { error: "Login code has expired. Please log in again." },
        { status: 400 }
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
      rememberMe: otp.rememberMe,
    });

    const cookieStore = await cookies();

    cookieStore.set(
      SESSION_COOKIE_NAME,
      sessionValue,
      getSessionCookieOptions(otp.rememberMe)
    );

    await db.loginOtpToken.deleteMany({
      where: { userId: user.id },
    });

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
    console.error("LOGIN_OTP_ERROR", error);

    return NextResponse.json(
      { error: "Unable to verify login code right now." },
      { status: 500 }
    );
  }
}