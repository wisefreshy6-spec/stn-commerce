import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const isStaff =
      session.role === "ADMIN" ||
      session.role === "SUPPORT" ||
      session.role === "TEAM";

    if (!isStaff) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { ticketId } = await context.params;

    const ticket = await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId: session.userId,
        status: "IN_PROGRESS",
      },
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Ticket assigned successfully.",
      ticket,
    });
  } catch (error) {
    console.error("SUPPORT_ASSIGN_TICKET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to assign ticket." },
      { status: 500 }
    );
  }
}