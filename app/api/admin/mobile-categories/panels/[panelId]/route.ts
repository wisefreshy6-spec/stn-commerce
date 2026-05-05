import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    panelId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { panelId } = await context.params;
    const body = await request.json();

    const panel = await db.mobileCategoryPanel.update({
      where: { id: panelId },
      data: {
        title:
          body.title === undefined ? undefined : String(body.title || "").trim(),
        sortOrder:
          body.sortOrder === undefined ? undefined : Number(body.sortOrder || 0),
        isActive: body.isActive,
      },
    });

    return NextResponse.json({
      message: "Panel updated.",
      panel,
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_PANEL_PATCH_ERROR", error);
    return NextResponse.json(
      { error: "Unable to update panel." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { panelId } = await context.params;

    await db.mobileCategoryPanel.delete({
      where: { id: panelId },
    });

    return NextResponse.json({
      message: "Panel deleted.",
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_PANEL_DELETE_ERROR", error);
    return NextResponse.json(
      { error: "Unable to delete panel." },
      { status: 500 }
    );
  }
}