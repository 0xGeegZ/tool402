import { NextResponse } from "next/server";
import { createWorldRequest, isCanonicalWorldAddress } from "../../../../lib/world/issuer-selfie-check";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_request" }, { status: 400 }); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { address } = body as { address?: unknown };
  if (!isCanonicalWorldAddress(address)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const result = createWorldRequest(address, process.env);
  return result ? NextResponse.json(result, { headers: { "cache-control": "no-store" } }) : NextResponse.json({ error: "world_not_configured" }, { status: 503 });
}
