import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session || (session.role !== "ADMIN" && session.role !== "SUPPORT")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q) {
      return NextResponse.json({ products: [] });
    }

    const products = await db.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: 10,
      select: {
        id: true,
        name: true,
        price: true,
        barcode: true,
        section: true,
        category: true,
        stock: true,
        status: true,
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("POS_PRODUCTS_ERROR", error);

    return NextResponse.json(
      { error: "Unable to search POS products." },
      { status: 500 }
    );
  }
}