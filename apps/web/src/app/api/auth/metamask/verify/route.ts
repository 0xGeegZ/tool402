import { handleVerifyPost } from "../../../../../lib/dashboard-auth/dashboard-auth-routes.ts";

export async function POST(request: Request) {
  return handleVerifyPost(request, process.env);
}
