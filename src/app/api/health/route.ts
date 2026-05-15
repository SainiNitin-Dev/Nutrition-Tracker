import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "nourish-ai",
    timestamp: new Date().toISOString(),
  });
}
