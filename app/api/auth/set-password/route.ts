import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import {
  validateConfirmPassword,
  validatePassword,
} from "@/lib/validators/auth";

type SetPasswordBody = {
  password?: string;
  confirmPassword?: string;
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

    const body = (await request.json()) as SetPasswordBody;

    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const confirmPasswordError = validateConfirmPassword(
      password,
      confirmPassword
    );
    if (confirmPasswordError) {
      return NextResponse.json(
        { error: confirmPasswordError },
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

    if (user.authProvider !== "GOOGLE") {
      return NextResponse.json(
        { error: "Only Google-based accounts can use this route." },
        { status: 403 }
      );
    }

    if (user.passwordHash) {
      return NextResponse.json(
        { error: "This account already has a password set." },
        { status: 409 }
      );
    }

    const newPasswordHash = hashPassword(password);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({
      message:
        "Password set successfully. You can now log in with either Google or email and password.",
    });
  } catch (error) {
    console.error("SET_PASSWORD_ERROR", error);

    return NextResponse.json(
      { error: "Unable to set password right now." },
      { status: 500 }
    );
  }
}