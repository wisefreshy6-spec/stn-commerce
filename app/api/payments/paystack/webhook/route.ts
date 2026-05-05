import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { paymentConfirmedEmailTemplate } from "@/lib/emailTemplates";
import {
  createAdminNotification,
  createUserNotification,
} from "@/lib/notifications";

function money(value: unknown) {
  return `KES ${Number(value ?? 0).toLocaleString()}`;
}

async function reduceStockIfNeeded(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new Error("Order not found.");
  if (order.stockReduced) return;

  for (const item of order.items) {
    const product = await db.product.findUnique({
      where: { id: item.productId },
      select: { id: true, name: true, stock: true },
    });

    if (!product) throw new Error(`Product not found for ${item.name}.`);

    if (product.stock < item.quantity) {
      throw new Error(`${product.name} has only ${product.stock} item(s) left.`);
    }
  }

  for (const item of order.items) {
    const updatedProduct = await db.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });

    if (updatedProduct.stock <= 0) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: 0, status: "OUT_OF_STOCK" },
      });
    }
if (updatedProduct.stock <= 5) {
  await createAdminNotification({
    type: "STOCK",
    title:
      updatedProduct.stock <= 0 ? "Product out of stock" : "Low stock alert",
    message: `${item.name} has ${Math.max(updatedProduct.stock, 0)} item(s) left.`,
    link: "/admin/products",
  });
}
  }

  await db.order.update({
    where: { id: orderId },
    data: { stockReduced: true },
  });
}

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json({ ok: true });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";

    const expectedSignature = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event?.event;
    const data = event?.data;

    if (eventType !== "charge.success") {
      return NextResponse.json({ ok: true });
    }

    const reference = String(data?.reference || "");
    const amountPaid = Number(data?.amount || 0) / 100;

    if (!reference) {
      return NextResponse.json({ ok: true });
    }

    const payment = await db.payment.findFirst({
      where: {
        transactionId: reference,
        provider: "CARD",
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      console.error("PAYSTACK_WEBHOOK_PAYMENT_NOT_FOUND", reference);
      return NextResponse.json({ ok: true });
    }

    if (payment.status === "PAID" && payment.order.paymentStatus === "PAID") {
      return NextResponse.json({ ok: true });
    }

    const expectedAmount = Number(payment.order.totalAmount);

    if (Math.round(amountPaid) < Math.round(expectedAmount)) {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason: "Webhook amount is less than order amount.",
          rawResponse: event,
        },
      });

      return NextResponse.json({ ok: true });
    }

    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          amount: amountPaid,
          rawResponse: event,
          paidAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: "PAID",
          paymentMethod: "CARD",
          status: "PROCESSING",
        },
      });
    });

    await reduceStockIfNeeded(payment.orderId);

await createAdminNotification({
  type: "PAYMENT",
  title: "Card payment received",
  message: `Payment confirmed for ${payment.order.invoiceNumber}`,
  link: "/admin/orders",
});

await createUserNotification({
    userId: payment.order.userId,
    type: "PAYMENT",
    title: "Payment successful",
    message: `Payment confirmed for ${payment.order.invoiceNumber}`,
    link: `/orders/${payment.orderId}`,
  });

    try {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const name =
        [payment.order.user.firstName, payment.order.user.lastName]
          .filter(Boolean)
          .join(" ") || "Customer";

      await sendEmail({
        to: payment.order.user.email,
        subject: `Payment confirmed - ${payment.order.invoiceNumber}`,
        html: paymentConfirmedEmailTemplate({
          name,
          invoiceNumber: payment.order.invoiceNumber,
          orderUrl: `${appUrl}/orders/${payment.orderId}`,
          total: money(payment.order.totalAmount),
        }),
        text: `Payment confirmed for ${payment.order.invoiceNumber}. Total paid: ${money(
          payment.order.totalAmount
        )}.`,
      });
    } catch (emailError) {
      console.error("PAYSTACK_WEBHOOK_CONFIRMATION_EMAIL_ERROR", emailError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PAYSTACK_WEBHOOK_ERROR", error);
    return NextResponse.json({ ok: true });
  }
}