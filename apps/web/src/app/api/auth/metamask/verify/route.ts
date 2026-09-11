import { handleVerifyPost } from "../../../../../lib/dashboard-auth/dashboard-auth-routes.ts";

export async function POST(request: Request) {
  return handleVerifyPost(request, {
    TOOL402_DASHBOARD_AUTH_ORIGIN: process.env.TOOL402_DASHBOARD_AUTH_ORIGIN,
    TOOL402_DASHBOARD_AUTH_SECRET: process.env.TOOL402_DASHBOARD_AUTH_SECRET,
  });
}
