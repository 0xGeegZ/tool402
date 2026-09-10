import { readX402Configuration } from "./x402-protected-route.ts";

type LocalX402Summary =
  | { state: "configuration_required" }
  | {
      state: "locally_configured";
      protocol: "x402";
      network: `eip155:${number}`;
      price: `$${string}`;
    }
  | {
      state: "locally_configured";
      protocol: "x402";
      network: "hedera:testnet";
      asset: `${number}.${number}.${number}`;
      amount: `${bigint}`;
    };

function localX402Summary(environment: NodeJS.ProcessEnv): LocalX402Summary {
  const configuration = readX402Configuration(environment, "ENTITYCHECK_X402");

  return configuration === null
    ? { state: "configuration_required" }
    : configuration.kind === "evm"
    ? {
        state: "locally_configured",
        protocol: "x402",
        network: configuration.network,
        price: configuration.price,
      }
    : {
        state: "locally_configured",
        protocol: "x402",
        network: configuration.network,
        asset: configuration.price.asset,
        amount: configuration.price.amount,
      };
}

export function buildEntityCheckToolDescriptor(environment: NodeJS.ProcessEnv) {
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
    limitations: [
      "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.",
    ],
    configuration: localX402Summary(environment),
  } as const;
}
