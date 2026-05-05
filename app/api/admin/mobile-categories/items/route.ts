import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const allowedTargets = ["CATEGORY", "SUBCATEGORY", "BRAND"];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const panelId = String(body.panelId || "").trim();
    const name = String(body.name || "").trim();
    const image = String(body.image || "").trim();
    const targetType = String(body.targetType || "").trim().toUpperCase();
    const targetValue = String(body.targetValue || "").trim();
    const sortOrder = Number(body.sortOrder || 0);

    if (!panelId) {
      return NextResponse.json(
        { error: "Panel is required." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Item name is required." },
        { status: 400 }
      );
    }

    if (!allowedTargets.includes(targetType)) {
      return NextResponse.json(
        { error: "Target type must be CATEGORY, SUBCATEGORY, or BRAND." },
        { status: 400 }
      );
    }

    if (!targetValue) {
      return NextResponse.json(
        { error: "Target value is required." },
        { status: 400 }
      );
    }

    const item = await db.mobileCategoryItem.create({
      data: {
        panelId,
        name,
        image: image || null,
        targetType,
        targetValue,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({
      message: "Panel item created.",
      item,
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_ITEM_POST_ERROR", error);

    return NextResponse.json(
      { error: "Unable to create panel item." },
      { status: 500 }
    );
  }
}