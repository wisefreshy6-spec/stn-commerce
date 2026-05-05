import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type BannerBody = {
  title?: string;
  message?: string;
  imageUrl?: string;
  linkUrl?: string;
  buttonText?: string;
  placement?: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
};

async function getSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return rawSession ? parseSessionValue(rawSession) : null;
}

function clean(value: unknown, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const banners = await db.siteBanner.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("ADMIN_BANNERS_GET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load banners." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as BannerBody;

    const title = clean(body.title, 120);
    const message = clean(body.message, 500);
    const imageUrl = clean(body.imageUrl, 800);
    const linkUrl = clean(body.linkUrl, 800);
    const buttonText = clean(body.buttonText, 80);
    const placement = clean(body.placement || "HOME", 40).toUpperCase();

    if (!title) {
      return NextResponse.json({ error: "Banner title is required." }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: "Banner message is required." }, { status: 400 });
    }

    const banner = await db.siteBanner.create({
      data: {
        title,
        message,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        buttonText: buttonText || null,
        placement,
        isActive: body.isActive ?? true,
        startsAt: parseDate(body.startsAt),
        endsAt: parseDate(body.endsAt),
      },
    });

    return NextResponse.json({
      message: "Banner created successfully.",
      banner,
    });
  } catch (error) {
    console.error("ADMIN_BANNERS_POST_ERROR", error);

    return NextResponse.json(
      { error: "Unable to create banner." },
      { status: 500 }
    );
  }
}