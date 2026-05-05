import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      productId: string;
    }>;
  }
) {
  try {
    // ✅ FIX: await params (Next.js 16 requirement)
    const { productId } = await context.params;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({
        canReview: false,
        reason: "SIGN_IN_REQUIRED",
        message: "Sign in to review this product after purchase.",
      });
    }

    const existingReview = await db.productReview.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json({
        canReview: false,
        reason: "ALREADY_REVIEWED",
        message: "You have already reviewed this product.",
      });
    }

    const deliveredOrder = await db.order.findFirst({
      where: {
        userId,
        paymentStatus: "PAID",
        status: "DELIVERED",
        items: {
          some: {
            productId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!deliveredOrder) {
      return NextResponse.json({
        canReview: false,
        reason: "NOT_ELIGIBLE",
        message:
          "You can review this product after a paid order is delivered or picked successfully.",
      });
    }

    return NextResponse.json({
      canReview: true,
      reason: "ELIGIBLE",
      message: "You can review this product.",
    });
  } catch (error) {
    console.error("REVIEW_ELIGIBILITY_ERROR", error);

    return NextResponse.json(
      {
        canReview: false,
        reason: "ERROR",
        message: "Unable to check review eligibility.",
      },
      { status: 500 }
    );
  }
}