import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type RestockBody = {
  productId?: string;
  quantity?: number;
};

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as RestockBody;

    const productId = body.productId?.trim() ?? "";
    const quantity = Number(body.quantity);

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: "Restock quantity must be a positive whole number." },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (product.status === "DELETED") {
      return NextResponse.json(
        { error: "Deleted products cannot be restocked." },
        { status: 400 }
      );
    }

    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: {
        stock: {
          increment: quantity,
        },
        status:
          product.status === "OUT_OF_STOCK" || product.status === "HIDDEN"
            ? "ACTIVE"
            : product.status,
      },
    });

    return NextResponse.json({
      message: `Product restocked by ${quantity}.`,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("PRODUCT_RESTOCK_ERROR", error);

    return NextResponse.json(
      { error: "Unable to restock product." },
      { status: 500 }
    );
  }
}