import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type UpdateDataRequestBody = {
  requestId?: string;
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  notes?: string;
};

export async function PATCH(request: Request) {
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

    if (session.role !== "ADMIN" && session.role !== "SUPPORT") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as UpdateDataRequestBody;

    const requestId = body.requestId?.trim() ?? "";
    const status = body.status;
    const notes = body.notes?.trim() ?? "";

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required." },
        { status: 400 }
      );
    }

    if (
      !status ||
      !["PENDING", "PROCESSING", "COMPLETED", "REJECTED"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Valid status is required." },
        { status: 400 }
      );
    }

    const updatedRequest = await db.dataRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      message: "Data request updated successfully.",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("UPDATE_DATA_REQUEST_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update data request." },
      { status: 500 }
    );
  }
}