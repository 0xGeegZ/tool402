import { createRequire } from "node:module";
import type { FacilitatorClient } from "@x402/core/server";
import type { RiskScanQuickInput } from "@tool402/core";
import type {
  NextRequest,
  NextResponse as NextResponseType,
} from "next/server";

import { recordRiskScanVerifiedSettlement } from "./riskscan-settlement-evidence.ts";
import {
  createX402ProtectedHandler,
  isX402ConfigurationUsable,
  readX402Configuration,
  unavailableResponse,
  x402ConfigurationCacheKey,
  type EvmX402Configuration,
  type HederaX402Configuration,
  type X402Configuration,
  type X402ProtectedHandler,
  type X402ProtectedHandlerOptions,
  type X402RouteEvaluation,
} from "./x402-protected-route.ts";

const require = createRequire(import.meta.url);
const { NextResponse } = require("next/server") as typeof import("next/server");

const environmentPrefix = "RISKSCAN_X402";
const protectedHandlerCache = new Map<string, Promise<X402ProtectedHandler>>();

export type RiskScanEvmX402Configuration = EvmX402Configuration;
export type RiskScanHederaX402Configuration = HederaX402Configuration;
export type RiskScanX402Configuration = X402Configuration;
export type RiskScanProtectedHandlerOptions = X402ProtectedHandlerOptions;

export function readRiskScanX402Configuration(
  environment: NodeJS.ProcessEnv,
): RiskScanX402Configuration | null {
  return readX402Configuration(environment, environmentPrefix);
}

export function riskScanUnavailableResponse(): NextResponseType {
  return unavailableResponse("risk_scan_unavailable");
}

export const isRiskScanX402ConfigurationUsable = isX402ConfigurationUsable;

function invalidRiskScanRequestResponse(): NextResponseType {
  return NextResponse.json(
    { error: "invalid_riskscan_request" },
    { status: 400 },
  );
}

function loadRiskScanQuick() {
  return require("@tool402/core") as typeof import("@tool402/core");
}

async function evaluateRiskScanQuick(
  request: NextRequest,
): Promise<X402RouteEvaluation> {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return { response: invalidRiskScanRequestResponse() };
  }

  const { assessRiskScanQuick } = loadRiskScanQuick();
  let assessment: ReturnType<typeof assessRiskScanQuick>;

  try {
    assessment = assessRiskScanQuick(input as RiskScanQuickInput);
  } catch (error) {
    if (!(error instanceof TypeError || error instanceof RangeError)) {
      throw error;
    }

    return { response: invalidRiskScanRequestResponse() };
  }

  return {
    response: NextResponse.json(assessment),
    observedRequest: {
      requestRef: assessment.requestRef,
      subjectRef: assessment.subjectRef,
      context: assessment.context,
    },
  };
}

const riskScanRouteDefinition = Object.freeze({
  path: "/api/riskscan",
  description: "RiskScan Quick assessment",
  evaluate: evaluateRiskScanQuick,
});

export async function runRiskScanQuick(
  request: NextRequest,
): Promise<NextResponseType> {
  return (await evaluateRiskScanQuick(request)).response;
}

export function createRiskScanProtectedHandler(
  configuration: RiskScanX402Configuration,
  options: RiskScanProtectedHandlerOptions = {},
): Promise<X402ProtectedHandler> {
  return createX402ProtectedHandler(
    riskScanRouteDefinition,
    configuration,
    options,
  );
}

function getCachedRiskScanProtectedHandler(
  configuration: RiskScanX402Configuration,
): Promise<X402ProtectedHandler> {
  const key = x402ConfigurationCacheKey(configuration);
  const cachedHandler = protectedHandlerCache.get(key);

  if (cachedHandler !== undefined) {
    return cachedHandler;
  }

  const pendingHandler = createRiskScanProtectedHandler(configuration, {
    onVerifiedSettlement: recordRiskScanVerifiedSettlement,
  });
  protectedHandlerCache.set(key, pendingHandler);
  void pendingHandler.catch(() => {
    if (protectedHandlerCache.get(key) === pendingHandler) {
      protectedHandlerCache.delete(key);
    }
  });

  return pendingHandler;
}

export interface RiskScanPostOptions {
  facilitatorClient?: FacilitatorClient;
  onVerifiedSettlement?: RiskScanProtectedHandlerOptions["onVerifiedSettlement"];
}

export async function handleRiskScanPost(
  request: NextRequest,
  environment: NodeJS.ProcessEnv,
  options?: RiskScanPostOptions,
): Promise<NextResponseType> {
  const configuration = readRiskScanX402Configuration(environment);

  if (configuration === null) {
    return riskScanUnavailableResponse();
  }

  let handler: X402ProtectedHandler;

  const onVerifiedSettlement =
    options?.onVerifiedSettlement ?? recordRiskScanVerifiedSettlement;

  try {
    handler =
      options?.facilitatorClient === undefined &&
      options?.onVerifiedSettlement === undefined
        ? await getCachedRiskScanProtectedHandler(configuration)
        : await createRiskScanProtectedHandler(configuration, {
            facilitatorClient: options?.facilitatorClient,
            onVerifiedSettlement,
          });
  } catch {
    return riskScanUnavailableResponse();
  }

  return handler(request);
}
