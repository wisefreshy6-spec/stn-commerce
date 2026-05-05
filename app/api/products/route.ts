import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const allowedSections = [
  "FAST_FOOD",
  "ONLINE_STORE",
  "EXCLUSIVE_STORE",
] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");

    if (!section || !allowedSections.includes(section as any)) {
      return NextResponse.json(
        { error: "Valid store section is required." },
        { status: 400 }
      );
    }

    const products = await db.product.findMany({
      where: {
        section: section as any,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        section: true,
        category: true,
        stock: true,
        status: true,
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("PUBLIC_PRODUCTS_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load products." },
      { status: 500 }
    );
  }
}