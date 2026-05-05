import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import {
  createAdminNotification,
  createUserNotification,
} from "@/lib/notifications";

type Body = {
  orderId?: string;
};

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as Body;
    const orderId = body.orderId?.trim() || "";

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await db.order.update({
      where: { id: orderId },
      data: {
        riskStatus: "CLEAR",
        riskReason: null,
      },
      select: {
        id: true,
        userId: true,
        invoiceNumber: true,
      },
    });

    await createAdminNotification({
      type: "RISK",
      title: "Risk review cleared",
      message: `Order ${order.invoiceNumber} was approved for processing.`,
      link: "/admin/orders",
    });

    await createUserNotification({
        userId: order.userId,
        type: "ORDER",
        title: "Order review completed",
        message: `Your order ${order.invoiceNumber} has passed review and can continue.`,
        link: `/orders/${order.id}`,
    });

    return NextResponse.json({
      message: "Risk review approved. Order can now progress.",
      order,
    });
  } catch (error) {
    console.error("ADMIN_ORDER_RISK_APPROVE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to approve risk review." },
      { status: 500 }
    );
  }
}