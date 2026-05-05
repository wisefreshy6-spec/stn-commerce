import { db } from "@/lib/db";

export async function createAdminNotification({
  type,
  title,
  message,
  link,
}: {
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await db.notification.create({
      data: { type, title, message, link: link || null, userId: null },
    });
  } catch (error) {
    console.error("CREATE_ADMIN_NOTIFICATION_ERROR", error);
  }
}

export async function createUserNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await db.notification.create({
      data: { userId, type, title, message, link: link || null },
    });
  } catch (error) {
    console.error("CREATE_USER_NOTIFICATION_ERROR", error);
  }
}