import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{
    bannerId: string;
  }>;
};

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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { bannerId } = await context.params;
    const body = (await request.json()) as BannerBody;

    const banner = await db.siteBanner.update({
      where: { id: bannerId },
      data: {
        title: body.title === undefined ? undefined : clean(body.title, 120),
        message: body.message === undefined ? undefined : clean(body.message, 500),
        imageUrl:
          body.imageUrl === undefined ? undefined : clean(body.imageUrl, 800) || null,
        linkUrl:
          body.linkUrl === undefined ? undefined : clean(body.linkUrl, 800) || null,
        buttonText:
          body.buttonText === undefined
            ? undefined
            : clean(body.buttonText, 80) || null,
        placement:
          body.placement === undefined
            ? undefined
            : clean(body.placement || "HOME", 40).toUpperCase(),
        isActive: body.isActive,
        startsAt: body.startsAt === undefined ? undefined : parseDate(body.startsAt),
        endsAt: body.endsAt === undefined ? undefined : parseDate(body.endsAt),
      },
    });

    return NextResponse.json({
      message: "Banner updated successfully.",
      banner,
    });
  } catch (error) {
    console.error("ADMIN_BANNER_PATCH_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update banner." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { bannerId } = await context.params;

    await db.siteBanner.delete({
      where: { id: bannerId },
    });

    return NextResponse.json({
      message: "Banner deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN_BANNER_DELETE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to delete banner." },
      { status: 500 }
    );
  }
}