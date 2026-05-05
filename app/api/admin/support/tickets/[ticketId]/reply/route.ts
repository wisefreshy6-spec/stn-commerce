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

async function getSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return rawSession ? parseSessionValue(rawSession) : null;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPPORT", "TEAM"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { ticketId } = await context.params;
    const body = (await request.json()) as Body;

    const message = body.message?.trim() || "";

    if (!message || message.length < 2) {
      return NextResponse.json(
        { error: "Reply message is required." },
        { status: 400 }
      );
    }

    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    await db.$transaction([
      db.supportTicketMessage.create({
        data: {
          ticketId,
          senderId: session.userId,
          message,
        },
      }),
      db.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: "IN_PROGRESS",
        },
      }),
    ]);

    return NextResponse.json({
      message: "Reply sent successfully.",
    });
  } catch (error) {
    console.error("ADMIN_SUPPORT_REPLY_ERROR", error);

    return NextResponse.json(
      { error: "Unable to send reply." },
      { status: 500 }
    );
  }
}