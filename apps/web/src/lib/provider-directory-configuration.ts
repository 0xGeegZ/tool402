import { parseHederaAccountId } from "@tool402/core";

export type ProviderDirectoryConfiguration = Readonly<{
  x402Endpoint: string;
  clearingAccount: string;
}>;

function publicDashboardOrigin(input: unknown): URL | null {
  if (typeof input !== "string") return null;
  try {
    const origin = new URL(input);
    if (
      origin.protocol !== "https:"
      || origin.username !== ""
      || origin.password !== ""
      || origin.pathname !== "/"
      || origin.search !== ""
      || origin.hash !== ""
    ) return null;
    return origin;
  } catch {
    return null;
  }
}

function explicitProviderEndpoint(input: unknown): string | null {
  if (typeof input !== "string") return null;
  try {
    const endpoint = new URL(input);
    if (
      endpoint.protocol !== "https:"
      || endpoint.hostname.length === 0
      || endpoint.username !== ""
      || endpoint.password !== ""
      || endpoint.search !== ""
      || endpoint.hash !== ""
    ) return null;
    return endpoint.href;
  } catch {
    return null;
  }
}

export function readProviderDirectoryConfiguration(
  environment: Readonly<Record<string, string | undefined>>,
): ProviderDirectoryConfiguration | null {
  const endpoint = explicitProviderEndpoint(environment.TOOL402_PROVIDER_X402_ENDPOINT);
  const dashboardOrigin = publicDashboardOrigin(environment.TOOL402_DASHBOARD_AUTH_ORIGIN);
  const clearingAccount = parseHederaAccountId(environment.TOOL402_CLEARING_ACCOUNT_ID);
  if ((endpoint === null && dashboardOrigin === null) || clearingAccount === undefined) return null;
  return Object.freeze({
    x402Endpoint: endpoint ?? new URL("/api/riskscan", dashboardOrigin as URL).toString(),
    clearingAccount,
  });
}
