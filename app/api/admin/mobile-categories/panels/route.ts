import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const categoryId = String(body.categoryId || "").trim();
    const title = String(body.title || "").trim();
    const sortOrder = Number(body.sortOrder || 0);

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "Panel title is required." },
        { status: 400 }
      );
    }

    const panel = await db.mobileCategoryPanel.create({
      data: {
        categoryId,
        title,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({
      message: "Panel created.",
      panel,
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_PANEL_POST_ERROR", error);

    return NextResponse.json(
      { error: "Unable to create panel." },
      { status: 500 }
    );
  }
}