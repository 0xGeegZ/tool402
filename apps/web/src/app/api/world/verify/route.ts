import { NextResponse } from "next/server";
import { createWorldIssuerCookie, hasExpectedWorldIssuerSignal, isCanonicalWorldAddress, WORLD_ISSUER_COOKIE, WORLD_ISSUER_SESSION_SECONDS, worldVerificationUrl } from "../../../../lib/world/issuer-selfie-check";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_request" }, { status: 400 }); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { address, idkitResponse } = body as { address?: unknown; idkitResponse?: unknown };
  if (!isCanonicalWorldAddress(address) || typeof idkitResponse !== "object" || idkitResponse === null || Array.isArray(idkitResponse)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  if (!hasExpectedWorldIssuerSignal(idkitResponse, address)) return NextResponse.json({ error: "world_verification_failed" }, { status: 403 });
  const url = worldVerificationUrl(process.env);
  if (!url) return NextResponse.json({ error: "world_not_configured" }, { status: 503 });
  let verified: Response;
  try { verified = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(idkitResponse), cache: "no-store", signal: AbortSignal.timeout(10_000) }); } catch { return NextResponse.json({ error: "world_unavailable" }, { status: 502 }); }
  if (!verified.ok) return NextResponse.json({ error: "world_verification_failed" }, { status: 403 });
  const value = await createWorldIssuerCookie(address, process.env);
  if (!value) return NextResponse.json({ error: "world_not_configured" }, { status: 503 });
  const response = NextResponse.json({ verified: true }, { headers: { "cache-control": "no-store" } });
  response.cookies.set(WORLD_ISSUER_COOKIE, value, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/commands", maxAge: WORLD_ISSUER_SESSION_SECONDS });
  return response;
}
