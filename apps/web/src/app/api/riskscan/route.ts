import type { NextRequest } from "next/server";

import { handleRiskScanPost } from "../../../lib/riskscan-x402";

export async function POST(request: NextRequest) {
  return handleRiskScanPost(request, process.env);
}
