import { NextResponse } from "next/server";

import { createWorldRequest, readWorldRequestContext } from "../../../../lib/world/human-check";

export async function POST(request: Request) {
  const context = await readWorldRequestContext(request, process.env);
  if (context.kind === "unauthorized") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (context.kind === "invalid") return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const created = createWorldRequest(context.address, process.env);
  return created === null
    ? NextResponse.json({ error: "world_not_configured" }, { status: 503 })
    : NextResponse.json(created, { headers: { "cache-control": "no-store" } });
}
