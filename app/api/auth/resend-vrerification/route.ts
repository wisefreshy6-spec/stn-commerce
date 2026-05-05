import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createRawToken, hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { verificationEmailTemplate } from "@/lib/emailTemplates";

type Body = {
  email?: string;
};

const COOLDOWN_SECONDS = 30;

function secondsSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 1000);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const email = body.email?.trim().toLowerCase() || "";

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
        firstName: true,
        lastName: true,
        emailVerified: true,
        status: true,
        verificationTokens: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    if (!user || user.status === "DELETED") {
      return NextResponse.json({
        message:
          "If the email exists and is not verified, a verification link will be sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "This email is already verified. Please log in." },
        { status: 400 }
      );
    }

    const lastToken = user.verificationTokens[0];

    if (lastToken) {
      const elapsed = secondsSince(lastToken.createdAt);

      if (elapsed < COOLDOWN_SECONDS) {
        return NextResponse.json(
          {
            error: `Please wait ${COOLDOWN_SECONDS - elapsed}s before requesting another verification email.`,
            retryAfter: COOLDOWN_SECONDS - elapsed,
          },
          { status: 429 }
        );
      }
    }

    await db.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    const rawToken = createRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await db.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${rawToken}`;

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "Customer";

    await sendEmail({
      to: user.email,
      subject: "Verify your STN Commerce account",
      html: verificationEmailTemplate({ name, verifyUrl }),
      text: `Verify your STN Commerce account: ${verifyUrl}`,
    });

    return NextResponse.json({
      message: "Verification email sent. Check your inbox or spam folder.",
    });
  } catch (error) {
    console.error("RESEND_VERIFICATION_ERROR", error);

    return NextResponse.json(
      { error: "Unable to resend verification email right now." },
      { status: 500 }
    );
  }
}