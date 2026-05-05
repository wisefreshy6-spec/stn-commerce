import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const { notificationId } = await context.params;

    const notification = await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("ADMIN_NOTIFICATION_PATCH_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update notification." },
      { status: 500 }
    );
  }
}