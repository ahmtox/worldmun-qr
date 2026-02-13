import { NextRequest, NextResponse } from "next/server";
import { lookupAndIncrement } from "@/lib/sheets";
import { EVENT_NAMES, EventName, ScanErrorResponse, ScanSuccessResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, event } = body as { uid?: string; event?: string };

    console.log("[scan] Received:", { uid, event });

    if (!uid || typeof uid !== "string" || uid.trim().length === 0) {
      console.log("[scan] Invalid UID");
      return NextResponse.json<ScanErrorResponse>(
        { success: false, error: "Invalid UID" },
        { status: 400 }
      );
    }

    if (!event || !EVENT_NAMES.includes(event as EventName)) {
      console.log("[scan] Invalid event:", event);
      return NextResponse.json<ScanErrorResponse>(
        { success: false, error: "Invalid event" },
        { status: 400 }
      );
    }

    console.log("[scan] Looking up UID:", uid.trim(), "for event:", event);
    const result = await lookupAndIncrement(uid.trim(), event as EventName);
    console.log("[scan] Success:", result);

    return NextResponse.json<ScanSuccessResponse>({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    console.error("[scan] Error:", message);
    if (error instanceof Error && error.stack) {
      console.error("[scan] Stack:", error.stack);
    }

    let status = 500;
    if (message === "UID not found") status = 404;
    if (message === "Not eligible for this event") status = 403;

    return NextResponse.json<ScanErrorResponse>(
      { success: false, error: message },
      { status }
    );
  }
}
