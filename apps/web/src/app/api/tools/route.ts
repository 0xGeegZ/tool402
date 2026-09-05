import { connection } from "next/server";

import { toolDirectoryResponse } from "../../../lib/tool-directory";

export async function GET() {
  await connection();
  return toolDirectoryResponse(process.env);
}
