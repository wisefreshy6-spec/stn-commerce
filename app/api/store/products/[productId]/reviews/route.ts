import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      productId: string;
    }>;
  }
) {
  try {
    // ✅ FIX: await params
    const { productId } = await context.params;

    const body = await request.json();

    const { userId, rating, title, comment, imageUrl, videoUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Invalid rating." },
        { status: 400 }
      );
    }

    // 🔐 Check purchase eligibility
    const hasPurchased = await db.order.findFirst({
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
    });

    if (!hasPurchased) {
      return NextResponse.json(
        { error: "You can only review products you have received." },
        { status: 403 }
      );
    }

    // 🚫 Check already reviewed
    const existingReview = await db.productReview.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product." },
        { status: 400 }
      );
    }

    // ✅ Create review
    await db.productReview.create({
      data: {
        productId,
        userId,
        rating,
        title,
        comment,
        imageUrl,
        videoUrl,
        verified: true,
        isApproved: false,
      },
    });

    return NextResponse.json({
      message:
        "Thanks, your review was submitted and is awaiting approval.",
    });
  } catch (error) {
    console.error("REVIEW_CREATE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to submit review." },
      { status: 500 }
    );
  }
}