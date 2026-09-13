import { createRequire } from "node:module";
import { accessSync, constants, lstatSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { decodePaymentRequiredHeader } from "@x402/core/http";
import type { SchemeNetworkClient } from "@x402/core/types";
import { evaluateRiskScanNativeQuote } from "@tool402/core";
import type { RiskScanQuickInput } from "@tool402/core";

import {
  createRiskScanQuickPaymentAgent,
} from "./riskscan-tool-payment.ts";
import {
  createRiskScanPaymentEvidence,
  writeRiskScanPaymentEvidence,
} from "./riskscan-payment-evidence.ts";
import { discoverRiskScanQuick } from "./riskscan-tool-directory.ts";
import {
  diagnosticForRiskScanPayPhase,
  formatRiskScanPayDiagnostic,
  matchesRiskScanPayPreflightChallenge,
} from "./riskscan-pay-observability.ts";
import type {
  ClientHederaSigner,
  RiskScanPaymentClientFactory,
  RiskScanQuickPaymentOutcome,
} from "./riskscan-tool-payment.ts";

const require = createRequire(import.meta.url);

type HederaRuntime = {
  ExactHederaScheme: new (signer: ClientHederaSigner) => SchemeNetworkClient;
  PrivateKey: { fromString(value: string): unknown };
  createClientHederaSigner(
    accountId: string,
    privateKey: unknown,
    configuration: { network: "hedera:testnet" },
  ): ClientHederaSigner;
};

const { ExactHederaScheme, PrivateKey, createClientHederaSigner } = require("@x402/hedera") as HederaRuntime;

type ServiceConfiguration = {
  serviceBase: URL;
  input: unknown;
  policy: unknown;
};

type RuntimeConfiguration = ServiceConfiguration & {
  payerAccountId: string;
  payerPrivateKey: string;
};

type PaymentPhase = "initial_request" | "payment_payload" | "signed_retry" | "settlement" | "result" | "terminal";
type EvidenceExport = Readonly<{
  outputPath: string;
  recordingRunRef: string;
  sourceVersion: string;
}>;

const safeReferencePattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/u;
const sourceVersionPattern = /^[0-9a-f]{7,64}$/u;
const b03RecordingRunRef = "b03-release-001";
const b03ServiceOrigin = "https://tool402.vercel.app";

function requiredEnvironmentValue(name: string): string | null {
  const value = process.env[name]?.trim();
  return value === undefined || value.length === 0 ? null : value;
}

function configuredRequestReference(): string | null {
  const raw = requiredEnvironmentValue("RISKSCAN_PAY_INPUT_JSON");
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    return typeof value === "object" && value !== null && !Array.isArray(value)
      && typeof (value as { requestRef?: unknown }).requestRef === "string"
      ? (value as { requestRef: string }).requestRef
      : null;
  } catch {
    return null;
  }
}

function usesB03Service(): boolean {
  const raw = requiredEnvironmentValue("RISKSCAN_PAY_SERVICE_BASE_URL");
  if (raw === null) return false;
  try {
    return new URL(raw).origin === b03ServiceOrigin;
  } catch {
    return false;
  }
}

function readServiceConfiguration(): ServiceConfiguration | null {
  const serviceBaseValue = requiredEnvironmentValue("RISKSCAN_PAY_SERVICE_BASE_URL");
  const inputValue = requiredEnvironmentValue("RISKSCAN_PAY_INPUT_JSON");
  const policyValue = requiredEnvironmentValue("RISKSCAN_PAY_POLICY_JSON");
  if (
    serviceBaseValue === null ||
    inputValue === null ||
    policyValue === null
  ) return null;
  try {
    const serviceBase = new URL(serviceBaseValue);
    if (
      !["http:", "https:"].includes(serviceBase.protocol) ||
      serviceBase.username.length > 0 ||
      serviceBase.password.length > 0
    ) return null;
    return {
      serviceBase,
      input: JSON.parse(inputValue) as unknown,
      policy: JSON.parse(policyValue) as unknown,
    };
  } catch {
    return null;
  }
}

function readRuntimeConfiguration(): RuntimeConfiguration | null {
  const service = readServiceConfiguration();
  if (service === null) return null;
  const payerAccountId = requiredEnvironmentValue("RISKSCAN_PAY_PAYER_ACCOUNT_ID");
  const payerPrivateKey = requiredEnvironmentValue("RISKSCAN_PAY_PAYER_PRIVATE_KEY");
  return payerAccountId === null || payerPrivateKey === null
    ? null
    : { ...service, payerAccountId, payerPrivateKey };
}

function paymentClientFactory(phase: { current: PaymentPhase }): RiskScanPaymentClientFactory {
  return (signer, policy) => {
    phase.current = "terminal";
    const scheme = new ExactHederaScheme(signer);
    const client = new x402Client()
      .register("hedera:*", scheme)
      .setSpendControls({
        maxAmountPerPayment: false,
        allowedAssets: [{
          network: "hedera:testnet",
          asset: policy.asset,
          maxAmountPerPayment: policy.maximumAmount,
        }],
      });
    const httpClient = new x402HTTPClient(client);
    return {
      getPaymentRequiredResponse(getHeader) {
        phase.current = "initial_request";
        return httpClient.getPaymentRequiredResponse(getHeader);
      },
      async createPaymentPayload(paymentRequired) {
        phase.current = "payment_payload";
        return httpClient.createPaymentPayload(paymentRequired);
      },
      encodePaymentSignatureHeader(paymentPayload) {
        phase.current = "payment_payload";
        return httpClient.encodePaymentSignatureHeader(paymentPayload);
      },
      getPaymentSettleResponse(getHeader) {
        phase.current = "settlement";
        return httpClient.getPaymentSettleResponse(getHeader);
      },
    };
  };
}

function writeOutcome(outcome: RiskScanQuickPaymentOutcome): void {
  process.stdout.write(`RISKSCAN_PAY_OUTCOME ${outcome.kind}\n`);
  if (outcome.kind === "paid") {
    process.stdout.write(`RISKSCAN_PAY_SETTLEMENT ${outcome.settlementRef}\n`);
  }
}

function evidenceExport(argumentsList: readonly string[]): EvidenceExport | "invalid" | "exists" | undefined {
  const indexes = argumentsList.reduce<number[]>((result, value, index) => value === "--evidence-output" ? [...result, index] : result, []);
  if (indexes.length === 0) return undefined;
  if (indexes.length !== 1) return "invalid";
  const outputPath = argumentsList[indexes[0] + 1];
  const suppliedArguments = argumentsList.slice(2);
  const isExactExport = suppliedArguments.length === 2
    && suppliedArguments[0] === "--evidence-output" && suppliedArguments[1] === outputPath;
  const isExactPreflightExport = suppliedArguments.length === 3
    && ((suppliedArguments[0] === "--preflight" && suppliedArguments[1] === "--evidence-output" && suppliedArguments[2] === outputPath)
      || (suppliedArguments[0] === "--evidence-output" && suppliedArguments[1] === outputPath && suppliedArguments[2] === "--preflight"));
  const recordingRunRef = requiredEnvironmentValue("RISKSCAN_PAY_RECORDING_RUN_REF");
  const sourceVersion = requiredEnvironmentValue("RISKSCAN_PAY_SOURCE_VERSION");
  const requestReference = configuredRequestReference();
  const isB03Run = recordingRunRef === b03RecordingRunRef;
  const isB03Request = requestReference === b03RecordingRunRef;
  if ((!isExactExport && !isExactPreflightExport)
    || typeof outputPath !== "string" || outputPath.startsWith("-") || outputPath.length === 0 || outputPath.length > 1_024
    || recordingRunRef === null || !safeReferencePattern.test(recordingRunRef)
    || (usesB03Service() && isB03Run !== isB03Request)
    || sourceVersion === null || !sourceVersionPattern.test(sourceVersion)) return "invalid";
  try {
    const destination = lstatSync(outputPath, { throwIfNoEntry: false });
    if (destination !== undefined) return destination.isFile() ? "exists" : "invalid";
    const parent = lstatSync(dirname(outputPath));
    if (!parent.isDirectory()) return "invalid";
    accessSync(dirname(outputPath), constants.W_OK);
  } catch {
    return "invalid";
  }
  return Object.freeze({ outputPath, recordingRunRef, sourceVersion });
}

function writeEvidenceCaptureFailure(): void {
  process.stdout.write("RISKSCAN_PAY_EVIDENCE_CAPTURE_FAILED\n");
}

function writeExistingEvidenceNotice(): void {
  process.stdout.write("RISKSCAN_PAY_EVIDENCE_EXISTS inspect_or_import_existing_file\n");
}

function writeDiagnostic(phase: Parameters<typeof diagnosticForRiskScanPayPhase>[0]): void {
  process.stdout.write(formatRiskScanPayDiagnostic(diagnosticForRiskScanPayPhase(phase)));
}

function writeNormalConfigurationFailure(): void {
  process.stderr.write("RISKSCAN_PAY_CONFIGURATION_INVALID\n");
  writeDiagnostic({ phase: "configuration" });
}

function unsignedRequest(input: unknown): RequestInit {
  return {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(input),
    credentials: "omit",
    redirect: "error",
  };
}

function snapshotPreflightInput(value: unknown): RiskScanQuickInput | null {
  try {
    if (typeof value !== "object" || value === null || Object.getPrototypeOf(value) !== Object.prototype) return null;
    const fields = ["requestRef", "subjectRef", "context", "declarations"] as const;
    if (Reflect.ownKeys(value).length !== fields.length || !fields.every((field) => Object.hasOwn(value, field))) return null;
    const input = value as Record<string, unknown>;
    const strings = [["requestRef", 96], ["subjectRef", 160], ["context", 280]] as const;
    const snapshot: Record<string, string> = Object.create(null) as Record<string, string>;
    for (const [field, maximumLength] of strings) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
      if (descriptor === undefined || descriptor.get !== undefined || descriptor.set !== undefined || typeof descriptor.value !== "string") return null;
      const normalized = descriptor.value.trim();
      if (normalized.length === 0 || normalized.length > maximumLength) return null;
      snapshot[field] = normalized;
    }
    const declarations = input.declarations;
    if (typeof declarations !== "object" || declarations === null || Object.getPrototypeOf(declarations) !== Object.prototype) return null;
    const declarationFields = ["identity", "pricing", "limitations", "evidence"] as const;
    if (Reflect.ownKeys(declarations).length !== declarationFields.length || !declarationFields.every((field) => Object.hasOwn(declarations, field))) return null;
    const reported: Record<string, boolean> = Object.create(null) as Record<string, boolean>;
    for (const field of declarationFields) {
      const descriptor = Object.getOwnPropertyDescriptor(declarations, field);
      if (descriptor === undefined || descriptor.get !== undefined || descriptor.set !== undefined || typeof descriptor.value !== "boolean") return null;
      reported[field] = descriptor.value;
    }
    return {
      requestRef: snapshot.requestRef,
      subjectRef: snapshot.subjectRef,
      context: snapshot.context,
      declarations: {
        identity: reported.identity,
        pricing: reported.pricing,
        limitations: reported.limitations,
        evidence: reported.evidence,
      },
    };
  } catch {
    return null;
  }
}

async function preflight(): Promise<void> {
  const configuration = readServiceConfiguration();
  if (configuration === null) {
    writeDiagnostic({ phase: "configuration" });
    process.exitCode = 1;
    return;
  }
  const input = snapshotPreflightInput(configuration.input);
  if (input === null) {
    writeDiagnostic({ phase: "configuration" });
    process.exitCode = 1;
    return;
  }
  const discovery = await discoverRiskScanQuick(configuration.serviceBase, (target, init) => fetch(target, init));
  if (discovery.kind !== "tool_selected" || discovery.tool.payment.state !== "locally_configured" || discovery.tool.payment.network !== "hedera:testnet") {
    writeDiagnostic({ phase: "directory" });
    process.exitCode = 1;
    return;
  }
  const quote = evaluateRiskScanNativeQuote(configuration.policy, {
    network: discovery.tool.payment.network,
    asset: discovery.tool.payment.asset,
    amount: discovery.tool.payment.amount,
  });
  if (quote.kind !== "eligible") {
    writeDiagnostic({ phase: "quote" });
    process.exitCode = 1;
    return;
  }
  let response: Response;
  try {
    response = await fetch(new URL("/api/riskscan", configuration.serviceBase), unsignedRequest(input));
    if (response.status !== 402) throw new Error("initial request failed");
    const challenge = decodePaymentRequiredHeader(response.headers.get("payment-required") ?? "");
    if (!matchesRiskScanPayPreflightChallenge(challenge, quote)) throw new Error("challenge mismatch");
  } catch {
    writeDiagnostic({ phase: "initial_request" });
    process.exitCode = 1;
    return;
  }
  writeDiagnostic({ phase: "preflight_guard" });
}

function diagnosticForOutcome(
  outcome: RiskScanQuickPaymentOutcome,
  phase: PaymentPhase,
): Parameters<typeof diagnosticForRiskScanPayPhase>[0] {
  if (outcome.kind === "paid") return { phase: "result", outcome };
  if (outcome.kind === "quote_declined") return { phase: "quote" };
  if (outcome.kind === "directory_invalid" || outcome.kind === "directory_unavailable" || outcome.kind === "input_invalid") {
    return outcome.kind === "input_invalid" ? { phase: "configuration" } : { phase: "directory" };
  }
  if (phase === "signed_retry") return { phase: "signed_retry" };
  if (phase === "settlement" || phase === "result") return { phase: "settlement" };
  if (phase === "payment_payload") return { phase: "payment_payload" };
  if (phase === "terminal") return { phase: "terminal" };
  return { phase: "initial_request" };
}

async function payment(exportConfiguration: EvidenceExport | undefined): Promise<void> {
  const configuration = readRuntimeConfiguration();
  if (configuration === null) {
    writeNormalConfigurationFailure();
    process.exitCode = 1;
    return;
  }
  const phase: { current: PaymentPhase } = { current: "payment_payload" };
  let signer;
  try {
    signer = createClientHederaSigner(
      configuration.payerAccountId,
      PrivateKey.fromString(configuration.payerPrivateKey),
      { network: "hedera:testnet" },
    );
  } catch {
    writeNormalConfigurationFailure();
    process.exitCode = 1;
    return;
  }
  let firstRequest = true;
  phase.current = "initial_request";
  const agent = createRiskScanQuickPaymentAgent({
    signer,
    directoryFetcher: (target, init) => fetch(target, init),
    requestSender: async (target, init) => {
      const requestPhase: PaymentPhase = firstRequest ? "initial_request" : "signed_retry";
      phase.current = requestPhase;
      try {
        const response = await fetch(target, init);
        if (firstRequest) {
          firstRequest = false;
          return response;
        }
        return new Proxy(response, {
          get(targetResponse, property) {
            if (property === "json") return async () => {
              phase.current = "result";
              return targetResponse.json();
            };
            return Reflect.get(targetResponse, property, targetResponse);
          },
        });
      } catch {
        phase.current = requestPhase;
        throw new Error("request failed");
      }
    },
    paymentClientFactory: paymentClientFactory(phase),
  });
  const outcome = await agent.pay(
    configuration.serviceBase,
    configuration.input,
    configuration.policy,
  );
  writeOutcome(outcome);
  if (outcome.kind === "paid" && exportConfiguration !== undefined) {
    try {
      const evidence = createRiskScanPaymentEvidence({
        outcome,
        serviceBase: configuration.serviceBase,
        payerAccountId: configuration.payerAccountId,
        recordingRunRef: exportConfiguration.recordingRunRef,
        sourceVersion: exportConfiguration.sourceVersion,
        observedAt: new Date().toISOString(),
      });
      writeRiskScanPaymentEvidence(evidence, exportConfiguration.outputPath, (path, body) => {
        writeFileSync(path, body, { encoding: "utf8", flag: "wx" });
      });
      process.stdout.write("RISKSCAN_PAY_EVIDENCE_EXPORTED\n");
    } catch {
      writeEvidenceCaptureFailure();
    }
  }
  writeDiagnostic(diagnosticForOutcome(outcome, phase.current));
  if (outcome.kind !== "paid") process.exitCode = 1;
}

async function main(): Promise<void> {
  const exportConfiguration = evidenceExport(process.argv);
  if (exportConfiguration === "exists") {
    writeExistingEvidenceNotice();
    writeDiagnostic({ phase: "configuration" });
    process.exitCode = 1;
    return;
  }
  if (exportConfiguration === "invalid") {
    writeNormalConfigurationFailure();
    process.exitCode = 1;
    return;
  }
  if (process.argv.includes("--preflight")) return preflight();
  return payment(exportConfiguration);
}

void main().catch(() => {
  process.stderr.write("RISKSCAN_PAY_FAILED\n");
  writeDiagnostic({ phase: "terminal" });
  process.exitCode = 1;
});
