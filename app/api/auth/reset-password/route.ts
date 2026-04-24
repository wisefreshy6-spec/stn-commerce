import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";

type ResetPasswordBody = {
  token?: string;
  password?: string;
  confirmPassword?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetPasswordBody;

    const token = body.token?.trim() ?? "";
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!token) {
      return NextResponse.json(
        { error: "Reset token is required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    const resetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        userId: true,
        expiresAt: true,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Reset link is invalid." },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      await db.passwordResetToken.delete({
        where: { tokenHash },
      });

      return NextResponse.json(
        { error: "Reset link has expired." },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
        },
      }),
      db.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return NextResponse.json({
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR", error);

    return NextResponse.json(
      { error: "Unable to reset password right now." },
      { status: 500 }
    );
  }
}