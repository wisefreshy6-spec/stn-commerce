import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode")?.trim();

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode is required." },
        { status: 400 }
      );
    }

    const product = await db.product.findFirst({
      where: {
        barcode,
        status: {
          not: "DELETED",
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "No product found for this barcode." },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("BARCODE_LOOKUP_ERROR", error);

    return NextResponse.json(
      { error: "Unable to search barcode." },
      { status: 500 }
    );
  }
}