import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email";
import { orderReceiptEmailTemplate } from "@/lib/emailTemplates";
import { assessPaymentRisk } from "@/lib/payments/risk";
import {
  createAdminNotification,
  createUserNotification,
} from "@/lib/notifications";

type CheckoutItem = {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
};

type CheckoutBody = {
  items?: CheckoutItem[];
  deliveryAddress?: string;
  deliveryCounty?: string;
  pickupStation?: string;
  paymentMethod?: "CASH" | "MPESA" | "CARD" | "PAYPAL";
  cardholderName?: string;
  promoCode?: string;
};

const HIGH_VALUE_ORDER_LIMIT = 20000;
const ADMIN_REVIEW_ORDER_LIMIT = 50000;

const pickupStations = [
  { county: "Nairobi", station: "G4S Nairobi CBD Pickup Station", deliveryFee: 0 },
  { county: "Kiambu", station: "G4S Thika Pickup Station", deliveryFee: 250 },
  { county: "Nakuru", station: "G4S Nakuru Pickup Station", deliveryFee: 350 },
  { county: "Kisii", station: "G4S Kisii Pickup Station", deliveryFee: 400 },
  { county: "Nyamira", station: "G4S Keroka Pickup Station", deliveryFee: 400 },
  { county: "Mombasa", station: "G4S Mombasa Pickup Station", deliveryFee: 400 },
];

function money(value: unknown) {
  return `KES ${Number(value ?? 0).toLocaleString()}`;
}

function createInvoiceNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `STN-ORD-${y}${m}${d}-${random}`;
}

function cleanOption(value: unknown) {
  return String(value || "").trim().slice(0, 50);
}

function calculatePromoDiscount({
  subtotal,
  discountType,
  discountValue,
  maxDiscount,
}: {
  subtotal: number;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  maxDiscount?: number | null;
}) {
  let discount =
    discountType === "PERCENT"
      ? (subtotal * discountValue) / 100
      : discountValue;

  if (maxDiscount !== null && maxDiscount !== undefined) {
    discount = Math.min(discount, maxDiscount);
  }

  return Math.max(0, Math.min(discount, subtotal));
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session) {
      return NextResponse.json(
        { error: "Please sign in before checking out." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CheckoutBody;

    const items = body.items || [];
    const deliveryAddress = body.deliveryAddress?.trim() || "";
    const deliveryCounty = body.deliveryCounty?.trim() || "";
    const pickupStation = body.pickupStation?.trim() || "";
    const paymentMethod = body.paymentMethod || "CASH";
    const cardholderName = body.cardholderName?.trim() || "";
    const promoCode =
      body.promoCode?.trim().toUpperCase().replace(/\s+/g, "") || "";

    if (paymentMethod === "PAYPAL") {
      return NextResponse.json(
        { error: "PayPal is not active yet. Use M-Pesa or Card." },
        { status: 400 }
      );
    }

    if (!items.length) {
      return NextResponse.json(
        { error: "Your basket is empty." },
        { status: 400 }
      );
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        { error: "Delivery address is required." },
        { status: 400 }
      );
    }

    if (!deliveryCounty || !pickupStation) {
      return NextResponse.json(
        { error: "Select a supported G4S pickup station." },
        { status: 400 }
      );
    }

    if (!["CASH", "MPESA", "CARD", "PAYPAL"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method." },
        { status: 400 }
      );
    }

    const station = pickupStations.find(
      (item) => item.county === deliveryCounty && item.station === pickupStation
    );

    if (!station) {
      return NextResponse.json(
        {
          error:
            "We do not currently have a supported pickup station for this location.",
        },
        { status: 400 }
      );
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const cleanedItems = items.map((item) => ({
      productId: String(item.productId || "").trim(),
      quantity: Number(item.quantity),
      size: cleanOption(item.size),
      color: cleanOption(item.color),
    }));

    for (const item of cleanedItems) {
      if (
        !item.productId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return NextResponse.json(
          { error: "One or more basket items are invalid." },
          { status: 400 }
        );
      }
    }

    const uniqueIds = Array.from(
      new Set(cleanedItems.map((item) => item.productId))
    );

    const order = await db.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: uniqueIds },
          status: "ACTIVE",
        },
      });

      if (products.length !== uniqueIds.length) {
        throw new Error("Some products are no longer available.");
      }

      for (const item of cleanedItems) {
        const product = products.find((p) => p.id === item.productId);

        if (!product) throw new Error("Product not found.");

        if (product.stock < item.quantity) {
          throw new Error(
            `${product.name} has only ${product.stock} item(s) left.`
          );
        }

        const productSizes = Array.isArray(product.sizes) ? product.sizes : [];
        const productColors = Array.isArray(product.colors)
          ? product.colors
          : [];

        if (productSizes.length > 0 && !item.size) {
          throw new Error(`Choose a size for ${product.name}.`);
        }

        if (productColors.length > 0 && !item.color) {
          throw new Error(`Choose a color for ${product.name}.`);
        }

        if (
          item.size &&
          productSizes.length > 0 &&
          !productSizes.includes(item.size)
        ) {
          throw new Error(`Invalid size selected for ${product.name}.`);
        }

        if (
          item.color &&
          productColors.length > 0 &&
          !productColors.includes(item.color)
        ) {
          throw new Error(`Invalid color selected for ${product.name}.`);
        }
      }

      const orderItems = cleanedItems.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        const price = Number(product.price);
        const lineTotal = price * item.quantity;

        return {
          product,
          quantity: item.quantity,
          price,
          lineTotal,
          size: item.size || null,
          color: item.color || null,
        };
      });

      const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const deliveryFee = station.deliveryFee;

      let discountAmount = 0;
      let appliedPromoCode: string | null = null;

      if (promoCode) {
        const promo = await tx.promoCode.findUnique({
          where: { code: promoCode },
        });

        if (!promo || !promo.isActive) {
          throw new Error("Invalid or inactive promo code.");
        }

        const now = new Date();

        if (promo.startsAt && promo.startsAt > now) {
          throw new Error("This promo code is not active yet.");
        }

        if (promo.endsAt && promo.endsAt < now) {
          throw new Error("This promo code has expired.");
        }

        if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
          throw new Error("This promo code has reached its usage limit.");
        }

        if (
          promo.minOrderValue !== null &&
          subtotal < Number(promo.minOrderValue)
        ) {
          throw new Error(
            `Minimum order value for this promo is KES ${Number(
              promo.minOrderValue
            ).toLocaleString()}.`
          );
        }

        discountAmount = calculatePromoDiscount({
          subtotal,
          discountType: promo.discountType,
          discountValue: Number(promo.discountValue),
          maxDiscount:
            promo.maxDiscount === null ? null : Number(promo.maxDiscount),
        });

        appliedPromoCode = promo.code;

        await tx.promoCode.update({
          where: { id: promo.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);

      if (totalAmount >= HIGH_VALUE_ORDER_LIMIT && paymentMethod === "CASH") {
        throw new Error(
          "Orders of KES 20,000 and above must be prepaid using M-Pesa or Card."
        );
      }

      if (totalAmount >= ADMIN_REVIEW_ORDER_LIMIT) {
        throw new Error(
          "Orders above KES 50,000 require admin review before proceeding."
        );
      }

      const accountName =
        [currentUser.firstName, currentUser.lastName]
          .filter(Boolean)
          .join(" ") || "Customer";

      const risk = assessPaymentRisk({
        amount: totalAmount,
        paymentMethod,
        accountName,
        cardholderName,
      });

      if (!risk.allow) {
        throw new Error(risk.reasons[0] || "Payment method not allowed.");
      }

      const riskStatus = risk.requiresReview ? "REVIEW_REQUIRED" : "CLEAR";
      const riskReason = risk.reasons.length ? risk.reasons.join(" | ") : null;

      const invoiceNumber = createInvoiceNumber();

      return tx.order.create({
        data: {
          userId: session.userId,
          invoiceNumber,
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod,
          subtotal,
          deliveryFee,
          discountAmount,
          totalAmount,
          promoCode: appliedPromoCode,
          totalItems,
          stockReduced: false,
          riskStatus,
          riskReason,
          deliveryArea: station.station,
          deliveryAddress: `${deliveryAddress} — ${deliveryCounty}`,
          items: {
            create: orderItems.map((item) => ({
              productId: item.product.id,
              name: item.product.name,
              price: item.price,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
              size: item.size,
              color: item.color,
            })),
          },
        },
        include: {
          items: true,
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    await createAdminNotification({
      type: "ORDER",
      title: "New order placed",
      message: `Order ${order.invoiceNumber} was created.`,
      link: "/admin/orders",
    });

    await createUserNotification({
      userId: session.userId,
      type: "ORDER",
      title: "Order placed",
      message: `Your order ${order.invoiceNumber} was placed successfully.`,
      link: `/orders/${order.id}`,
    });

    if (order.riskStatus === "REVIEW_REQUIRED") {
      await createAdminNotification({
        type: "RISK",
        title: "Order requires review",
        message: `Order ${order.invoiceNumber} was flagged for review.`,
        link: "/admin/orders",
      });
    }

    try {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const customerName =
        [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") ||
        "Customer";

      await sendEmail({
        to: order.user.email,
        subject: `STN Commerce receipt - ${order.invoiceNumber}`,
        html: orderReceiptEmailTemplate({
          name: customerName,
          invoiceNumber: order.invoiceNumber,
          orderUrl: `${appUrl}/orders/${order.id}`,
          total: money(order.totalAmount),
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
        }),
        text: `Your STN Commerce order ${order.invoiceNumber} was received. Total: ${money(
          order.totalAmount
        )}.`,
      });
    } catch (emailError) {
      console.error("ORDER_RECEIPT_EMAIL_ERROR", emailError);
    }

    return NextResponse.json({
      message: "Order created successfully.",
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      promoCode: order.promoCode,
      riskStatus: order.riskStatus,
      riskReason: order.riskReason,
    });
  } catch (error) {
    console.error("CUSTOMER_CHECKOUT_ERROR", error);

    const message = error instanceof Error ? error.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}