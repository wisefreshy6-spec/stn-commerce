import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

type Body = {
  message?: string;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    const { ticketId } = await context.params;
    const body = (await request.json()) as Body;
    const message = body.message?.trim() || "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        customerId: true,
        status: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const isOwner = ticket.customerId === session.userId;
    const isStaff =
      session.role === "ADMIN" ||
      session.role === "SUPPORT" ||
      session.role === "TEAM";

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
      return NextResponse.json(
        { error: "This chat is closed. Please start a new support request." },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.supportTicketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: session.userId,
          message,
        },
      });

      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
        },
      });
    });

    return NextResponse.json({
      message: "Message sent.",
    });
  } catch (error) {
    console.error("SUPPORT_MESSAGE_CREATE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to send message." },
      { status: 500 }
    );
  }
}