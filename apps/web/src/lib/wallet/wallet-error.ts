export function isUserRejectedWalletRequest(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  try {
    return (error as { readonly code?: unknown }).code === 4001;
  } catch {
    return false;
  }
}
