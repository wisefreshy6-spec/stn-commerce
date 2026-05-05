import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type Body = {
  productId?: string;
  name?: string;
  barcode?: string | null;
  section?: "FAST_FOOD" | "HARDWARE" | "ONLINE_STORE" | "EXCLUSIVE_STORE";
  category?: string | null;
  price?: string | number;
  stock?: number;
  status?: "ACTIVE" | "HIDDEN" | "OUT_OF_STOCK" | "DELETED";
  description?: string | null;
  imageUrl?: string | null;
  sizes?: string[];
  colors?: string[];
  discountPercent?: number;
};

async function requireAdmin() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = rawSession ? parseSessionValue(rawSession) : null;

  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as Body;

    if (!body.productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const existing = await db.product.findUnique({
      where: { id: body.productId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name.trim();
    if (body.barcode !== undefined) data.barcode = body.barcode || null;
    if (body.section !== undefined) data.section = body.section;
    if (body.category !== undefined) data.category = body.category || null;
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.stock !== undefined) data.stock = Number(body.stock);
    if (body.status !== undefined) data.status = body.status;
    if (body.description !== undefined)
      data.description = body.description || null;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;
    if (body.sizes !== undefined) data.sizes = body.sizes;
    if (body.colors !== undefined) data.colors = body.colors;
    if (body.discountPercent !== undefined)
      data.discountPercent = Number(body.discountPercent);

    if (data.name === "") {
      return NextResponse.json(
        { error: "Product name cannot be empty." },
        { status: 400 }
      );
    }

    if (
      data.price !== undefined &&
      (!Number.isFinite(Number(data.price)) || Number(data.price) < 0)
    ) {
      return NextResponse.json(
        { error: "Enter a valid price." },
        { status: 400 }
      );
    }

    if (
      data.stock !== undefined &&
      (!Number.isInteger(Number(data.stock)) || Number(data.stock) < 0)
    ) {
      return NextResponse.json(
        { error: "Enter a valid stock quantity." },
        { status: 400 }
      );
    }

    if (
      data.discountPercent !== undefined &&
      (Number(data.discountPercent) < 0 || Number(data.discountPercent) > 90)
    ) {
      return NextResponse.json(
        { error: "Discount must be between 0 and 90." },
        { status: 400 }
      );
    }

    const product = await db.product.update({
      where: { id: body.productId },
      data,
    });

    return NextResponse.json({
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error("ADMIN_PRODUCTS_UPDATE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update product." },
      { status: 500 }
    );
  }
}