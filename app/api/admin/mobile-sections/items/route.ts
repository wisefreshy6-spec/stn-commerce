import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const allowedTargets = ["CATEGORY", "SUBCATEGORY", "BRAND", "DEAL"];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sectionId = String(body.sectionId || "").trim();
    const name = String(body.name || "").trim();
    const image = String(body.image || "").trim();
    const targetType = String(body.targetType || "").trim().toUpperCase();
    const targetValue = String(body.targetValue || "").trim();
    const sortOrder = Number(body.sortOrder || 0);

    if (!sectionId) {
      return NextResponse.json(
        { error: "Section is required." },
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
        { error: "Target type must be CATEGORY, SUBCATEGORY, BRAND, or DEAL." },
        { status: 400 }
      );
    }

    if (!targetValue) {
      return NextResponse.json(
        { error: "Target value is required." },
        { status: 400 }
      );
    }

    const item = await db.mobileSectionItem.create({
      data: {
        sectionId,
        name,
        image: image || null,
        targetType,
        targetValue,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({
      message: "Mobile section item created.",
      item,
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_SECTION_ITEM_POST_ERROR", error);

    return NextResponse.json(
      { error: "Unable to create mobile section item." },
      { status: 500 }
    );
  }
}