import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, v: "2.2.0" });
}
