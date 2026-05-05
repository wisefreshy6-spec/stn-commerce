import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const reviews = await db.productReview.findMany({
      orderBy: [
        { isApproved: "asc" },
        { createdAt: "desc" },
     ],
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("ADMIN_REVIEWS_LOAD_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load reviews." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { reviewId, action } = body;

    if (!reviewId || !["APPROVE", "HIDE", "DELETE"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid review action." },
        { status: 400 }
      );
    }

    if (action === "DELETE") {
      await db.productReview.delete({
        where: { id: reviewId },
      });

      return NextResponse.json({ message: "Review deleted." });
    }

    const review = await db.productReview.update({
      where: { id: reviewId },
      data: {
        isApproved: action === "APPROVE",
      },
    });

    return NextResponse.json({
      review,
      message: action === "APPROVE" ? "Review approved." : "Review hidden.",
    });
  } catch (error) {
    console.error("ADMIN_REVIEWS_ACTION_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update review." },
      { status: 500 }
    );
  }
}