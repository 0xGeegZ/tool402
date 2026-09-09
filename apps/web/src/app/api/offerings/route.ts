import type { NextRequest } from "next/server";
import { connection } from "next/server";

import { offeringsResponse } from "../../../lib/offering-projection";

export async function GET(request: NextRequest) {
  await connection();
  return offeringsResponse(new URL(request.url).searchParams.get("offeringPublicId"), process.env);
}
