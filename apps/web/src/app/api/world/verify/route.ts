import { NextResponse } from "next/server";

import {
  createHumanCookie,
  hasExpectedHumanSignal,
  readWorldRequestContext,
  WORLD_HUMAN_COOKIE,
  WORLD_HUMAN_MAX_AGE_SECONDS,
  worldVerificationUrl,
} from "../../../../lib/world/human-check";

function failureCode(body: string): string {
  let parsed: unknown;
  try { parsed = JSON.parse(body); } catch { return "unknown"; }
  if (typeof parsed !== "object" || parsed === null) return "unknown";
  const { results, code } = parsed as { results?: unknown; code?: unknown };
  const first = Array.isArray(results) && typeof results[0] === "object" && results[0] !== null ? (results[0] as { code?: unknown }).code : undefined;
  if (typeof first === "string" && first !== "") return first;
  return typeof code === "string" && code !== "" ? code : "unknown";
}

function isAcceptedByWorld(body: string): boolean {
  let parsed: unknown;
  try { parsed = JSON.parse(body); } catch { return false; }
  return typeof parsed === "object" && parsed !== null && (parsed as { success?: unknown }).success === true;
}

export async function POST(request: Request) {
  const context = await readWorldRequestContext(request, process.env);
  if (context.kind === "unauthorized") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (context.kind === "invalid") return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { address, body } = context;
  const { idkitResponse } = body;
  if (typeof idkitResponse !== "object" || idkitResponse === null || Array.isArray(idkitResponse)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  if (!hasExpectedHumanSignal(idkitResponse, address)) return NextResponse.json({ error: "world_verification_failed" }, { status: 403 });

  const url = worldVerificationUrl(process.env);
  if (url === null) return NextResponse.json({ error: "world_not_configured" }, { status: 503 });

  let verified: Response;
  try {
    verified = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(idkitResponse),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch { return NextResponse.json({ error: "world_unavailable" }, { status: 502 }); }

  const answer = await verified.text();
  if (!verified.ok || !isAcceptedByWorld(answer)) return NextResponse.json({ error: "world_verification_failed", code: failureCode(answer) }, { status: 403 });

  const value = await createHumanCookie(address, process.env);
  if (value === null) return NextResponse.json({ error: "world_not_configured" }, { status: 503 });
  const response = NextResponse.json({ verified: true }, { headers: { "cache-control": "no-store" } });
  response.cookies.set(WORLD_HUMAN_COOKIE, value, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: WORLD_HUMAN_MAX_AGE_SECONDS });
  return response;
}
