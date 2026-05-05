import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    await db.user.updateMany({
      where: { email },
      data: { newsletterSubscribed: true },
    });

    return NextResponse.json({
      message: "Subscribed successfully.",
    });
  } catch (error) {
    console.error("NEWSLETTER_ERROR", error);

    return NextResponse.json(
      { error: "Unable to subscribe." },
      { status: 500 }
    );
  }
}