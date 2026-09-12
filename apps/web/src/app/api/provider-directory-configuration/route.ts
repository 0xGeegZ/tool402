import { readProviderDirectoryConfiguration } from "../../../lib/provider-directory-configuration.ts";

const responseHeaders = { "cache-control": "no-store" };

export async function GET() {
  return Response.json(
    { directoryConfiguration: readProviderDirectoryConfiguration(process.env) },
    { headers: responseHeaders },
  );
}
