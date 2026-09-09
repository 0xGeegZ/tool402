import { ENTITY_CHECK_BASELINE_LIMITATION } from "@tool402/core";

import { readX402Configuration } from "./x402-protected-route.ts";

const environmentPrefix = "ENTITYCHECK_X402";
const configurationKeys = [
  "PAY_TO",
  "FACILITATOR_URL",
  "NETWORK",
  "PRICE",
  "HEDERA_ASSET",
  "HEDERA_AMOUNT",
].map((suffix) => `${environmentPrefix}_${suffix}`);

function ownPrefixedEnvironment(
  environment: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  const view: Record<string, string | undefined> = {};
  for (const key of configurationKeys) {
    if (Object.hasOwn(environment, key)) view[key] = environment[key];
  }
  return view as NodeJS.ProcessEnv;
}

export function buildEntityCheckToolDescriptor(environment: NodeJS.ProcessEnv) {
  const configuration = readX402Configuration(
    ownPrefixedEnvironment(environment),
    environmentPrefix,
  );
  const summary =
    configuration === null
      ? ({ state: "configuration_required" } as const)
      : configuration.kind === "evm"
        ? ({
            state: "locally_configured",
            protocol: "x402",
            network: configuration.network,
            price: configuration.price,
          } as const)
        : ({
            state: "locally_configured",
            protocol: "x402",
            network: configuration.network,
            asset: configuration.price.asset,
            amount: configuration.price.amount,
          } as const);

  return {
    id: "entitycheck.fr",
    name: "EntityCheck France",
    request: {
      method: "POST",
      path: "/api/entitycheck",
      contentType: "application/json",
    },
    input: {
      type: "object",
      required: ["requestRef", "jurisdiction", "query"],
      properties: {
        requestRef: { type: "string", minLength: 1, maxLength: 96 },
        jurisdiction: { type: "string", enum: ["FR"] },
        query: { type: "string", minLength: 1, maxLength: 160 },
        registrationNumber: { type: "string", pattern: "^[0-9]{9}$" },
      },
      additionalProperties: false,
    },
    result: {
      dispositions: ["found", "ambiguous", "not_found"],
      sanctionsScreen: ["clear", "hit", "not_screened"],
    },
    sources: ["FR_RECHERCHE_ENTREPRISES", "OFAC_SDN"],
    limitations: [ENTITY_CHECK_BASELINE_LIMITATION],
    configuration: summary,
  } as const;
}
