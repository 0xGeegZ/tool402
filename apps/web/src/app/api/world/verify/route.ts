import { NextResponse } from "next/server";
import { createWorldIssuerCookie, isCanonicalWorldAddress, WORLD_ISSUER_COOKIE, WORLD_ISSUER_SESSION_SECONDS, worldVerificationUrl } from "../../../../lib/world/issuer-selfie-check";

export async function POST(request: Request) {
  let body: { address?: unknown; idkitResponse?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_request" }, { status: 400 }); }
  const url = worldVerificationUrl(process.env);
  if (!url) return NextResponse.json({ error: "world_not_configured" }, { status: 503 });
  if (!isCanonicalWorldAddress(body.address) || body.idkitResponse === undefined) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  let verified: Response;
  try { verified = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body.idkitResponse), cache: "no-store", signal: AbortSignal.timeout(10_000) }); } catch { return NextResponse.json({ error: "world_unavailable" }, { status: 502 }); }
  if (!verified.ok) return NextResponse.json({ error: "world_verification_failed" }, { status: 403 });
  const value = await createWorldIssuerCookie(body.address, process.env);
  if (!value) return NextResponse.json({ error: "world_not_configured" }, { status: 503 });
  const response = NextResponse.json({ verified: true }, { headers: { "cache-control": "no-store" } });
  response.cookies.set(WORLD_ISSUER_COOKIE, value, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/commands", maxAge: WORLD_ISSUER_SESSION_SECONDS });
  return response;
}
