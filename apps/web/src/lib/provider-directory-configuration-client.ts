export type ProviderDirectoryConfiguration = Readonly<{
  x402Endpoint: string;
  clearingAccount: string;
}>;

function plainRecord(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === "object" && Object.getPrototypeOf(input) === Object.prototype;
}

export function readProviderDirectoryConfiguration(
  input: unknown,
): ProviderDirectoryConfiguration | null {
  if (!plainRecord(input) || !plainRecord(input.directoryConfiguration)) return null;
  const { x402Endpoint, clearingAccount } = input.directoryConfiguration;
  return typeof x402Endpoint === "string" && typeof clearingAccount === "string"
    ? Object.freeze({ x402Endpoint, clearingAccount })
    : null;
}

export async function loadProviderDirectoryConfiguration(): Promise<ProviderDirectoryConfiguration | null> {
  try {
    const response = await globalThis.fetch("/api/provider-directory-configuration", {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    if (response.status !== 200) return null;
    return readProviderDirectoryConfiguration(await response.json());
  } catch {
    return null;
  }
}
