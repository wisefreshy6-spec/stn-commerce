import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Body = {
  code?: string;
  subtotal?: string | number;
};

function calculateDiscount({
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
    const body = (await request.json()) as Body;

    const code = String(body.code || "").trim().toUpperCase().replace(/\s+/g, "");
    const subtotal = Number(body.subtotal || 0);

    if (!code) {
      return NextResponse.json({ error: "Promo code is required." }, { status: 400 });
    }

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json({ error: "Invalid order subtotal." }, { status: 400 });
    }

    const promo = await db.promoCode.findUnique({
      where: { code },
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json({ error: "Invalid or inactive promo code." }, { status: 404 });
    }

    const now = new Date();

    if (promo.startsAt && promo.startsAt > now) {
      return NextResponse.json({ error: "This promo code is not active yet." }, { status: 400 });
    }

    if (promo.endsAt && promo.endsAt < now) {
      return NextResponse.json({ error: "This promo code has expired." }, { status: 400 });
    }

    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return NextResponse.json({ error: "This promo code has reached its usage limit." }, { status: 400 });
    }

    if (promo.minOrderValue !== null && subtotal < Number(promo.minOrderValue)) {
      return NextResponse.json(
        {
          error: `Minimum order value for this promo is KES ${Number(
            promo.minOrderValue
          ).toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    const discountAmount = calculateDiscount({
      subtotal,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      maxDiscount: promo.maxDiscount === null ? null : Number(promo.maxDiscount),
    });

    return NextResponse.json({
      message: "Promo code applied.",
      promo: {
        code: promo.code,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
      },
      discountAmount,
    });
  } catch (error) {
    console.error("PUBLIC_PROMO_VALIDATE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to validate promo code." },
      { status: 500 }
    );
  }
}