import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const allowedTargets = ["CATEGORY", "SUBCATEGORY", "BRAND"];

type RouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { itemId } = await context.params;
    const body = await request.json();

    const nextTargetType =
      body.targetType === undefined
        ? undefined
        : String(body.targetType || "").trim().toUpperCase();

    if (nextTargetType && !allowedTargets.includes(nextTargetType)) {
      return NextResponse.json(
        { error: "Target type must be CATEGORY, SUBCATEGORY, or BRAND." },
        { status: 400 }
      );
    }

    const item = await db.mobileCategoryItem.update({
      where: { id: itemId },
      data: {
        name:
          body.name === undefined ? undefined : String(body.name || "").trim(),
        image:
          body.image === undefined
            ? undefined
            : String(body.image || "").trim() || null,
        targetType: nextTargetType,
        targetValue:
          body.targetValue === undefined
            ? undefined
            : String(body.targetValue || "").trim(),
        sortOrder:
          body.sortOrder === undefined ? undefined : Number(body.sortOrder || 0),
        isActive: body.isActive,
      },
    });

    return NextResponse.json({
      message: "Panel item updated.",
      item,
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_ITEM_PATCH_ERROR", error);
    return NextResponse.json(
      { error: "Unable to update panel item." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { itemId } = await context.params;

    await db.mobileCategoryItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      message: "Panel item deleted.",
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_ITEM_DELETE_ERROR", error);
    return NextResponse.json(
      { error: "Unable to delete panel item." },
      { status: 500 }
    );
  }
}