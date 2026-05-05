import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

async function getSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return rawSession ? parseSessionValue(rawSession) : null;
}

export async function GET() {
  try {
    const session = await getSession();

    if (
      !session ||
      !["ADMIN", "SUPPORT", "TEAM"].includes(session.role)
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const include = {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    };

    const [unassigned, active, mine, closed] = await Promise.all([
      db.supportTicket.findMany({
        where: {
          assignedToId: null,
          status: "OPEN",
        },
        orderBy: { updatedAt: "desc" },
        include,
      }),

      db.supportTicket.findMany({
        where: {
          status: "IN_PROGRESS",
        },
        orderBy: { updatedAt: "desc" },
        include,
      }),

      db.supportTicket.findMany({
        where: {
          assignedToId: session.userId,
          status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
        },
        orderBy: { updatedAt: "desc" },
        include,
      }),

      db.supportTicket.findMany({
        where: {
          status: {
            in: ["RESOLVED", "CLOSED"],
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 30,
        include,
      }),
    ]);

    return NextResponse.json({
      unassigned,
      active,
      mine,
      closed,
      summary: {
        unassigned: unassigned.length,
        active: active.length,
        mine: mine.length,
        closed: closed.length,
      },
    });
  } catch (error) {
    console.error("ADMIN_SUPPORT_QUEUE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load support queue." },
      { status: 500 }
    );
  }
}