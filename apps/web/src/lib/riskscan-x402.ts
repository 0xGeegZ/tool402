import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import type {
  AfterSettleHook,
  FacilitatorClient,
  OnSettleFailureHook,
  OnVerifiedPaymentCanceledHook,
  RoutesConfig,
} from "@x402/core/server";
import type {
  RiskScanQuickInput,
  RiskScanRequestInput,
  RiskScanVerifiedSettlement,
} from "@tool402/core";
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

const defaultSettlementObserverTimeoutMs = 30_000;
const maximumSettlementObserverTimeoutMs = 60_000;

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

function digest(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
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

interface RiskScanQuickEvaluation {
  response: NextResponseType;
  request?: RiskScanRequestInput;
}

async function evaluateRiskScanQuick(
  request: NextRequest,
): Promise<RiskScanQuickEvaluation> {
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
    request: {
      requestRef: assessment.requestRef,
      subjectRef: assessment.subjectRef,
      context: assessment.context,
    },
  };
}

export async function runRiskScanQuick(
  request: NextRequest,
): Promise<NextResponseType> {
  return (await evaluateRiskScanQuick(request)).response;
}

export interface RiskScanProtectedHandlerOptions {
  facilitatorClient?: FacilitatorClient;
  onVerifiedSettlement?: (
    settlement: RiskScanVerifiedSettlement,
  ) => void | Promise<void>;
  /** @internal Test-only handler-construction seam for bounded observer cleanup. */
  settlementObserverTimeoutMs?: number;
}

interface SettlementObserverEntry {
  pending: ReturnType<typeof import("@tool402/core")["markRiskScanPaymentPending"]>;
  responseDigest: string;
  timeout: ReturnType<typeof setTimeout>;
}

interface SettlementObserver {
  observeProtectedResponse(
    paymentSignature: string,
    response: NextResponseType,
    request: RiskScanRequestInput,
  ): Promise<void>;
  onAfterSettle: AfterSettleHook;
  onSettleFailure: OnSettleFailureHook;
  onVerifiedPaymentCanceled: OnVerifiedPaymentCanceledHook;
}

function resolveSettlementObserverTimeout(
  configuredTimeout: number | undefined,
): number {
  if (configuredTimeout === undefined) {
    return defaultSettlementObserverTimeoutMs;
  }

  if (
    !Number.isSafeInteger(configuredTimeout) ||
    configuredTimeout < 1 ||
    configuredTimeout > maximumSettlementObserverTimeoutMs
  ) {
    throw new RangeError("settlement observer timeout must be a bounded positive integer");
  }

  return configuredTimeout;
}

function createSettlementObserver(
  configuration: RiskScanX402Configuration,
  consumer: NonNullable<RiskScanProtectedHandlerOptions["onVerifiedSettlement"]>,
  timeoutMs: number,
): SettlementObserver {
  const entries = new Map<string, SettlementObserverEntry>();

  function discard(headerDigest: string): void {
    const entry = entries.get(headerDigest);

    if (entry !== undefined) {
      clearTimeout(entry.timeout);
      entries.delete(headerDigest);
    }
  }

  function discardForHeader(value: unknown): void {
    if (typeof value !== "string" || value.trim().length === 0) {
      return;
    }

    discard(digest(value));
  }

  function record(value: unknown): Record<string, unknown> | undefined {
    return typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : undefined;
  }

  function paymentHeaderFromContext(value: unknown): string | undefined {
    const transportContext = record(value);
    const request = record(transportContext?.request);
    const paymentHeader = request?.paymentHeader;

    return typeof paymentHeader === "string" ? paymentHeader : undefined;
  }

  function responseBodyFromContext(value: unknown): Uint8Array | undefined {
    const responseBody = record(value)?.responseBody;

    return responseBody instanceof Uint8Array ? responseBody : undefined;
  }

  return {
    async observeProtectedResponse(paymentSignature, response, request) {
      let headerDigest: string | undefined;

      try {
        const registrationDigest = digest(paymentSignature);
        headerDigest = registrationDigest;
        const responseBytes = new Uint8Array(await response.clone().arrayBuffer());

        if (entries.has(registrationDigest)) {
          return;
        }

        const { markRiskScanPaymentPending, startRiskScanRequest } =
          loadRiskScanQuick();
        const pending = markRiskScanPaymentPending(startRiskScanRequest(request));
        const timeout = setTimeout(() => {
          discard(registrationDigest);
        }, timeoutMs);
        timeout.unref?.();
        entries.set(registrationDigest, {
          pending,
          responseDigest: digest(responseBytes),
          timeout,
        });
      } catch {
        if (headerDigest !== undefined) {
          discard(headerDigest);
        }
      }
    },
    async onAfterSettle(context) {
      let headerDigest: string | undefined;

      try {
        const paymentHeader = paymentHeaderFromContext(context.transportContext);

        if (typeof paymentHeader !== "string" || paymentHeader.trim().length === 0) {
          return;
        }

        headerDigest = digest(paymentHeader);
        const entry = entries.get(headerDigest);

        if (entry === undefined) {
          return;
        }

        const transaction = context.result.transaction;
        const responseBytes = responseBodyFromContext(context.transportContext);

        if (
          context.paymentPayload.x402Version !== 2 ||
          context.phase !== "after-handler" ||
          context.result.success !== true ||
          context.requirements.network !== configuration.network ||
          context.result.network !== configuration.network ||
          typeof transaction !== "string" ||
          transaction.trim().length === 0 ||
          responseBytes === undefined ||
          digest(responseBytes) !== entry.responseDigest
        ) {
          discard(headerDigest);
          return;
        }

        discard(headerDigest);
        const { createRiskScanVerifiedSettlement } = loadRiskScanQuick();
        const settlement = createRiskScanVerifiedSettlement(entry.pending, {
          requestRef: entry.pending.requestRef,
          settlementRef: transaction.trim(),
        });

        await consumer(settlement);
      } catch {
        if (headerDigest !== undefined) {
          discard(headerDigest);
        }
      }
    },
    async onSettleFailure(context) {
      try {
        discardForHeader(paymentHeaderFromContext(context.transportContext));
      } catch {
        // The observer must not affect the native x402 failure path.
      }
    },
    async onVerifiedPaymentCanceled(context) {
      try {
        discardForHeader(paymentHeaderFromContext(context.transportContext));
      } catch {
        // The observer must not affect the native x402 failure path.
      }
    },
  };
}

async function runObservedRiskScanQuick(
  request: NextRequest,
  observer: SettlementObserver,
): Promise<NextResponseType> {
  const evaluation = await evaluateRiskScanQuick(request);
  const paymentSignature = request.headers.get("payment-signature");

  if (
    evaluation.request !== undefined &&
    typeof paymentSignature === "string" &&
    paymentSignature.trim().length > 0
  ) {
    await observer.observeProtectedResponse(
      paymentSignature,
      evaluation.response,
      evaluation.request,
    );
  }

  return evaluation.response;
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
  const observer =
    options.onVerifiedSettlement === undefined
      ? undefined
      : createSettlementObserver(
          configuration,
          options.onVerifiedSettlement,
          resolveSettlementObserverTimeout(options.settlementObserverTimeoutMs),
        );

  if (observer !== undefined) {
    server
      .onAfterSettle(observer.onAfterSettle)
      .onSettleFailure(observer.onSettleFailure)
      .onVerifiedPaymentCanceled(observer.onVerifiedPaymentCanceled);
  }

  const routes = {
    "/api/riskscan": {
      accepts: {
        scheme: "exact",
        payTo: configuration.payTo,
        price: configuration.price,
        network: configuration.network,
        extra: { paymentFlow: "authorization" },
      },
      description: "RiskScan Quick assessment",
      mimeType: "application/json",
    },
  } satisfies RoutesConfig;
  const httpServer = new x402HTTPResourceServer(server, routes);

  await httpServer.initialize();

  return withX402FromHTTPServer(
    observer === undefined
      ? runRiskScanQuick
      : (request) => runObservedRiskScanQuick(request, observer),
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
