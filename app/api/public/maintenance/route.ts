import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const setting = await db.siteSetting.findUnique({
      where: { key: "maintenance_mode" },
    });

    return NextResponse.json({
      enabled: setting?.value === "true",
    });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}