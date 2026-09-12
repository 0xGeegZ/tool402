import { handleProviderToolsRequest } from "../../../../lib/provider-tools-server.ts";

export async function GET(request: Request): Promise<Response> {
  return handleProviderToolsRequest(request, process.env);
}

export async function POST(request: Request): Promise<Response> {
  return handleProviderToolsRequest(request, process.env);
}
