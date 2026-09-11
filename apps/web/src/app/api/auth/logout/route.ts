import { handleLogoutPost } from "../../../../lib/dashboard-auth/dashboard-auth-routes.ts";

export async function POST(request: Request) {
  return handleLogoutPost(request, process.env);
}
