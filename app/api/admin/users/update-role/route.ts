import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, role } = body;

  const cookieStore = await cookies();
  const session = parseSessionValue(
    cookieStore.get(SESSION_COOKIE_NAME)?.value || ""
  );

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json({ success: true });
}