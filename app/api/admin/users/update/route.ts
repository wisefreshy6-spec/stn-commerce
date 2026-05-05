import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type UpdateUserBody = {
  userId?: string;
  role?: "CUSTOMER" | "TEAM" | "SUPPORT" | "ADMIN";
  status?: "PENDING" | "ACTIVE" | "SUSPENDED" | "DELETED";
};

export async function PATCH(request: Request) {
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

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as UpdateUserBody;

    const userId = body.userId?.trim() ?? "";
    const role = body.role;
    const status = body.status;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    if (userId === session.userId && status === "SUSPENDED") {
      return NextResponse.json(
        { error: "You cannot suspend your own admin account." },
        { status: 400 }
      );
    }

    if (userId === session.userId && status === "DELETED") {
      return NextResponse.json(
        { error: "You cannot delete your own admin account." },
        { status: 400 }
      );
    }

    if (
      role &&
      !["CUSTOMER", "TEAM", "SUPPORT", "ADMIN"].includes(role)
    ) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (
      status &&
      !["PENDING", "ACTIVE", "SUSPENDED", "DELETED"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        authProvider: true,
        emailVerified: true,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("ADMIN_UPDATE_USER_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update user." },
      { status: 500 }
    );
  }
}