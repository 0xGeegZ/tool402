import { isVerifiedProtectedIngress } from "./protected-ingress-verifier.ts";

const claimedProtectedReplays = new WeakSet<object>();
const claimedOutcome = "claimed";
const NativePromise = Promise;
const nativePromiseThen = NativePromise.prototype.then;

export interface ClaimedProtectedReplay {
  readonly replayIdentity: string;
}

export type ProtectedReplayClaimOutcome = "claimed" | "already_claimed";

export type TryClaimProtectedReplay = (
  replayIdentity: string,
) => ProtectedReplayClaimOutcome | Promise<ProtectedReplayClaimOutcome>;

export function isClaimedProtectedReplay(
  value: unknown,
): value is ClaimedProtectedReplay {
  return (
    value !== null &&
    typeof value === "object" &&
    claimedProtectedReplays.has(value)
  );
}

export async function claimProtectedReplay(
  verifiedIngress: unknown,
  tryClaimReplay: TryClaimProtectedReplay,
): Promise<ClaimedProtectedReplay | null> {
  try {
    if (!isVerifiedProtectedIngress(verifiedIngress)) {
      return null;
    }

    if (typeof tryClaimReplay !== "function") {
      return null;
    }

    const claimAttempt = tryClaimReplay(verifiedIngress.replayIdentity);
    const didClaim =
      typeof claimAttempt === "string"
        ? claimAttempt === claimedOutcome
        : await new NativePromise<boolean>(
            (resolve, reject) => {
              nativePromiseThen.call(
                claimAttempt,
                (outcome) => resolve(outcome === claimedOutcome),
                reject,
              );
            },
          );
    if (!didClaim) {
      return null;
    }

    const claimed = Object.freeze({
      replayIdentity: verifiedIngress.replayIdentity,
    });
    claimedProtectedReplays.add(claimed);
    return claimed;
  } catch {
    return null;
  }
}
