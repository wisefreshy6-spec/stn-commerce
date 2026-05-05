import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const placement = (url.searchParams.get("placement") || "HOME").toUpperCase();
    const now = new Date();

    const banners = await db.siteBanner.findMany({
      where: {
        placement,
        isActive: true,
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("PUBLIC_BANNERS_GET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load banners." },
      { status: 500 }
    );
  }
}