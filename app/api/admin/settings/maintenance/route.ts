import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

async function getSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return rawSession ? parseSessionValue(rawSession) : null;
}

export async function GET() {
  try {
    const setting = await db.siteSetting.findUnique({
      where: { key: "maintenance_mode" },
    });

    return NextResponse.json({
      enabled: setting?.value === "true",
    });
  } catch (error) {
    console.error("MAINTENANCE_GET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load maintenance setting." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as { enabled?: boolean };
    const enabled = Boolean(body.enabled);

    const setting = await db.siteSetting.upsert({
      where: { key: "maintenance_mode" },
      update: {
        value: enabled ? "true" : "false",
      },
      create: {
        key: "maintenance_mode",
        value: enabled ? "true" : "false",
      },
    });

    return NextResponse.json({
      message: enabled
        ? "Maintenance mode enabled."
        : "Maintenance mode disabled.",
      enabled: setting.value === "true",
    });
  } catch (error) {
    console.error("MAINTENANCE_PATCH_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update maintenance setting." },
      { status: 500 }
    );
  }
}