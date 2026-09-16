import type { NextRequest } from "next/server";

import { prepareBackingIntentRequest } from "../../../../lib/backing-payment-server.ts";

export async function POST(request: NextRequest) {
  return prepareBackingIntentRequest(request, process.env);
}
