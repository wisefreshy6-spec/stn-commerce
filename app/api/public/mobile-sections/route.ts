import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const sections = await db.mobileSection.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        items: {
          where: {
            isActive: true,
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("PUBLIC_MOBILE_SECTIONS_GET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load mobile sections." },
      { status: 500 }
    );
  }
}