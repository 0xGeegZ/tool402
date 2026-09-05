import { createRequire } from "node:module";
import type { FacilitatorClient, RoutesConfig } from "@x402/core/server";
import type { RiskScanQuickInput } from "@tool402/core";
import type { NextRequest, NextResponse as NextResponseType } from "next/server";

const require = createRequire(import.meta.url);
const { NextResponse } = require("next/server") as typeof import("next/server");

type RiskScanProtectedHandler = (
  request: NextRequest,
) => Promise<NextResponseType>;

const protectedHandlerCache = new Map<
  string,
  Promise<RiskScanProtectedHandler>
>();

const configurationKeys = [
  "RISKSCAN_X402_PAY_TO",
  "RISKSCAN_X402_FACILITATOR_URL",
  "RISKSCAN_X402_NETWORK",
  "RISKSCAN_X402_PRICE",
] as const;

export interface RiskScanX402Configuration {
  payTo: `0x${string}`;
  facilitatorUrl: string;
  network: `eip155:${number}`;
  price: `$${string}`;
}

function requiredString(value: string | undefined): string | null {
  const trimmedValue = value?.trim();

  return trimmedValue === undefined || trimmedValue.length === 0
    ? null
    : trimmedValue;
}

function isValidFacilitatorUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname.length > 0 &&
      url.username.length === 0 &&
      url.password.length === 0
    );
  } catch {
    return false;
  }
}

export function readRiskScanX402Configuration(
  environment: NodeJS.ProcessEnv,
): RiskScanX402Configuration | null {
  const [payTo, facilitatorUrl, network, price] = configurationKeys.map(
    (key) => requiredString(environment[key]),
  );

  if (
    payTo === null ||
    facilitatorUrl === null ||
    network === null ||
    price === null ||
    !/^0x[\da-f]{40}$/iu.test(payTo) ||
    !isValidFacilitatorUrl(facilitatorUrl) ||
    !/^eip155:[1-9]\d*$/u.test(network) ||
    !/^\$(?:0\.\d*[1-9]\d*|[1-9]\d*(?:\.\d+)?)$/u.test(price)
  ) {
    return null;
  }

  return {
    payTo: payTo as `0x${string}`,
    facilitatorUrl,
    network: network as `eip155:${number}`,
    price: price as `$${string}`,
  };
}

export function riskScanUnavailableResponse(): NextResponseType {
  return NextResponse.json({ error: "risk_scan_unavailable" }, { status: 503 });
}

function invalidRiskScanRequestResponse(): NextResponseType {
  return NextResponse.json(
    { error: "invalid_riskscan_request" },
    { status: 400 },
  );
}

function loadRiskScanQuick() {
  return require("@tool402/core") as typeof import("@tool402/core");
}

function loadExactEvmScheme() {
  return require("@x402/evm/exact/server") as typeof import("@x402/evm/exact/server");
}

function loadX402ServerDependencies() {
  const { HTTPFacilitatorClient, x402HTTPResourceServer, x402ResourceServer } = require(
    "@x402/core/server",
  ) as typeof import("@x402/core/server");
  const { withX402FromHTTPServer } = require("@x402/next") as typeof import("@x402/next");

  return {
    HTTPFacilitatorClient,
    withX402FromHTTPServer,
    x402HTTPResourceServer,
    x402ResourceServer,
  };
}

export async function isRiskScanX402ConfigurationUsable(
  configuration: RiskScanX402Configuration,
): Promise<boolean> {
  try {
    const { ExactEvmScheme } = loadExactEvmScheme();
    const parsedPrice = await new ExactEvmScheme().parsePrice(
      configuration.price,
      configuration.network,
    );

    return /^\d+$/u.test(parsedPrice.amount) && BigInt(parsedPrice.amount) > 0n;
  } catch {
    return false;
  }
}

export async function runRiskScanQuick(
  request: NextRequest,
): Promise<NextResponseType> {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return invalidRiskScanRequestResponse();
  }

  const { assessRiskScanQuick } = loadRiskScanQuick();
  let assessment: ReturnType<typeof assessRiskScanQuick>;

  try {
    assessment = assessRiskScanQuick(input as RiskScanQuickInput);
  } catch (error) {
    if (!(error instanceof TypeError || error instanceof RangeError)) {
      throw error;
    }

    return invalidRiskScanRequestResponse();
  }

  return NextResponse.json(assessment);
}

export interface RiskScanProtectedHandlerOptions {
  facilitatorClient?: FacilitatorClient;
}

export async function createRiskScanProtectedHandler(
  configuration: RiskScanX402Configuration,
  options: RiskScanProtectedHandlerOptions = {},
): Promise<RiskScanProtectedHandler> {
  if (!(await isRiskScanX402ConfigurationUsable(configuration))) {
    throw new RangeError("x402 configuration cannot produce a positive EVM amount");
  }

  const {
    HTTPFacilitatorClient,
    withX402FromHTTPServer,
    x402HTTPResourceServer,
    x402ResourceServer,
  } = loadX402ServerDependencies();
  const { ExactEvmScheme } = loadExactEvmScheme();
  const facilitatorClient =
    options.facilitatorClient ??
    new HTTPFacilitatorClient({ url: configuration.facilitatorUrl });
  const server = new x402ResourceServer(facilitatorClient).register(
    configuration.network,
    new ExactEvmScheme(),
  );

  const routes = {
    "/api/riskscan": {
      accepts: {
        scheme: "exact",
        payTo: configuration.payTo,
        price: configuration.price,
        network: configuration.network,
      },
      description: "RiskScan Quick assessment",
      mimeType: "application/json",
    },
  } satisfies RoutesConfig;
  const httpServer = new x402HTTPResourceServer(server, routes);

  await httpServer.initialize();

  return withX402FromHTTPServer(
    runRiskScanQuick,
    httpServer,
    undefined,
    undefined,
    false,
  );
}

function configurationCacheKey(configuration: RiskScanX402Configuration): string {
  return JSON.stringify([
    configuration.payTo,
    configuration.facilitatorUrl,
    configuration.network,
    configuration.price,
  ]);
}

function getCachedRiskScanProtectedHandler(
  configuration: RiskScanX402Configuration,
): Promise<RiskScanProtectedHandler> {
  const key = configurationCacheKey(configuration);
  const cachedHandler = protectedHandlerCache.get(key);

  if (cachedHandler !== undefined) {
    return cachedHandler;
  }

  const pendingHandler = createRiskScanProtectedHandler(configuration);
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

  let handler: RiskScanProtectedHandler;

  try {
    handler =
      options?.facilitatorClient === undefined
        ? await getCachedRiskScanProtectedHandler(configuration)
        : await createRiskScanProtectedHandler(configuration, options);
  } catch {
    return riskScanUnavailableResponse();
  }

  return handler(request);
}
