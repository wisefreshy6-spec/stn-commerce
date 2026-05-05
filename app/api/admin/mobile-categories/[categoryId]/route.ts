import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    categoryId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { categoryId } = await context.params;
    const body = await request.json();

    const category = await db.mobileCategory.update({
      where: { id: categoryId },
      data: {
        name:
          body.name === undefined ? undefined : String(body.name || "").trim(),
        icon:
          body.icon === undefined
            ? undefined
            : String(body.icon || "").trim() || null,
        sortOrder:
          body.sortOrder === undefined ? undefined : Number(body.sortOrder || 0),
        isActive: body.isActive,
      },
    });

    return NextResponse.json({
      message: "Mobile category updated.",
      category,
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_CATEGORY_PATCH_ERROR", error);
    return NextResponse.json(
      { error: "Unable to update mobile category." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { categoryId } = await context.params;

    await db.mobileCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      message: "Mobile category deleted.",
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_CATEGORY_DELETE_ERROR", error);
    return NextResponse.json(
      { error: "Unable to delete mobile category." },
      { status: 500 }
    );
  }
}