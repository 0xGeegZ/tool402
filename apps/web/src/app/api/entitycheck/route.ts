import type { NextRequest } from "next/server";

import { handleEntityCheckPost } from "../../../lib/entity-check-x402";

export async function POST(request: NextRequest) {
  return handleEntityCheckPost(request, process.env);
}
