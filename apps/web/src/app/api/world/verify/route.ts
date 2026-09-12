import { NextResponse } from "next/server";

import {
  createHumanCookie,
  hasExpectedHumanSignal,
  isCanonicalWorldAddress,
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

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_request" }, { status: 400 }); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { address, idkitResponse } = body as { address?: unknown; idkitResponse?: unknown };
  if (!isCanonicalWorldAddress(address) || typeof idkitResponse !== "object" || idkitResponse === null || Array.isArray(idkitResponse)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
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

  if (!verified.ok) return NextResponse.json({ error: "world_verification_failed", code: failureCode(await verified.text()) }, { status: 403 });

  const value = await createHumanCookie(address, process.env);
  if (value === null) return NextResponse.json({ error: "world_not_configured" }, { status: 503 });
  const response = NextResponse.json({ verified: true }, { headers: { "cache-control": "no-store" } });
  response.cookies.set(WORLD_HUMAN_COOKIE, value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: WORLD_HUMAN_MAX_AGE_SECONDS });
  return response;
}
