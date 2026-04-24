import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type DataRequestBody = {
  requestType?: string;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawSession) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const session = parseSessionValue(rawSession);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as DataRequestBody;
    const requestType = body.requestType?.trim() || "ACCOUNT_DATA_EXPORT";

    const existingPendingRequest = await db.dataRequest.findFirst({
      where: {
        userId: session.userId,
        requestType,
        status: "PENDING",
      },
      select: {
        id: true,
      },
    });

    if (existingPendingRequest) {
      return NextResponse.json(
        {
          error:
            "You already have a pending data request. Please wait for it to be processed.",
        },
        { status: 409 }
      );
    }

    const dataRequest = await db.dataRequest.create({
      data: {
        userId: session.userId,
        requestType,
        status: "PENDING",
        notes:
          "Customer requested a copy/export of their account data from settings.",
      },
      select: {
        id: true,
        requestType: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message:
        "Your account data request has been submitted. Support/admin will process it later.",
      dataRequest,
    });
  } catch (error) {
    console.error("DATA_REQUEST_ERROR", error);

    return NextResponse.json(
      { error: "Unable to submit data request right now." },
      { status: 500 }
    );
  }
}