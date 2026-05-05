import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = raw ? parseSessionValue(raw) : null;

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const expenses = await db.expense.findMany({
    orderBy: { createdAt: "desc" },
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({ expenses, total });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = raw ? parseSessionValue(raw) : null;

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { title, amount, category } = await req.json();

  const expense = await db.expense.create({
    data: {
      title,
      amount: Number(amount),
      category,
    },
  });

  return NextResponse.json({ expense });
}