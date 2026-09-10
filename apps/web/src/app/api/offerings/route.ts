import { isValidOfferingPublicId, readProviderProjections } from "../../../lib/offering-projection.ts";

const responseHeaders = { "cache-control": "no-store" };

export async function GET(request: Request) {
  const offeringPublicId = new URL(request.url).searchParams.get("offeringPublicId");
  if (offeringPublicId === null || !isValidOfferingPublicId(offeringPublicId)) {
    return new Response("Invalid offering identifier.", { status: 400, headers: responseHeaders });
  }
  return Response.json(await readProviderProjections(process.env, globalThis.fetch, offeringPublicId), { headers: responseHeaders });
}
