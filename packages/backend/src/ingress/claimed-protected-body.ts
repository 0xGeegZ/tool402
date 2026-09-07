import {
  verifyProtectedIngress,
} from "./protected-ingress-verifier.ts";
import type { ResolveProtectedIngressKey } from "./protected-ingress-verifier.ts";
import { claimProtectedReplay } from "./protected-replay-claim.ts";
import type { TryClaimProtectedReplay } from "./protected-replay-claim.ts";

const claimedProtectedBodies = new WeakSet<object>();
const claimedBodyBytes = new WeakMap<object, Uint8Array>();

export interface ClaimedProtectedBody {
  readonly replayIdentity: string;
}

export async function claimProtectedBody(
  envelopeInput: unknown,
  rawBody: Uint8Array,
  nowUnixSeconds: bigint,
  resolveKey: ResolveProtectedIngressKey,
  tryClaimReplay: TryClaimProtectedReplay,
): Promise<ClaimedProtectedBody | null> {
  try {
    if (!(rawBody instanceof Uint8Array)) {
      return null;
    }

    const copiedRawBody = new Uint8Array(rawBody);
    const verified = await verifyProtectedIngress(
      envelopeInput,
      copiedRawBody,
      nowUnixSeconds,
      resolveKey,
    );
    if (verified === null) {
      return null;
    }

    const replay = await claimProtectedReplay(verified, tryClaimReplay);
    if (replay === null) {
      return null;
    }

    const claimed = Object.freeze({ replayIdentity: replay.replayIdentity });
    claimedProtectedBodies.add(claimed);
    claimedBodyBytes.set(claimed, copiedRawBody);
    return claimed;
  } catch {
    return null;
  }
}

export function isClaimedProtectedBody(
  value: unknown,
): value is ClaimedProtectedBody {
  return (
    value !== null &&
    typeof value === "object" &&
    claimedProtectedBodies.has(value)
  );
}

export function readClaimedProtectedBody(value: unknown): Uint8Array | null {
  if (!isClaimedProtectedBody(value)) {
    return null;
  }

  const storedBytes = claimedBodyBytes.get(value);
  return storedBytes === undefined ? null : new Uint8Array(storedBytes);
}
