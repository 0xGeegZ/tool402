import { readRiskScanX402Configuration } from "./riskscan-x402.ts";

export function buildToolDirectory(environment: NodeJS.ProcessEnv) {
  const configuration = readRiskScanX402Configuration(environment);
  const payment = configuration === null
    ? { state: "configuration_required" } as const
    : configuration.kind === "evm"
    ? {
        state: "locally_configured",
        protocol: "x402",
        network: configuration.network,
        price: configuration.price,
      } as const
    : {
        state: "locally_configured",
        protocol: "x402",
        network: configuration.network,
        asset: configuration.price.asset,
        amount: configuration.price.amount,
      } as const;

  return {
    version: "v1",
    tools: [{
      id: "riskscan.quick",
      name: "RiskScan Quick",
      request: {
        method: "POST",
        path: "/api/riskscan",
        contentType: "application/json",
      },
      input: {
        type: "object",
        required: ["requestRef", "subjectRef", "context", "declarations"],
        properties: {
          requestRef: { type: "string", minLength: 1, maxLength: 96 },
          subjectRef: { type: "string", minLength: 1, maxLength: 160 },
          context: { type: "string", minLength: 1, maxLength: 280 },
          declarations: {
            type: "object",
            additionalProperties: false,
            required: ["identity", "pricing", "limitations", "evidence"],
            properties: {
              identity: { type: "boolean" },
              pricing: { type: "boolean" },
              limitations: { type: "boolean" },
              evidence: { type: "boolean" },
            },
          },
        },
      },
      limitations: [
        "quick_assessment_only",
        "caller_declarations_are_not_external_verification",
      ],
      payment,
    }],
  } as const;
}

export function toolDirectoryResponse(environment: NodeJS.ProcessEnv): Response {
  return Response.json(buildToolDirectory(environment), {
    headers: { "cache-control": "no-store" },
  });
}
