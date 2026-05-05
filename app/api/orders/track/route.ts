import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/security/rateLimit";

type Body = {
  invoiceNumber?: string;
};

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const limiter = rateLimit({
      key: `track:${ip}`,
      limit: 10,
      windowMs: 60 * 1000,
    });

    if (!limiter.success) {
      return NextResponse.json(
        {
          error: "Too many tracking attempts. Please wait.",
        },
        { status: 429 }
      );
    }

    const body = (await request.json()) as Body;
    const invoiceNumber = body.invoiceNumber?.trim().toUpperCase() || "";

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice number is required." },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: {
        invoiceNumber,
      },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        totalAmount: true,
        totalItems: true,
        deliveryArea: true,
        deliveryAddress: true,
        createdAt: true,
        items: {
          select: {
            name: true,
            quantity: true,
            lineTotal: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "No order found with that invoice number." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("ORDER_TRACK_ERROR", error);

    return NextResponse.json(
      { error: "Unable to track order." },
      { status: 500 }
    );
  }
}