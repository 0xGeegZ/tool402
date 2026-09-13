import type { NextRequest } from "next/server";

import { handleBackingPaymentRequest } from "../../../../lib/backing-payment-server.ts";

export async function POST(request: NextRequest) {
  return handleBackingPaymentRequest(request, process.env);
}
