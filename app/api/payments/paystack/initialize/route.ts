import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rateLimit";

type Body = {
  orderId?: string;
};

function createReference(orderId: string) {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `STN-CARD-${orderId}-${random}`;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session) {
      return NextResponse.json(
        { error: "Please sign in before paying." },
        { status: 401 }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const limiter = rateLimit({
      key: `card:${ip}`,
      limit: 5,
      windowMs: 60 * 1000,
    });

    if (!limiter.success) {
      return NextResponse.json(
        {
          error: `Too many payment attempts. Try again in ${limiter.retryAfter}s.`,
        },
        { status: 429 }
       );
    }

    const body = (await request.json()) as Body;
    const orderId = body.orderId?.trim() || "";

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    if (!secretKey) {
      return NextResponse.json(
        { error: "Paystack secret key is not configured." },
        { status: 500 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.userId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending orders can be paid." },
        { status: 400 }
      );
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "This order is already paid." },
        { status: 400 }
      );
    }

    const existingPendingPayment = await db.payment.findFirst({
      where: {
        orderId: order.id,
        provider: "CARD",
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingPendingPayment) {
      return NextResponse.json(
        {
          error:
            "A card payment attempt is already pending for this order. Please wait or refresh your order status before trying again.",
        },
        { status: 400 }
      );
    }

    const amountKes = Number(order.totalAmount);

    if (!Number.isFinite(amountKes) || amountKes < 1) {
      return NextResponse.json(
        { error: "Invalid order amount." },
        { status: 400 }
      );
    }

    const reference = createReference(order.id);
    const amountSubunit = Math.round(amountKes * 100);

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: order.user.email,
          amount: amountSubunit,
          currency: "KES",
          reference,
          callback_url: `${appUrl}/payments/paystack/callback?reference=${reference}`,
          channels: ["card"],
          metadata: {
            orderId: order.id,
            invoiceNumber: order.invoiceNumber,
            customerName: [order.user.firstName, order.user.lastName]
              .filter(Boolean)
              .join(" "),
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status || !data.data?.authorization_url) {
      await db.payment.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          provider: "CARD",
          method: "CARD",
          status: "FAILED",
          amount: order.totalAmount,
          currency: "KES",
          transactionId: reference,
          failureReason: data.message || "Unable to initialize Paystack.",
          rawResponse: data,
        },
      });

      return NextResponse.json(
        { error: data.message || "Unable to initialize card payment." },
        { status: 400 }
      );
    }

    await db.payment.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        provider: "CARD",
        method: "CARD",
        status: "PENDING",
        amount: order.totalAmount,
        currency: "KES",
        transactionId: reference,
        rawResponse: data,
      },
    });

    await db.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: "CARD",
        paymentStatus: "PENDING",
      },
    });

    return NextResponse.json({
      message: "Card payment initialized.",
      authorizationUrl: data.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error("PAYSTACK_INITIALIZE_ERROR", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to initialize card payment.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}