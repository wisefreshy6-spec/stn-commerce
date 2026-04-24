import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createRawToken, hashToken } from "@/lib/auth/tokens";

type ForgotPasswordBody = {
  email?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ForgotPasswordBody;
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    // Do not reveal whether the email exists
    if (!user || user.status === "DELETED") {
      return NextResponse.json({
        message:
          "If that email exists in our system, a password reset link has been prepared.",
      });
    }

    const rawToken = createRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await db.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`;

    return NextResponse.json({
      message:
        "If that email exists in our system, a password reset link has been prepared.",
      developmentResetUrl:
        process.env.NODE_ENV === "production" ? undefined : resetUrl,
    });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR", error);

    return NextResponse.json(
      { error: "Unable to process password reset right now." },
      { status: 500 }
    );
  }
}