import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/login?error=missing_verification_token", request.url)
      );
    }

    const tokenHash = hashToken(token);

    const verificationToken = await db.verificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/auth/login?error=invalid_verification_token", request.url)
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      await db.verificationToken.delete({
        where: { tokenHash },
      });

      return NextResponse.redirect(
        new URL("/auth/login?error=expired_verification_token", request.url)
      );
    }

    await db.$transaction([
      db.user.update({
        where: { id: verificationToken.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: "ACTIVE",
        },
      }),
      db.verificationToken.deleteMany({
        where: { userId: verificationToken.userId },
      }),
    ]);

    return NextResponse.redirect(
      new URL("/auth/login?success=email_verified", request.url)
    );
  } catch (error) {
    console.error("VERIFY_EMAIL_ERROR", error);

    return NextResponse.redirect(
      new URL("/auth/login?error=verification_failed", request.url)
    );
  }
}