import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const bannerId = String(body.bannerId || "");
    const placement = String(body.placement || "UNKNOWN");

    if (!bannerId) {
      return NextResponse.json(
        { error: "Banner ID required" },
        { status: 400 }
      );
    }

    await db.bannerClick.create({
      data: {
        bannerId,
        placement,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BANNER_CLICK_ERROR", error);

    return NextResponse.json(
      { error: "Unable to track click" },
      { status: 500 }
    );
  }
}