import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    sectionId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { sectionId } = await context.params;
    const body = await request.json();

    const section = await db.mobileSection.update({
      where: { id: sectionId },
      data: {
        title:
          body.title === undefined ? undefined : String(body.title || "").trim(),
        type:
          body.type === undefined
            ? undefined
            : String(body.type || "").trim().toUpperCase(),
        sortOrder:
          body.sortOrder === undefined ? undefined : Number(body.sortOrder || 0),
        isActive: body.isActive,
      },
    });

    return NextResponse.json({
      message: "Section updated.",
      section,
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_SECTION_PATCH_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update section." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { sectionId } = await context.params;

    await db.mobileSection.delete({
      where: { id: sectionId },
    });

    return NextResponse.json({
      message: "Section deleted.",
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_SECTION_DELETE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to delete section." },
      { status: 500 }
    );
  }
}