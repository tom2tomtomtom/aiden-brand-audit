import { NextResponse } from "next/server";

// Minimal public health endpoint. Consumed by Railway healthcheck + any
// uptime monitor. Intentionally does NOT return git SHA, version, service
// name, or timestamp — those enable fingerprinting with no operational
// benefit. For detailed ops state, check Railway logs or Sentry.
export async function GET() {
  return NextResponse.json({ ok: true });
}
