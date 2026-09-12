export type ProviderToolIdentity = Readonly<{
  toolPublicId: string;
  subjectPublicId: string;
  offeringPublicId: string;
  serviceId: string;
  serviceSlug: string;
}>;

const entropyLength = 16;
const toolIdPattern = /^tool_[0-9a-f]{32}$/u;

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function parseProviderToolId(value: unknown): string | null {
  return typeof value === "string" && toolIdPattern.test(value) ? value : null;
}

export function createProviderToolIdentity(entropy: Uint8Array): ProviderToolIdentity {
  if (!(entropy instanceof Uint8Array) || entropy.byteLength !== entropyLength) {
    throw new TypeError("provider tool entropy must be exactly 16 bytes");
  }
  const suffix = hex(new Uint8Array(entropy));
  const toolPublicId = `tool_${suffix}`;
  return Object.freeze({
    toolPublicId,
    subjectPublicId: toolPublicId,
    offeringPublicId: `offering_${suffix}`,
    serviceId: toolPublicId,
    serviceSlug: `tool-${suffix}`,
  });
}
