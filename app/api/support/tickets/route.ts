import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type Body = {
  subject?: string;
  message?: string;
  category?: string;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session) {
      return NextResponse.json(
        { error: "Please sign in before creating a support ticket." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Body;

    const subject = body.subject?.trim() || "";
    const message = body.message?.trim() || "";
    const category = body.category?.trim() || "GENERAL";

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required." },
        { status: 400 }
      );
    }

    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: "Please describe your issue clearly." },
        { status: 400 }
      );
    }

    const ticket = await db.supportTicket.create({
      data: {
        customerId: session.userId,
        subject,
        message,
        category,
        status: "OPEN",
        priority: "NORMAL",
      },
    });

    return NextResponse.json({
      message: "Support ticket created successfully.",
      ticket,
    });
  } catch (error) {
    console.error("SUPPORT_TICKET_CREATE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to create support ticket." },
      { status: 500 }
    );
  }
}