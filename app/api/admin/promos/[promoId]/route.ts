import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ promoId: string }>;
};

type UpdateBody = {
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

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { promoId } = await context.params;
    const body = (await request.json()) as UpdateBody;

    const existing = await db.promoCode.findUnique({
      where: { id: promoId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Promo not found." }, { status: 404 });
    }

    const discountType = body.discountType ?? existing.discountType;
    const discountValue =
      body.discountValue !== undefined
        ? Number(body.discountValue)
        : Number(existing.discountValue);

    const minOrderValue =
      body.minOrderValue !== undefined
        ? parseOptionalNumber(body.minOrderValue)
        : existing.minOrderValue;

    const maxDiscount =
      body.maxDiscount !== undefined
        ? parseOptionalNumber(body.maxDiscount)
        : existing.maxDiscount;

    const usageLimit =
      body.usageLimit !== undefined
        ? parseOptionalNumber(body.usageLimit)
        : existing.usageLimit;

    if (!["PERCENT", "FIXED"].includes(discountType)) {
      return NextResponse.json(
        { error: "Invalid discount type." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json(
        { error: "Discount must be greater than zero." },
        { status: 400 }
      );
    }

    if (discountType === "PERCENT" && discountValue > 100) {
      return NextResponse.json(
        { error: "Percent discount cannot exceed 100." },
        { status: 400 }
      );
    }

    const updated = await db.promoCode.update({
      where: { id: promoId },
      data: {
        description:
          body.description !== undefined
            ? clean(body.description, 200) || null
            : existing.description,
        discountType,
        discountValue,
        minOrderValue,
        maxDiscount,
        usageLimit:
          usageLimit === null || usageLimit === undefined
            ? null
            : Math.floor(Number(usageLimit)),
        isActive: body.isActive ?? existing.isActive,
        startsAt:
          body.startsAt !== undefined
            ? parseDate(body.startsAt)
            : existing.startsAt,
        endsAt:
          body.endsAt !== undefined ? parseDate(body.endsAt) : existing.endsAt,
      },
    });

    return NextResponse.json({
      message: "Promo updated successfully.",
      promo: updated,
    });
  } catch (error) {
    console.error("ADMIN_PROMO_PATCH_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update promo." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { promoId } = await context.params;

    await db.promoCode.delete({
      where: { id: promoId },
    });

    return NextResponse.json({
      message: "Promo deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN_PROMO_DELETE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to delete promo." },
      { status: 500 }
    );
  }
}