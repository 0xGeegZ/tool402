import { parseHederaAccountId, parseNoteUnits } from "./value.ts";

export type RiskScanNativeQuoteDeclineReason =
  | "invalid_policy"
  | "invalid_quote"
  | "network_mismatch"
  | "asset_mismatch"
  | "amount_exceeds_maximum";

export type RiskScanNativeAtomicAmount = bigint & {
  readonly __brand: "RiskScanNativeAtomicAmount";
};

export type RiskScanNativeAssetId = string & {
  readonly __brand: "RiskScanNativeAssetId";
};

export type RiskScanNativeQuoteEligibility =
  | {
      readonly kind: "eligible";
      readonly network: "hedera:testnet";
      readonly asset: RiskScanNativeAssetId;
      readonly amount: RiskScanNativeAtomicAmount;
    }
  | {
      readonly kind: "declined";
      readonly reason: RiskScanNativeQuoteDeclineReason;
    };

type Policy = {
  readonly network: "hedera:testnet";
  readonly asset: RiskScanNativeAssetId;
  readonly maximumAmount: RiskScanNativeAtomicAmount;
};

type Quote = {
  readonly network: string;
  readonly asset: RiskScanNativeAssetId;
  readonly amount: RiskScanNativeAtomicAmount;
};

const policyFields = ["network", "asset", "maximumAmount"] as const;
const quoteFields = ["network", "asset", "amount"] as const;

function decline(
  reason: RiskScanNativeQuoteDeclineReason,
): RiskScanNativeQuoteEligibility {
  return { kind: "declined", reason };
}

function snapshotExactRecord(
  value: unknown,
  fields: readonly string[],
): readonly unknown[] | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      return undefined;
    }

    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.length !== fields.length) {
      return undefined;
    }

    for (const key of ownKeys) {
      if (typeof key !== "string" || !fields.includes(key)) {
        return undefined;
      }
    }

    const capturedValues: unknown[] = [];

    for (const field of fields) {
      const descriptor = Object.getOwnPropertyDescriptor(value, field);
      if (
        descriptor === undefined ||
        !descriptor.enumerable ||
        !Object.prototype.hasOwnProperty.call(descriptor, "value")
      ) {
        return undefined;
      }

      capturedValues.push(descriptor.value);
    }

    return capturedValues;
  } catch {
    return undefined;
  }
}

function parseNativeAssetId(input: unknown): RiskScanNativeAssetId | undefined {
  const asset = parseHederaAccountId(input);
  return asset === undefined
    ? undefined
    : (asset as unknown as RiskScanNativeAssetId);
}

function parseNativeAtomicAmount(
  input: unknown,
): RiskScanNativeAtomicAmount | undefined {
  const amount = parseNoteUnits(input);
  return amount === undefined
    ? undefined
    : (amount as unknown as RiskScanNativeAtomicAmount);
}

function parsePolicy(input: unknown): Policy | undefined {
  const snapshot = snapshotExactRecord(input, policyFields);
  if (snapshot === undefined) {
    return undefined;
  }

  const [network, rawAsset, rawMaximumAmount] = snapshot;
  if (network !== "hedera:testnet") {
    return undefined;
  }

  const asset = parseNativeAssetId(rawAsset);
  const maximumAmount = parseNativeAtomicAmount(rawMaximumAmount);
  if (asset === undefined || maximumAmount === undefined) {
    return undefined;
  }

  return { network, asset, maximumAmount };
}

function parseQuote(input: unknown): Quote | undefined {
  const snapshot = snapshotExactRecord(input, quoteFields);
  if (snapshot === undefined) {
    return undefined;
  }

  const [network, rawAsset, rawAmount] = snapshot;
  if (typeof network !== "string") {
    return undefined;
  }

  const asset = parseNativeAssetId(rawAsset);
  const amount = parseNativeAtomicAmount(rawAmount);
  if (asset === undefined || amount === undefined || amount === 0n) {
    return undefined;
  }

  return { network, asset, amount };
}

export function evaluateRiskScanNativeQuote(
  policyInput: unknown,
  quoteInput: unknown,
): RiskScanNativeQuoteEligibility {
  const policy = parsePolicy(policyInput);
  if (policy === undefined) {
    return decline("invalid_policy");
  }

  const quote = parseQuote(quoteInput);
  if (quote === undefined) {
    return decline("invalid_quote");
  }

  if (quote.network !== policy.network) {
    return decline("network_mismatch");
  }

  if (quote.asset !== policy.asset) {
    return decline("asset_mismatch");
  }

  if (quote.amount > policy.maximumAmount) {
    return decline("amount_exceeds_maximum");
  }

  return {
    kind: "eligible",
    network: policy.network,
    asset: quote.asset,
    amount: quote.amount,
  };
}
