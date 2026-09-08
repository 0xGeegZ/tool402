import type { NextRequest } from "next/server";

import { handleCommandRelayPost } from "../../../lib/wallet/command-relay.ts";

export async function POST(request: NextRequest) {
  return handleCommandRelayPost(request, process.env);
}
