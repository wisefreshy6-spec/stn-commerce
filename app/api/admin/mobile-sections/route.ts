import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const sections = await db.mobileSection.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        items: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("ADMIN_MOBILE_SECTIONS_GET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load mobile sections." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = String(body.title || "").trim();
    const type = String(body.type || "NORMAL").trim().toUpperCase();
    const sortOrder = Number(body.sortOrder || 0);

    if (!title) {
      return NextResponse.json(
        { error: "Section title is required." },
        { status: 400 }
      );
    }

    const section = await db.mobileSection.create({
      data: {
        title,
        type,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({
      message: "Mobile section created.",
      section,
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_SECTIONS_POST_ERROR", error);

    return NextResponse.json(
      { error: "Unable to create mobile section." },
      { status: 500 }
    );
  }
}