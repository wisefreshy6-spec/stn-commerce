import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.mobileCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        panels: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            items: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            },
          },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("ADMIN_MOBILE_CATEGORIES_GET_ERROR", error);
    return NextResponse.json(
      { error: "Unable to load mobile categories." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const icon = String(body.icon || "").trim();
    const sortOrder = Number(body.sortOrder || 0);

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required." },
        { status: 400 }
      );
    }

    const category = await db.mobileCategory.create({
      data: {
        name,
        icon: icon || null,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({
      message: "Mobile category created.",
      category,
    });
  } catch (error) {
    console.error("ADMIN_MOBILE_CATEGORIES_POST_ERROR", error);
    return NextResponse.json(
      { error: "Unable to create mobile category." },
      { status: 500 }
    );
  }
}