import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { resolveRoleFromEmail } from "@/lib/auth/admin";
import { hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { loginOtpEmailTemplate } from "@/lib/emailTemplates";

type LoginBody = {
  email?: string;
  password?: string;
  rememberMe?: boolean;
};

const LOGIN_OTP_COOLDOWN_SECONDS = 30;

function createOtpCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function secondsSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 1000);
}

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
        loginOtpTokens: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
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
        {
          error: "Verify your email before logging in.",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED" || user.status === "DELETED") {
      return NextResponse.json(
        { error: "This account cannot log in right now." },
        { status: 403 }
      );
    }

    const lastOtp = user.loginOtpTokens[0];

    if (lastOtp) {
      const elapsed = secondsSince(lastOtp.createdAt);

      if (elapsed < LOGIN_OTP_COOLDOWN_SECONDS) {
        return NextResponse.json(
          {
            error: `Please wait ${LOGIN_OTP_COOLDOWN_SECONDS - elapsed}s before requesting another login code.`,
            otpRequired: true,
            email: user.email,
            retryAfter: LOGIN_OTP_COOLDOWN_SECONDS - elapsed,
          },
          { status: 429 }
        );
      }
    }

    await db.loginOtpToken.deleteMany({
      where: { userId: user.id },
    });

    const code = createOtpCode();
    const codeHash = hashToken(code);

    await db.loginOtpToken.create({
      data: {
        userId: user.id,
        codeHash,
        rememberMe,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
      },
    });

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "Customer";

    await sendEmail({
      to: user.email,
      subject: "Your STN Commerce login code",
      html: loginOtpEmailTemplate({ name, code }),
      text: `Your STN Commerce login code is ${code}. It expires in 10 minutes.`,
    });

    return NextResponse.json({
      message: "Login code sent to your email.",
      otpRequired: true,
      email: user.email,
    });
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    return NextResponse.json(
      { error: "Unable to log in right now." },
      { status: 500 }
    );
  }
}