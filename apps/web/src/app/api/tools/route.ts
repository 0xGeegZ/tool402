import { connection } from "next/server";

import {
  activeDirectoryViewRequested,
  readActiveDirectoryVersion
} from "../../../lib/active-directory-version";
import { toolDirectoryResponse } from "../../../lib/tool-directory";

export async function GET(request: Request) {
  await connection();
  const read = () =>
    readActiveDirectoryVersion(process.env, (i, init) => fetch(i, init));
  const directory = activeDirectoryViewRequested(request) ? await read() : null;
  return toolDirectoryResponse(process.env, directory);
}
