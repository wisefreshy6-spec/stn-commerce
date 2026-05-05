import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type PromoBody = {
  code?: string;
  description?: string;
  discountType?: "PERCENT" | "FIXED";
  discountValue?: string | number;
  minOrderValue?: string | number;
  maxDiscount?: string | number;
  usageLimit?: string | number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
};

async function getSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return rawSession ? parseSessionValue(rawSession) : null;
}

function clean(value: unknown, max = 200) {
  return String(value || "").trim().slice(0, max);
}

function parseOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;

  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

function parseDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const promos = await db.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ promos });
  } catch (error) {
    console.error("ADMIN_PROMOS_GET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load promo codes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as PromoBody;

    const code = clean(body.code, 40).toUpperCase().replace(/\s+/g, "");
    const description = clean(body.description, 200);
    const discountType = body.discountType || "PERCENT";
    const discountValue = Number(body.discountValue || 0);
    const minOrderValue = parseOptionalNumber(body.minOrderValue);
    const maxDiscount = parseOptionalNumber(body.maxDiscount);
    const usageLimitRaw = parseOptionalNumber(body.usageLimit);
    const startsAt = parseDate(body.startsAt);
    const endsAt = parseDate(body.endsAt);

    if (!code) {
      return NextResponse.json(
        { error: "Promo code is required." },
        { status: 400 }
      );
    }

    if (code.length < 3) {
      return NextResponse.json(
        { error: "Promo code must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (!["PERCENT", "FIXED"].includes(discountType)) {
      return NextResponse.json(
        { error: "Invalid discount type." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json(
        { error: "Discount value must be greater than zero." },
        { status: 400 }
      );
    }

    if (discountType === "PERCENT" && discountValue > 90) {
      return NextResponse.json(
        { error: "Percent discount cannot exceed 90." },
        { status: 400 }
      );
    }

    if (
      usageLimitRaw !== null &&
      (!Number.isInteger(usageLimitRaw) || usageLimitRaw < 1)
    ) {
      return NextResponse.json(
        { error: "Usage limit must be a whole number above 0." },
        { status: 400 }
      );
    }

    if (startsAt && endsAt && endsAt < startsAt) {
      return NextResponse.json(
        { error: "End date cannot be before start date." },
        { status: 400 }
      );
    }

    const existing = await db.promoCode.findUnique({
      where: { code },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Promo code already exists." },
        { status: 409 }
      );
    }

    const promo = await db.promoCode.create({
      data: {
        code,
        description: description || null,
        discountType,
        discountValue,
        minOrderValue,
        maxDiscount,
        usageLimit: usageLimitRaw ? Math.floor(usageLimitRaw) : null,
        isActive: body.isActive ?? true,
        startsAt,
        endsAt,
      },
    });

    return NextResponse.json({
      message: "Promo code created successfully.",
      promo,
    });
  } catch (error) {
    console.error("ADMIN_PROMOS_POST_ERROR", error);

    return NextResponse.json(
      { error: "Unable to create promo code." },
      { status: 500 }
    );
  }
}