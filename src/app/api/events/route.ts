import { NextResponse } from "next/server";
import { getEventColumns } from "@/lib/sheets";

export async function GET() {
  try {
    const events = await getEventColumns();
    console.log("[events] Loaded event columns:", events);
    return NextResponse.json({ events });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load events";
    console.error("[events] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
