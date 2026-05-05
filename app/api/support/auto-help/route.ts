import { NextResponse } from "next/server";
import { getAutoHelpResponse } from "@/lib/support/autoHelp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body.message || "");

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const result = getAutoHelpResponse(message);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AUTO_HELP_ERROR", error);

    return NextResponse.json(
      { error: "Auto help failed." },
      { status: 500 }
    );
  }
}