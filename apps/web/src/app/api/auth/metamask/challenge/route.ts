import { handleChallengePost } from "../../../../../lib/dashboard-auth/dashboard-auth-routes.ts";

export async function POST(request: Request) {
  return handleChallengePost(request, process.env);
}
