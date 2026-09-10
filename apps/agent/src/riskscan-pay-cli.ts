import { createRequire } from "node:module";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { decodePaymentRequiredHeader } from "@x402/core/http";
import type { SchemeNetworkClient } from "@x402/core/types";
import { evaluateRiskScanNativeQuote } from "@tool402/core";

import {
  createRiskScanQuickPaymentAgent,
} from "./riskscan-tool-payment.ts";
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

function requiredEnvironmentValue(name: string): string | null {
  const value = process.env[name]?.trim();
  return value === undefined || value.length === 0 ? null : value;
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
  const payerAccountId = requiredEnvironmentValue("RISKSCAN_PAY_PAYER_ACCOUNT_ID");
  const payerPrivateKey = requiredEnvironmentValue("RISKSCAN_PAY_PAYER_PRIVATE_KEY");
  return service === null || payerAccountId === null || payerPrivateKey === null
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

function writeDiagnostic(phase: Parameters<typeof diagnosticForRiskScanPayPhase>[0]): void {
  process.stdout.write(formatRiskScanPayDiagnostic(diagnosticForRiskScanPayPhase(phase)));
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

async function preflight(): Promise<void> {
  const configuration = readServiceConfiguration();
  if (configuration === null) {
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
    response = await fetch(new URL("/api/riskscan", configuration.serviceBase), unsignedRequest(configuration.input));
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

async function payment(): Promise<void> {
  const configuration = readRuntimeConfiguration();
  if (configuration === null) {
    writeDiagnostic({ phase: "configuration" });
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
    writeDiagnostic({ phase: "payment_payload" });
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
          get(targetResponse, property, receiver) {
            if (property === "json") return async () => {
              phase.current = "result";
              return targetResponse.json();
            };
            return Reflect.get(targetResponse, property, receiver);
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
  writeDiagnostic(diagnosticForOutcome(outcome, phase.current));
  if (outcome.kind !== "paid") process.exitCode = 1;
}

async function main(): Promise<void> {
  if (process.argv.includes("--preflight")) return preflight();
  return payment();
}

void main().catch(() => {
  writeDiagnostic({ phase: "terminal" });
  process.exitCode = 1;
});
