import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawSession) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = parseSessionValue(rawSession);

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        country: true,
        city: true,
        phone: true,
        address: true,
        emailVerified: true,
        status: true,
        authProvider: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("ME_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load current user." },
      { status: 500 }
    );
  }
}