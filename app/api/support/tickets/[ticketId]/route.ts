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
};

async function getSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return rawSession ? parseSessionValue(rawSession) : null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
            role: true,
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
                id: true,
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

    const isCustomer = ticket.customerId === session.userId;
    const isStaff = ["ADMIN", "SUPPORT", "TEAM"].includes(session.role);

    if (!isCustomer && !isStaff) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("SUPPORT_TICKET_DETAIL_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load support ticket." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { ticketId } = await context.params;
    const body = (await request.json()) as PatchBody;

    const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

    if (!body.status || !allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const existingTicket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        customerId: true,
        status: true,
      },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const isCustomer = existingTicket.customerId === session.userId;
    const isStaff = ["ADMIN", "SUPPORT", "TEAM"].includes(session.role);

    if (!isCustomer && !isStaff) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (isCustomer && !["RESOLVED", "CLOSED"].includes(body.status)) {
      return NextResponse.json(
        { error: "Customers can only mark a ticket resolved or closed." },
        { status: 403 }
      );
    }

    const ticket = await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: body.status,
      },
    });

    return NextResponse.json({
      message:
        body.status === "CLOSED"
          ? "Ticket closed successfully."
          : "Ticket updated successfully.",
      ticket,
    });
  } catch (error) {
    console.error("SUPPORT_TICKET_STATUS_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update ticket." },
      { status: 500 }
    );
  }
}