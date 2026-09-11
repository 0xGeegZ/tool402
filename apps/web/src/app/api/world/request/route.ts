import { NextResponse } from "next/server";
import { createWorldRequest, isCanonicalWorldAddress } from "../../../../lib/world/issuer-selfie-check";

export async function POST(request: Request) {
  let body: { address?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_request" }, { status: 400 }); }
  if (!isCanonicalWorldAddress(body.address)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const result = createWorldRequest(body.address, process.env);
  return result ? NextResponse.json(result, { headers: { "cache-control": "no-store" } }) : NextResponse.json({ error: "world_not_configured" }, { status: 503 });
}
