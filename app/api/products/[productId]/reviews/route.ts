import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

type ReviewBody = {
  rating?: number;
  comment?: string;
};

async function getSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return rawSession ? parseSessionValue(rawSession) : null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { productId } = await context.params;

    const reviews = await db.productReview.findMany({
      where: {
        productId,
        isApproved: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      averageRating,
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error("PRODUCT_REVIEWS_GET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load reviews." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Please sign in to review this product." },
        { status: 401 }
      );
    }

    const { productId } = await context.params;
    const body = (await request.json()) as ReviewBody;

    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim().slice(0, 800);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    const purchased = await db.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.userId,
          paymentStatus: "PAID",
          status: {
            in: ["PROCESSING", "AWAITING_DELIVERY", "DELIVERED"],
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!purchased) {
      return NextResponse.json(
        { error: "Only verified buyers can review this product." },
        { status: 403 }
      );
    }

    const review = await db.productReview.upsert({
      where: {
        productId_userId: {
          productId,
          userId: session.userId,
        },
      },
      update: {
        rating,
        comment: comment || null,
        isApproved: true,
        verified: true,
      },
      create: {
        productId,
        userId: session.userId,
        rating,
        comment: comment || null,
        isApproved: true,
        verified: true,
      },
    });

    return NextResponse.json({
      message: "Review saved successfully.",
      review,
    });
  } catch (error) {
    console.error("PRODUCT_REVIEW_POST_ERROR", error);

    return NextResponse.json(
      { error: "Unable to save review." },
      { status: 500 }
    );
  }
}