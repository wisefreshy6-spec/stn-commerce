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

    if (!session || !["ADMIN", "SUPPORT", "TEAM"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const tickets = await db.supportTicket.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
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
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    const supportUsers = await db.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "SUPPORT", "TEAM"],
        },
        status: {
          not: "DELETED",
        },
      },
      orderBy: { email: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ tickets, supportUsers });
  } catch (error) {
    console.error("ADMIN_SUPPORT_TICKETS_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load support inbox." },
      { status: 500 }
    );
  }
}