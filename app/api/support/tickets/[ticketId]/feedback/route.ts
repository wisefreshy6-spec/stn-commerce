import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

type FeedbackBody = {
  rating?: number;
  comment?: string;
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
      select: {
        id: true,
        customerId: true,
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

    const feedback = await db.supportFeedback.findUnique({
      where: { ticketId },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("SUPPORT_FEEDBACK_GET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load support feedback." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { ticketId } = await context.params;
    const body = (await request.json()) as FeedbackBody;

    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim().slice(0, 600);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5." },
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

    if (ticket.customerId !== session.userId) {
      return NextResponse.json(
        { error: "Only the ticket owner can leave feedback." },
        { status: 403 }
      );
    }

    if (!["RESOLVED", "CLOSED"].includes(ticket.status)) {
      return NextResponse.json(
        { error: "Feedback is only available after the chat is closed or resolved." },
        { status: 400 }
      );
    }

    const feedback = await db.supportFeedback.upsert({
      where: { ticketId },
      update: {
        rating,
        comment: comment || null,
      },
      create: {
        ticketId,
        userId: session.userId,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json({
      message: "Thanks for your feedback.",
      feedback,
    });
  } catch (error) {
    console.error("SUPPORT_FEEDBACK_POST_ERROR", error);

    return NextResponse.json(
      { error: "Unable to save feedback." },
      { status: 500 }
    );
  }
}