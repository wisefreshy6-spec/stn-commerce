import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { paymentConfirmedEmailTemplate } from "@/lib/emailTemplates";
import {
  createAdminNotification,
  createUserNotification,
} from "@/lib/notifications";

type MpesaCallbackItem = {
  Name: string;
  Value?: string | number;
};

function getCallbackValue(items: MpesaCallbackItem[] | undefined, name: string) {
  return items?.find((item) => item.Name === name)?.Value;
}

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
        stock: { decrement: item.quantity },
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
    data: { stockReduced: true },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ ok: true });
    }

    const checkoutRequestId = String(callback.CheckoutRequestID || "");
    const merchantRequestId = String(callback.MerchantRequestID || "");
    const resultCode = Number(callback.ResultCode);
    const resultDescription = String(callback.ResultDesc || "");

    const metadataItems = callback.CallbackMetadata?.Item as
      | MpesaCallbackItem[]
      | undefined;

    const amount = getCallbackValue(metadataItems, "Amount");
    const mpesaReceiptNumber = getCallbackValue(
      metadataItems,
      "MpesaReceiptNumber"
    );
    const transactionDate = getCallbackValue(metadataItems, "TransactionDate");
    const phoneNumber = getCallbackValue(metadataItems, "PhoneNumber");

    const payment = await db.payment.findFirst({
      where: {
        checkoutRequestId,
        provider: "MPESA",
      },
      orderBy: { createdAt: "desc" },
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
      console.error("MPESA_CALLBACK_PAYMENT_NOT_FOUND", {
        checkoutRequestId,
        merchantRequestId,
        resultCode,
      });

      return NextResponse.json({ ok: true });
    }

    if (resultCode === 0) {
      await db.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            transactionId: mpesaReceiptNumber
              ? String(mpesaReceiptNumber)
              : payment.transactionId,
            merchantRequestId: merchantRequestId || payment.merchantRequestId,
            amount: amount ? Number(amount) : payment.amount,
            phone: phoneNumber ? String(phoneNumber) : payment.phone,
            rawResponse: body,
            paidAt: transactionDate
              ? new Date(
                  String(transactionDate).replace(
                    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
                    "$1-$2-$3T$4:$5:$6"
                  )
                )
              : new Date(),
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "PAID",
            paymentMethod: "MPESA",
            status: "PROCESSING",
          },
        });
      });

      await reduceStockIfNeeded(payment.orderId);
      await createAdminNotification({
        type: "PAYMENT",
        title: "M-Pesa payment received",
        message: `Payment confirmed for ${payment.order.invoiceNumber}`,
        link: "/admin/orders",
      });

await createAdminNotification({
  type: "PAYMENT",
  title: "Payment received",
  message: `Payment confirmed for ${payment.order.invoiceNumber}.`,
  link: "/admin/orders",
});

await createUserNotification({
  userId: payment.order.userId,
  type: "PAYMENT",
  title: "Payment successful",
  message: `Payment confirmed for ${payment.order.invoiceNumber}.`,
  link: `/orders/${payment.orderId}`,
});

      // ✅ SEND EMAIL
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
        console.error("MPESA_CONFIRMATION_EMAIL_ERROR", emailError);
      }
    } else {
      await db.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            failureReason: resultDescription || "M-Pesa payment failed.",
            rawResponse: body,
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "FAILED",
          },
        });
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("MPESA_CALLBACK_ERROR", error);
    return NextResponse.json({ ok: true });
  }
}