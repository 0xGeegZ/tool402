import { createRequire } from "node:module";
import type { FacilitatorClient } from "@x402/core/server";
import { assessEntityCheck, parseEntityCheckRequest } from "@tool402/core";
import type { EntityCheckRequest } from "@tool402/core";
import type {
  NextRequest,
  NextResponse as NextResponseType,
} from "next/server";

import {
  readEntityCheckSourceConfiguration,
  readEntityCheckSources,
  type EntityCheckSourceConfiguration,
  type EntityCheckSourceDependencies,
} from "./entity-check-sources.ts";
import {
  createX402ProtectedHandler,
  readX402Configuration,
  unavailableResponse,
  x402ConfigurationCacheKey,
  type X402Configuration,
  type X402ProtectedHandler,
  type X402RouteEvaluation,
} from "./x402-protected-route.ts";

const require = createRequire(import.meta.url);
const { NextResponse } = require("next/server") as typeof import("next/server");

const environmentPrefix = "ENTITYCHECK_X402";
const protectedHandlerCache = new Map<string, Promise<X402ProtectedHandler>>();

export type EntityCheckX402Configuration = X402Configuration;

export interface EntityCheckPostOptions {
  facilitatorClient?: FacilitatorClient;
  sourceDependencies?: EntityCheckSourceDependencies;
}

export function readEntityCheckX402Configuration(
  environment: NodeJS.ProcessEnv,
): EntityCheckX402Configuration | null {
  return readX402Configuration(environment, environmentPrefix);
}

export function entityCheckUnavailableResponse(): NextResponseType {
  return unavailableResponse("entity_check_unavailable");
}

function invalidEntityCheckRequestResponse(): NextResponseType {
  return NextResponse.json(
    { error: "invalid_entitycheck_request" },
    { status: 400 },
  );
}

function createEntityCheckEvaluator(
  sourceConfiguration: EntityCheckSourceConfiguration,
  dependencies: EntityCheckSourceDependencies,
): (request: NextRequest) => Promise<X402RouteEvaluation> {
  return async (request) => {
    let input: unknown;

    try {
      input = await request.json();
    } catch {
      return { response: invalidEntityCheckRequestResponse() };
    }

    let parsed: EntityCheckRequest;

    try {
      parsed = parseEntityCheckRequest(input);
    } catch (error) {
      if (!(error instanceof TypeError || error instanceof RangeError)) {
        throw error;
      }

      return { response: invalidEntityCheckRequestResponse() };
    }

    const outcome = await readEntityCheckSources(
      parsed,
      sourceConfiguration,
      dependencies,
    );

    if (outcome.kind !== "read") {
      return {
        response: unavailableResponse(
          outcome.kind === "not_configured"
            ? "entity_check_unavailable"
            : outcome.kind,
        ),
      };
    }

    const result = assessEntityCheck(parsed, {
      registryCandidates: outcome.registryCandidates,
      registrySource: outcome.registrySource,
      sanctionsDataset: outcome.sanctionsDataset,
    });

    return { response: NextResponse.json(result) };
  };
}

export function createEntityCheckProtectedHandler(
  configuration: EntityCheckX402Configuration,
  sourceConfiguration: EntityCheckSourceConfiguration,
  options: EntityCheckPostOptions = {},
): Promise<X402ProtectedHandler> {
  const dependencies = options.sourceDependencies ?? {
    fetch: globalThis.fetch,
    now: Date.now,
  };

  return createX402ProtectedHandler(
    {
      path: "/api/entitycheck",
      description: "EntityCheck company registry record and sanctions screen",
      evaluate: createEntityCheckEvaluator(sourceConfiguration, dependencies),
    },
    configuration,
    { facilitatorClient: options.facilitatorClient },
  );
}

function getCachedEntityCheckProtectedHandler(
  configuration: EntityCheckX402Configuration,
  sourceConfiguration: EntityCheckSourceConfiguration,
): Promise<X402ProtectedHandler> {
  const key = JSON.stringify([
    x402ConfigurationCacheKey(configuration),
    sourceConfiguration.registryBaseUrl,
    sourceConfiguration.sanctionsUrl,
  ]);
  const cachedHandler = protectedHandlerCache.get(key);

  if (cachedHandler !== undefined) {
    return cachedHandler;
  }

  const pendingHandler = createEntityCheckProtectedHandler(
    configuration,
    sourceConfiguration,
  );
  protectedHandlerCache.set(key, pendingHandler);
  void pendingHandler.catch(() => {
    if (protectedHandlerCache.get(key) === pendingHandler) {
      protectedHandlerCache.delete(key);
    }
  });

  return pendingHandler;
}

export async function handleEntityCheckPost(
  request: NextRequest,
  environment: NodeJS.ProcessEnv,
  options?: EntityCheckPostOptions,
): Promise<NextResponseType> {
  const configuration = readEntityCheckX402Configuration(environment);
  const sourceConfiguration = readEntityCheckSourceConfiguration(environment);

  if (configuration === null || sourceConfiguration === null) {
    return entityCheckUnavailableResponse();
  }

  let handler: X402ProtectedHandler;

  try {
    handler =
      options === undefined
        ? await getCachedEntityCheckProtectedHandler(
            configuration,
            sourceConfiguration,
          )
        : await createEntityCheckProtectedHandler(
            configuration,
            sourceConfiguration,
            options,
          );
  } catch {
    return entityCheckUnavailableResponse();
  }

  return handler(request);
}
