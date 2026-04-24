import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET() {
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

    if (session.role !== "ADMIN" && session.role !== "SUPPORT") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const requests = await db.dataRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            country: true,
            city: true,
            authProvider: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("ADMIN_DATA_REQUESTS_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load data requests." },
      { status: 500 }
    );
  }
}