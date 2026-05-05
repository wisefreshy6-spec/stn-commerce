import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

type PatchBody = {
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  assignedToId?: string | null;
};

async function getSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return rawSession ? parseSessionValue(rawSession) : null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPPORT", "TEAM"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { ticketId } = await context.params;

    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
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
          orderBy: { createdAt: "asc" },
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
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("ADMIN_SUPPORT_TICKET_DETAIL_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load ticket." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPPORT", "TEAM"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { ticketId } = await context.params;
    const body = (await request.json()) as PatchBody;

    const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    const allowedPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"];

    if (body.status && !allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    if (body.priority && !allowedPriorities.includes(body.priority)) {
      return NextResponse.json({ error: "Invalid priority." }, { status: 400 });
    }

    if (body.assignedToId) {
      const assignee = await db.user.findFirst({
        where: {
          id: body.assignedToId,
          role: {
            in: ["ADMIN", "SUPPORT", "TEAM"],
          },
          status: {
            not: "DELETED",
          },
        },
        select: { id: true },
      });

      if (!assignee) {
        return NextResponse.json(
          { error: "Selected staff member is invalid." },
          { status: 400 }
        );
      }
    }

    const ticket = await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.priority ? { priority: body.priority } : {}),
        ...(body.assignedToId !== undefined
          ? { assignedToId: body.assignedToId || null }
          : {}),
      },
      include: {
        customer: true,
        assignedTo: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({
      message: "Ticket updated successfully.",
      ticket,
    });
  } catch (error) {
    console.error("ADMIN_SUPPORT_TICKET_UPDATE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update ticket." },
      { status: 500 }
    );
  }
}