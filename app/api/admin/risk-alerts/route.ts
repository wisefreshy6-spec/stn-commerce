import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const orders = await db.order.findMany({
      where: {
        riskStatus: "REVIEW_REQUIRED",
        status: {
          notIn: ["CANCELLED", "REFUNDED", "DELIVERED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        riskStatus: true,
        riskReason: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("ADMIN_RISK_ALERTS_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load risk alerts." },
      { status: 500 }
    );
  }
}