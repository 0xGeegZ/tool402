import type { NextRequest } from "next/server";

import { RELAY_OUTCOMES, handleCommandRelayPost } from "../../../lib/wallet/command-relay.ts";

export async function POST(request: NextRequest) {
  return handleCommandRelayPost(request, process.env);
}

export const commandRelayOutcomeKinds = RELAY_OUTCOMES;
