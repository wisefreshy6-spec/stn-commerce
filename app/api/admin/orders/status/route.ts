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
  status?:
    | "PENDING"
    | "PROCESSING"
    | "AWAITING_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  paymentStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
};

async function reduceStockIfNeeded(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.stockReduced) {
    return;
  }

  for (const item of order.items) {
    const product = await db.product.findUnique({
      where: { id: item.productId },
      select: { id: true, name: true, stock: true },
    });

    if (!product) {
      throw new Error(`Product not found for ${item.name}.`);
    }

    if (product.stock < item.quantity) {
      throw new Error(
        `${product.name} has only ${product.stock} item(s) left.`
      );
    }
  }

  for (const item of order.items) {
    const updatedProduct = await db.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    });

    if (updatedProduct.stock <= 0) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: 0,
          status: "OUT_OF_STOCK",
        },
      });
    }
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      stockReduced: true,
    },
  });
}

async function returnStockIfNeeded(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (!order.stockReduced) {
    return;
  }

  for (const item of order.items) {
    await db.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          increment: item.quantity,
        },
        status: "ACTIVE",
      },
    });
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      stockReduced: false,
    },
  });
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as Body;

    if (!body.orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "PENDING",
      "PROCESSING",
      "AWAITING_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ];

    const allowedPaymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"];

    if (body.status && !allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid order status." },
        { status: 400 }
      );
    }

    if (
      body.paymentStatus &&
      !allowedPaymentStatuses.includes(body.paymentStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid payment status." },
        { status: 400 }
      );
    }

    const existingOrder = await db.order.findUnique({
      where: { id: body.orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        stockReduced: true,
        riskStatus: true,
        userId: true,
        invoiceNumber: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    
    if (existingOrder.status === "CANCELLED" || existingOrder.status === "REFUNDED") {
      return NextResponse.json(
        { error: "Cancelled or refunded orders cannot be updated." },
        { status: 400 }
      );
    }

if (
  existingOrder.riskStatus === "REVIEW_REQUIRED" &&
  (body.status === "PROCESSING" ||
    body.status === "AWAITING_DELIVERY" ||
    body.status === "DELIVERED" ||
    body.paymentStatus === "PAID")
) {
  return NextResponse.json(
    {
      error:
        "This order requires admin risk review before payment or delivery progress.",
    },
    { status: 400 }
  );
}

    if (body.status === "CANCELLED") {
      await returnStockIfNeeded(body.orderId);
    }

    if (
      body.paymentStatus === "PAID" ||
      body.status === "PROCESSING" ||
      body.status === "AWAITING_DELIVERY" ||
      body.status === "DELIVERED"
    ) {
      await reduceStockIfNeeded(body.orderId);
    }

    if (body.paymentStatus === "REFUNDED" || body.status === "REFUNDED") {
      await returnStockIfNeeded(body.orderId);
    }

    const order = await db.order.update({
      where: { id: body.orderId },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.paymentStatus ? { paymentStatus: body.paymentStatus } : {}),
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
      },
    });

if (body.status) {
  await createUserNotification({
    userId: existingOrder.userId,
    type: "ORDER",
    title: "Order status updated",
    message: `Your order ${existingOrder.invoiceNumber} is now ${body.status.replaceAll("_", " ")}.`,
    link: `/orders/${existingOrder.id}`,
  });
}

if (body.paymentStatus) {
  await createUserNotification({
    userId: existingOrder.userId,
    type: "PAYMENT",
    title: "Payment status updated",
    message: `Payment for ${existingOrder.invoiceNumber} is now ${body.paymentStatus}.`,
    link: `/orders/${existingOrder.id}`,
  });
}

await createAdminNotification({
  type: "ORDER",
  title: "Order updated",
  message: `${existingOrder.invoiceNumber} was updated by admin.`,
  link: "/admin/orders",
});

    return NextResponse.json({
      message:
        body.status === "DELIVERED"
          ? "Order marked delivered. Customer should pick within 3 business days."
          : body.paymentStatus === "PAID"
            ? "Payment marked paid and stock reduced."
            : body.status === "CANCELLED"
              ? "Order cancelled and stock returned if it had been reduced."
              : "Order updated successfully.",
      order,
    });
  } catch (error) {
    console.error("ADMIN_ORDER_STATUS_ERROR", error);

    const message =
      error instanceof Error ? error.message : "Unable to update order status.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}