import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type UpdateTicketBody = {
  ticketId?: string;
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
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

    if (session.role !== "ADMIN" && session.role !== "SUPPORT") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as UpdateTicketBody;

    const ticketId = body.ticketId?.trim() ?? "";
    const status = body.status;
    const priority = body.priority;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required." },
        { status: 400 }
      );
    }

    if (
      status &&
      !["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid ticket status." },
        { status: 400 }
      );
    }

    if (
      priority &&
      !["LOW", "NORMAL", "HIGH", "URGENT"].includes(priority)
    ) {
      return NextResponse.json(
        { error: "Invalid ticket priority." },
        { status: 400 }
      );
    }

    const updatedTicket = await db.supportTicket.update({
      where: {
        id: ticketId,
      },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        assignedToId: session.userId,
      },
    });

    return NextResponse.json({
      message: "Support ticket updated successfully.",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("UPDATE_SUPPORT_TICKET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update support ticket." },
      { status: 500 }
    );
  }
}