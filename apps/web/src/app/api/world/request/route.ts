import { NextResponse } from "next/server";

import { createWorldRequest, isCanonicalWorldAddress } from "../../../../lib/world/human-check";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_request" }, { status: 400 }); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { address } = body as { address?: unknown };
  if (!isCanonicalWorldAddress(address)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const created = createWorldRequest(address, process.env);
  return created === null
    ? NextResponse.json({ error: "world_not_configured" }, { status: 503 })
    : NextResponse.json(created, { headers: { "cache-control": "no-store" } });
}
