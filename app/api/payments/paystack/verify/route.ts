import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { paymentConfirmedEmailTemplate } from "@/lib/emailTemplates";
import {
  createAdminNotification,
  createUserNotification,
} from "@/lib/notifications";

type Body = {
  reference?: string;
};

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
    data: {
      stockReduced: true,
    },
  });
}

async function markPaymentFailed(
  paymentId: string,
  orderId: string,
  reason: string,
  rawResponse: Prisma.InputJsonValue
) {
  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "FAILED",
        failureReason: reason,
        rawResponse,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "FAILED",
      },
    });
  });
}

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "Paystack secret key is not configured." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as Body;
    const reference = body.reference?.trim() || "";

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Payment record not found." },
        { status: 404 }
      );
    }

    if (payment.status === "PAID" && payment.order.paymentStatus === "PAID") {
      return NextResponse.json({
        message: "Payment already verified.",
        orderId: payment.orderId,
      });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const data = (await response.json()) as Prisma.InputJsonObject;
    const dataObject = data as Record<string, any>;

    if (!response.ok || !dataObject.status) {
      await markPaymentFailed(
        payment.id,
        payment.orderId,
        String(dataObject.message || "Paystack verification failed."),
        data
      );

      return NextResponse.json(
        { error: dataObject.message || "Unable to verify card payment." },
        { status: 400 }
      );
    }

    const paystackStatus = dataObject.data?.status;
    const paidAmount = Number(dataObject.data?.amount || 0) / 100;
    const orderAmount = Number(payment.order.totalAmount);

    if (paystackStatus !== "success") {
      await markPaymentFailed(
        payment.id,
        payment.orderId,
        `Paystack status: ${paystackStatus || "unknown"}`,
        data
      );

      return NextResponse.json(
        { error: "Card payment was not successful." },
        { status: 400 }
      );
    }

    if (Math.round(paidAmount) < Math.round(orderAmount)) {
      await markPaymentFailed(
        payment.id,
        payment.orderId,
        "Paid amount is less than order amount.",
        data
      );

      return NextResponse.json(
        { error: "Paid amount is less than order amount." },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          amount: paidAmount,
          paypalCaptureId: null,
          rawResponse: data,
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

await db.notification.create({
  data: {
    userId: payment.order.userId,
    type: "PAYMENT",
    title: "Payment successful",
    message: `Payment confirmed for ${payment.order.invoiceNumber}`,
    link: `/orders/${payment.orderId}`,
  },
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
      console.error("PAYSTACK_CONFIRMATION_EMAIL_ERROR", emailError);
    }

    return NextResponse.json({
      message: "Card payment verified successfully.",
      orderId: payment.orderId,
    });
  } catch (error) {
    console.error("PAYSTACK_VERIFY_ERROR", error);

    const message =
      error instanceof Error ? error.message : "Unable to verify payment.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}