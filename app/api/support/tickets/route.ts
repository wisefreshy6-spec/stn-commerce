import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type CreateTicketBody = {
  subject?: string;
  category?: string;
  message?: string;
};

export async function POST(request: Request) {
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

    const body = (await request.json()) as CreateTicketBody;

    const subject = body.subject?.trim() ?? "";
    const category = body.category?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (subject.length < 5) {
      return NextResponse.json(
        { error: "Subject must be at least 5 characters." },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters." },
        { status: 400 }
      );
    }

    const ticket = await db.supportTicket.create({
      data: {
        customerId: session.userId,
        subject,
        category,
        message,
        status: "OPEN",
        priority: "NORMAL",
      },
      select: {
        id: true,
        subject: true,
        category: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Support ticket submitted successfully.",
      ticket,
    });
  } catch (error) {
    console.error("CREATE_SUPPORT_TICKET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to submit support ticket right now." },
      { status: 500 }
    );
  }
}