import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: Date.now(),
    service: "brandaudit",
    version: "2.1.0",
  });
}
