import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import {
  validateConfirmPassword,
  validatePassword,
} from "@/lib/validators/auth";

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawSession) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const session = parseSessionValue(rawSession);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as ChangePasswordBody;

    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";
    const confirmNewPassword = body.confirmNewPassword ?? "";

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required." },
        { status: 400 }
      );
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const confirmPasswordError = validateConfirmPassword(
      newPassword,
      confirmNewPassword
    );

    if (confirmPasswordError) {
      return NextResponse.json(
        { error: confirmPasswordError },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from current password." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        authProvider: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account does not have a password set yet." },
        { status: 403 }
      );
    }

    const currentPasswordOk = verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!currentPasswordOk) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const newPasswordHash = hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({
      message:
        "Password changed successfully. Later, this action can require email or phone OTP before final confirmation.",
    });
  } catch (error) {
    console.error("CHANGE_PASSWORD_ERROR", error);

    return NextResponse.json(
      { error: "Unable to change password right now." },
      { status: 500 }
    );
  }
}