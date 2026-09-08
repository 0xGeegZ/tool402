import { createRequire } from "node:module";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import type { SchemeNetworkClient } from "@x402/core/types";

import {
  createRiskScanQuickPaymentAgent,
} from "./riskscan-tool-payment.ts";
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

type RuntimeConfiguration = {
  serviceBase: URL;
  input: unknown;
  policy: unknown;
  payerAccountId: string;
  payerPrivateKey: string;
};

function requiredEnvironmentValue(name: string): string | null {
  const value = process.env[name]?.trim();
  return value === undefined || value.length === 0 ? null : value;
}

function readRuntimeConfiguration(): RuntimeConfiguration | null {
  const serviceBaseValue = requiredEnvironmentValue("RISKSCAN_PAY_SERVICE_BASE_URL");
  const inputValue = requiredEnvironmentValue("RISKSCAN_PAY_INPUT_JSON");
  const policyValue = requiredEnvironmentValue("RISKSCAN_PAY_POLICY_JSON");
  const payerAccountId = requiredEnvironmentValue("RISKSCAN_PAY_PAYER_ACCOUNT_ID");
  const payerPrivateKey = requiredEnvironmentValue("RISKSCAN_PAY_PAYER_PRIVATE_KEY");
  if (
    serviceBaseValue === null ||
    inputValue === null ||
    policyValue === null ||
    payerAccountId === null ||
    payerPrivateKey === null
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
      payerAccountId,
      payerPrivateKey,
    };
  } catch {
    return null;
  }
}

function paymentClientFactory(): RiskScanPaymentClientFactory {
  return (signer, policy) => {
    const client = new x402Client()
      .register("hedera:*", new ExactHederaScheme(signer))
      .setSpendControls({
        maxAmountPerPayment: false,
        allowedAssets: [{
          network: "hedera:testnet",
          asset: policy.asset,
          maxAmountPerPayment: policy.maximumAmount,
        }],
      });
    return new x402HTTPClient(client);
  };
}

function writeOutcome(outcome: RiskScanQuickPaymentOutcome): void {
  process.stdout.write(`RISKSCAN_PAY_OUTCOME ${outcome.kind}\n`);
  if (outcome.kind === "paid") {
    process.stdout.write(`RISKSCAN_PAY_SETTLEMENT ${outcome.settlementRef}\n`);
  }
}

async function main(): Promise<void> {
  const configuration = readRuntimeConfiguration();
  if (configuration === null) {
    process.stderr.write("RISKSCAN_PAY_CONFIGURATION_INVALID\n");
    process.exitCode = 1;
    return;
  }
  let signer;
  try {
    signer = createClientHederaSigner(
      configuration.payerAccountId,
      PrivateKey.fromString(configuration.payerPrivateKey),
      { network: "hedera:testnet" },
    );
  } catch {
    process.stderr.write("RISKSCAN_PAY_CONFIGURATION_INVALID\n");
    process.exitCode = 1;
    return;
  }
  const agent = createRiskScanQuickPaymentAgent({
    signer,
    directoryFetcher: (target, init) => fetch(target, init),
    requestSender: (target, init) => fetch(target, init),
    paymentClientFactory: paymentClientFactory(),
  });
  const outcome = await agent.pay(
    configuration.serviceBase,
    configuration.input,
    configuration.policy,
  );
  writeOutcome(outcome);
  if (outcome.kind !== "paid") process.exitCode = 1;
}

void main().catch(() => {
  process.stderr.write("RISKSCAN_PAY_FAILED\n");
  process.exitCode = 1;
});
