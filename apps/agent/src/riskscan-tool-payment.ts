import {
  assessRiskScanQuick,
  evaluateRiskScanNativeQuote,
} from "@tool402/core";
import type {
  RiskScanNativeQuoteDeclineReason,
  RiskScanQuickInput,
  RiskScanQuickResult,
} from "@tool402/core";
import type {
  PaymentPayload,
  PaymentRequired,
  PaymentRequirements,
  SettleResponse,
} from "@x402/core/types";

import { discoverRiskScanQuick } from "./riskscan-tool-directory.ts";

export type RiskScanPaymentSender = (
  target: URL,
  init: RequestInit,
) => Promise<Response>;

export type ClientHederaSigner = {
  readonly accountId: string;
  createPartiallySignedTransferTransaction(
    requirements: PaymentRequirements,
  ): Promise<string>;
};

export type RiskScanPaymentClient = {
  getPaymentRequiredResponse(
    getHeader: (name: string) => string | null | undefined,
  ): PaymentRequired;
  createPaymentPayload(paymentRequired: PaymentRequired): Promise<PaymentPayload>;
  encodePaymentSignatureHeader(paymentPayload: PaymentPayload): Record<string, string>;
  getPaymentSettleResponse(
    getHeader: (name: string) => string | null | undefined,
  ): SettleResponse;
};

export type RiskScanPaymentClientFactory = (
  signer: ClientHederaSigner,
  policy: Readonly<{
    network: "hedera:testnet";
    asset: string;
    maximumAmount: string;
  }>,
) => RiskScanPaymentClient;

export type RiskScanQuickPaymentOutcome =
  | { readonly kind: "directory_unavailable" }
  | { readonly kind: "directory_invalid" }
  | { readonly kind: "input_invalid" }
  | { readonly kind: "quote_declined"; readonly reason: RiskScanNativeQuoteDeclineReason }
  | { readonly kind: "transport_failure" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "challenge_invalid" }
  | {
      readonly kind: "payment_failed";
      readonly reason:
        | "payment_payload_rejected"
        | "settlement_rejected"
        | "payment_response_invalid";
    }
  | { readonly kind: "paid"; readonly settlementRef: string; readonly assessment: RiskScanQuickResult }
  | { readonly kind: "unexpected_response" };

export type RiskScanQuickPaymentAgent = {
  pay(
    serviceBase: URL,
    input: unknown,
    policy: unknown,
  ): Promise<RiskScanQuickPaymentOutcome>;
};

export type RiskScanQuickPaymentAgentDependencies = {
  signer: ClientHederaSigner;
  directoryFetcher: RiskScanPaymentSender;
  requestSender: RiskScanPaymentSender;
  paymentClientFactory: RiskScanPaymentClientFactory;
};

type InputSnapshot = RiskScanQuickInput;
type PolicySnapshot = Readonly<{
  network: unknown;
  asset: unknown;
  maximumAmount: unknown;
}>;

const dependencyFields = [
  "signer",
  "directoryFetcher",
  "requestSender",
  "paymentClientFactory",
] as const;
const inputFields = ["requestRef", "subjectRef", "context", "declarations"] as const;
const declarationFields = ["identity", "pricing", "limitations", "evidence"] as const;
const policyFields = ["network", "asset", "maximumAmount"] as const;
const assessmentFields = [
  "requestRef",
  "subjectRef",
  "context",
  "disposition",
  "reasons",
  "limitations",
] as const;

function snapshotExactRecord(
  value: unknown,
  fields: readonly string[],
): Record<string, unknown> | null {
  try {
    if (typeof value !== "object" || value === null || Object.getPrototypeOf(value) !== Object.prototype) {
      return null;
    }
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.length !== fields.length || !ownKeys.every((key) => typeof key === "string" && fields.includes(key))) {
      return null;
    }
    const snapshot: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const field of fields) {
      const descriptor = Object.getOwnPropertyDescriptor(value, field);
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        descriptor.get !== undefined ||
        descriptor.set !== undefined ||
        !Object.hasOwn(descriptor, "value")
      ) return null;
      snapshot[field] = descriptor.value;
    }
    return snapshot;
  } catch {
    return null;
  }
}

function snapshotTrimmedString(value: unknown, maximumLength: number): string | null {
  try {
    if (typeof value !== "string") return null;
    const normalized = value.trim();
    return normalized.length > 0 && normalized.length <= maximumLength ? normalized : null;
  } catch {
    return null;
  }
}

function snapshotQuickInput(value: unknown): InputSnapshot | null {
  const outer = snapshotExactRecord(value, inputFields);
  if (outer === null) return null;
  const declarations = snapshotExactRecord(outer.declarations, declarationFields);
  if (
    declarations === null ||
    typeof declarations.identity !== "boolean" ||
    typeof declarations.pricing !== "boolean" ||
    typeof declarations.limitations !== "boolean" ||
    typeof declarations.evidence !== "boolean"
  ) return null;
  const requestRef = snapshotTrimmedString(outer.requestRef, 96);
  const subjectRef = snapshotTrimmedString(outer.subjectRef, 160);
  const context = snapshotTrimmedString(outer.context, 280);
  if (requestRef === null || subjectRef === null || context === null) return null;
  return Object.freeze({
    requestRef,
    subjectRef,
    context,
    declarations: Object.freeze({
      identity: declarations.identity,
      pricing: declarations.pricing,
      limitations: declarations.limitations,
      evidence: declarations.evidence,
    }),
  }) as InputSnapshot;
}

function snapshotPolicy(value: unknown): PolicySnapshot {
  const source = snapshotExactRecord(value, policyFields);
  return Object.freeze({
    network: source?.network,
    asset: source?.asset,
    maximumAmount: source?.maximumAmount,
  });
}

function validSigner(value: unknown): value is ClientHederaSigner {
  try {
    return typeof value === "object" &&
      value !== null &&
      typeof (value as { accountId?: unknown }).accountId === "string" &&
      (value as { accountId: string }).accountId.trim().length > 0 &&
      typeof (value as { createPartiallySignedTransferTransaction?: unknown }).createPartiallySignedTransferTransaction === "function";
  } catch {
    return false;
  }
}

function validPaymentClient(value: unknown): value is RiskScanPaymentClient {
  try {
    return typeof value === "object" &&
      value !== null &&
      typeof (value as { getPaymentRequiredResponse?: unknown }).getPaymentRequiredResponse === "function" &&
      typeof (value as { createPaymentPayload?: unknown }).createPaymentPayload === "function" &&
      typeof (value as { encodePaymentSignatureHeader?: unknown }).encodePaymentSignatureHeader === "function" &&
      typeof (value as { getPaymentSettleResponse?: unknown }).getPaymentSettleResponse === "function";
  } catch {
    return false;
  }
}

function validatedDependencies(value: unknown): RiskScanQuickPaymentAgentDependencies | null {
  const dependencies = snapshotExactRecord(value, dependencyFields);
  if (dependencies === null || !validSigner(dependencies.signer)) return null;
  if (
    typeof dependencies.directoryFetcher !== "function" ||
    typeof dependencies.requestSender !== "function" ||
    typeof dependencies.paymentClientFactory !== "function"
  ) return null;
  return {
    signer: dependencies.signer,
    directoryFetcher: dependencies.directoryFetcher as RiskScanPaymentSender,
    requestSender: dependencies.requestSender as RiskScanPaymentSender,
    paymentClientFactory: dependencies.paymentClientFactory as RiskScanPaymentClientFactory,
  };
}

function requestTarget(serviceBase: URL): URL | null {
  try {
    if (
      !(serviceBase instanceof URL) ||
      !["http:", "https:"].includes(serviceBase.protocol) ||
      serviceBase.username.length > 0 ||
      serviceBase.password.length > 0
    ) return null;
    const target = new URL("/api/riskscan", serviceBase);
    return ["http:", "https:"].includes(target.protocol) && target.username.length === 0 && target.password.length === 0
      ? target
      : null;
  } catch {
    return null;
  }
}

function postRequest(input: InputSnapshot, signature?: Record<string, string>): RequestInit {
  return {
    method: "POST",
    headers: {
      ...(signature ?? {}),
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
    credentials: "omit",
    redirect: "error",
  };
}

function matchingChallenge(
  value: unknown,
  quote: { readonly network: "hedera:testnet"; readonly asset: string; readonly amount: bigint },
): value is PaymentRequired {
  try {
    if (typeof value !== "object" || value === null) return false;
    const paymentRequired = value as { x402Version?: unknown; accepts?: unknown };
    if (paymentRequired.x402Version !== 2 || !Array.isArray(paymentRequired.accepts) || paymentRequired.accepts.length !== 1) {
      return false;
    }
    const requirement = paymentRequired.accepts[0] as {
      scheme?: unknown;
      network?: unknown;
      asset?: unknown;
      amount?: unknown;
    };
    return requirement !== null && typeof requirement === "object" &&
      requirement.scheme === "exact" &&
      requirement.network === quote.network &&
      requirement.asset === quote.asset &&
      requirement.amount === quote.amount.toString();
  } catch {
    return false;
  }
}

function signatureHeaders(value: unknown): Record<string, string> | null {
  try {
    if (typeof value !== "object" || value === null || Object.getPrototypeOf(value) !== Object.prototype) return null;
    const headers: Record<string, string> = {};
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return null;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        descriptor.get !== undefined ||
        descriptor.set !== undefined ||
        typeof descriptor.value !== "string" ||
        descriptor.value.trim().length === 0
      ) return null;
      headers[key] = descriptor.value;
    }
    return Object.keys(headers).length > 0 ? headers : null;
  } catch {
    return null;
  }
}

function snapshotStringArray(value: unknown): readonly string[] | null {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return null;
    if (Reflect.ownKeys(value).length !== value.length + 1) return null;
    const values: string[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        descriptor.get !== undefined ||
        descriptor.set !== undefined ||
        typeof descriptor.value !== "string"
      ) return null;
      values.push(descriptor.value);
    }
    return values;
  } catch {
    return null;
  }
}

function matchesAssessment(value: unknown, expected: RiskScanQuickResult): value is RiskScanQuickResult {
  const assessment = snapshotExactRecord(value, assessmentFields);
  if (assessment === null) return false;
  const reasons = snapshotStringArray(assessment.reasons);
  const limitations = snapshotStringArray(assessment.limitations);
  if (reasons === null || limitations === null) return false;
  return assessment.requestRef === expected.requestRef &&
    assessment.subjectRef === expected.subjectRef &&
    assessment.context === expected.context &&
    assessment.disposition === expected.disposition &&
    reasons.length === expected.reasons.length &&
    reasons.every((reason, index) => reason === expected.reasons[index]) &&
    limitations.length === expected.limitations.length &&
    limitations.every((limitation, index) => limitation === expected.limitations[index]);
}

function successfulSettlement(value: unknown, network: "hedera:testnet"): string | null {
  try {
    if (typeof value !== "object" || value === null) return null;
    const settlement = value as { success?: unknown; network?: unknown; transaction?: unknown };
    return settlement.success === true &&
      settlement.network === network &&
      typeof settlement.transaction === "string" &&
      settlement.transaction.trim().length > 0 &&
      !/[\u0000-\u001F\u007F-\u009F\u2028\u2029]/u.test(settlement.transaction)
      ? settlement.transaction
      : null;
  } catch {
    return null;
  }
}

export function createRiskScanQuickPaymentAgent(
  dependencies: RiskScanQuickPaymentAgentDependencies,
): RiskScanQuickPaymentAgent;
export function createRiskScanQuickPaymentAgent(
  dependencies: unknown,
): RiskScanQuickPaymentAgent {
  const configured = validatedDependencies(dependencies);
  if (configured === null) throw new TypeError("invalid RiskScan payment dependencies");

  return {
    async pay(serviceBase: URL, input: unknown, policy: unknown): Promise<RiskScanQuickPaymentOutcome> {
      const localInput = snapshotQuickInput(input);
      if (localInput === null) return { kind: "input_invalid" };

      const discovery = await discoverRiskScanQuick(serviceBase, configured.directoryFetcher);
      if (discovery.kind === "directory_unavailable" || discovery.kind === "directory_invalid") return discovery;
      if (discovery.tool.payment.state !== "locally_configured" || discovery.tool.payment.network !== "hedera:testnet") {
        return { kind: "directory_invalid" };
      }

      const localPolicy = snapshotPolicy(policy);
      const eligibility = evaluateRiskScanNativeQuote(localPolicy, {
        network: discovery.tool.payment.network,
        asset: discovery.tool.payment.asset,
        amount: discovery.tool.payment.amount,
      });
      if (eligibility.kind === "declined") return { kind: "quote_declined", reason: eligibility.reason };

      const target = requestTarget(serviceBase);
      if (target === null) return { kind: "directory_invalid" };
      const acceptedPolicy = localPolicy as Readonly<{
        network: "hedera:testnet";
        asset: string;
        maximumAmount: string;
      }>;

      let initialResponse: Response;
      try {
        initialResponse = await configured.requestSender(target, postRequest(localInput));
      } catch {
        return { kind: "transport_failure" };
      }
      let initialStatus: number;
      try {
        initialStatus = initialResponse.status;
      } catch {
        return { kind: "unexpected_response" };
      }
      if (initialStatus === 503) return { kind: "unavailable" };
      if (initialStatus !== 402) return { kind: "unexpected_response" };

      let client: RiskScanPaymentClient;
      try {
        const candidate = configured.paymentClientFactory(configured.signer, acceptedPolicy);
        if (!validPaymentClient(candidate)) return { kind: "payment_failed", reason: "payment_payload_rejected" };
        client = candidate;
      } catch {
        return { kind: "payment_failed", reason: "payment_payload_rejected" };
      }

      let challenge: PaymentRequired;
      try {
        challenge = client.getPaymentRequiredResponse(initialResponse.headers.get.bind(initialResponse.headers));
      } catch {
        return { kind: "challenge_invalid" };
      }
      if (!matchingChallenge(challenge, eligibility)) return { kind: "challenge_invalid" };

      let signedHeaders: Record<string, string> | null;
      try {
        const payload = await client.createPaymentPayload(challenge);
        signedHeaders = signatureHeaders(client.encodePaymentSignatureHeader(payload));
      } catch {
        return { kind: "payment_failed", reason: "payment_payload_rejected" };
      }
      if (signedHeaders === null) return { kind: "payment_failed", reason: "payment_payload_rejected" };

      let protectedResponse: Response;
      try {
        protectedResponse = await configured.requestSender(target, postRequest(localInput, signedHeaders));
      } catch {
        return { kind: "transport_failure" };
      }
      let protectedStatus: number;
      try {
        protectedStatus = protectedResponse.status;
      } catch {
        return { kind: "unexpected_response" };
      }
      if (protectedStatus === 503) return { kind: "unavailable" };
      if (protectedStatus !== 200) return { kind: "unexpected_response" };

      let settlement: SettleResponse;
      try {
        settlement = client.getPaymentSettleResponse(protectedResponse.headers.get.bind(protectedResponse.headers));
      } catch {
        return { kind: "payment_failed", reason: "payment_response_invalid" };
      }
      const settlementRef = successfulSettlement(settlement, eligibility.network);
      if (settlementRef === null) return { kind: "payment_failed", reason: "settlement_rejected" };

      let assessment: unknown;
      try {
        assessment = await protectedResponse.json();
      } catch {
        return { kind: "payment_failed", reason: "payment_response_invalid" };
      }
      const expectedAssessment = assessRiskScanQuick(localInput);
      if (!matchesAssessment(assessment, expectedAssessment)) {
        return { kind: "payment_failed", reason: "payment_response_invalid" };
      }
      return { kind: "paid", settlementRef, assessment: expectedAssessment };
    },
  };
}
