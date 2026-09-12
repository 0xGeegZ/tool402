import { handleProviderToolDeploymentRequest } from "../../../../../../lib/provider-tools-server.ts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ toolPublicId: string }> },
): Promise<Response> {
  const { toolPublicId } = await params;
  return handleProviderToolDeploymentRequest(request, process.env, toolPublicId);
}
