import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rateLimit";

type Body = {
  orderId?: string;
  phone?: string;
};

function getMpesaTimestamp() {
  const date = new Date();

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");

  return `${y}${m}${d}${h}${min}${s}`;
}

function normalizeKenyaPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10)
    return `254${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;
  if (digits.startsWith("1") && digits.length === 9) return `254${digits}`;

  return "";
}

async function getAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const baseUrl =
    process.env.MPESA_BASE_URL || "https://sandbox.safaricom.co.ke";

  if (!key || !secret) {
    throw new Error("M-Pesa consumer key/secret is missing.");
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const response = await fetch(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error("Unable to get M-Pesa access token.");
  }

  return data.access_token as string;
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
      key: `mpesa:${ip}`,
      limit: 5,
      windowMs: 60 * 1000, // 1 minute
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
    const phone = normalizeKenyaPhone(body.phone || "");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Enter a valid Safaricom phone number." },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
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

    // ✅ PREVENT MULTIPLE STK REQUESTS
    const existingPendingPayment = await db.payment.findFirst({
      where: {
        orderId: order.id,
        provider: "MPESA",
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
            "A payment request is already pending. Please check your phone or wait before trying again.",
        },
        { status: 400 }
      );
    }

    const amount = Math.round(Number(order.totalAmount));

    if (!Number.isFinite(amount) || amount < 1) {
      return NextResponse.json(
        { error: "Invalid order amount." },
        { status: 400 }
      );
    }

    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;
    const baseUrl =
      process.env.MPESA_BASE_URL || "https://sandbox.safaricom.co.ke";

    if (!shortcode || !passkey || !callbackUrl) {
      return NextResponse.json(
        { error: "M-Pesa environment variables are not fully configured." },
        { status: 500 }
      );
    }

    const timestamp = getMpesaTimestamp();
    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`
    ).toString("base64");

    const accessToken = await getAccessToken();

    const stkResponse = await fetch(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: phone,
          PartyB: shortcode,
          PhoneNumber: phone,
          CallBackURL: callbackUrl,
          AccountReference: order.invoiceNumber,
          TransactionDesc: `STN Commerce ${order.invoiceNumber}`,
        }),
      }
    );

    const stkData = await stkResponse.json();

    if (!stkResponse.ok || stkData.ResponseCode !== "0") {
      await db.payment.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          provider: "MPESA",
          method: "MPESA",
          status: "FAILED",
          amount: order.totalAmount,
          currency: "KES",
          phone,
          failureReason:
            stkData.errorMessage ||
            stkData.ResponseDescription ||
            "M-Pesa STK push failed.",
          rawResponse: stkData,
        },
      });

      return NextResponse.json(
        {
          error:
            stkData.errorMessage ||
            stkData.ResponseDescription ||
            "M-Pesa STK push failed.",
        },
        { status: 400 }
      );
    }

    await db.payment.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        provider: "MPESA",
        method: "MPESA",
        status: "PENDING",
        amount: order.totalAmount,
        currency: "KES",
        phone,
        merchantRequestId: stkData.MerchantRequestID,
        checkoutRequestId: stkData.CheckoutRequestID,
        rawResponse: stkData,
      },
    });

    await db.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: "MPESA",
        paymentStatus: "PENDING",
      },
    });

    return NextResponse.json({
      message: "M-Pesa request sent. Check your phone to enter PIN.",
    });
  } catch (error) {
    console.error("MPESA_STK_ERROR", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to start M-Pesa payment.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}