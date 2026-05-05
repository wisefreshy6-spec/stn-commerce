import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const isOwner = order.userId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    // Only allow cancel if still pending
    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            "This order can no longer be cancelled because processing has already started.",
        },
        { status: 400 }
      );
    }

    // 🚨 SAFETY: prevent users cancelling paid orders (admin can still)
    if (order.paymentStatus === "PAID" && !isAdmin) {
      return NextResponse.json(
        {
          error:
            "Paid orders cannot be cancelled automatically. Please contact support for refund review.",
        },
        { status: 400 }
      );
    }

    const cancelledOrder = await db.$transaction(async (tx) => {
      // Return stock only if it had already been reduced
      if (order.stockReduced) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
              status: "ACTIVE",
            },
          });
        }
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          stockReduced: false,
        },
      });
    });

    return NextResponse.json({
      message: order.stockReduced
        ? "Order cancelled successfully and stock was returned."
        : "Order cancelled successfully.",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("ORDER_CANCEL_ERROR", error);

    return NextResponse.json(
      { error: "Unable to cancel order." },
      { status: 500 }
    );
  }
}