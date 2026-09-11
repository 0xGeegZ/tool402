import type { FacilitatorClient } from "@x402/core/server";
import { assessEntityCheck, parseEntityCheckRequest } from "@tool402/core";
import type { NextRequest, NextResponse as NextResponseType } from "next/server";
import { createRequire } from "node:module";

import {
  readEntityCheckSourceConfiguration,
  readEntityCheckSources,
} from "./entity-check-sources.ts";
import {
  createX402ProtectedHandler,
  readX402Configuration,
} from "./x402-protected-route.ts";
import { readBoundedRequestJson } from "./bounded-request-json.ts";

const require = createRequire(import.meta.url);
const { NextResponse } = require("next/server") as typeof import("next/server");

type EntityCheckProtectedHandler = (
  request: NextRequest,
) => Promise<NextResponseType>;

const protectedHandlerCache = new Map<
  string,
  Promise<EntityCheckProtectedHandler>
>();

export interface EntityCheckPostOptions {
  facilitatorClient?: FacilitatorClient;
  readSources?: typeof readEntityCheckSources;
}

function unavailableResponse(): NextResponseType {
  return NextResponse.json({ error: "entity_check_unavailable" }, { status: 503 });
}

function invalidRequestResponse(): NextResponseType {
  return NextResponse.json(
    { error: "invalid_entity_check_request" },
    { status: 400 },
  );
}

function tooLargeRequestResponse(): NextResponseType {
  return NextResponse.json(
    { error: "entity_check_request_too_large" },
    { status: 413 },
  );
}

function unavailableSourceResponse(kind: "registry_unavailable" | "sanctions_unavailable"): NextResponseType {
  return NextResponse.json({ error: kind }, { status: 503 });
}

async function evaluateEntityCheck(
  request: NextRequest,
  environment: NodeJS.ProcessEnv,
  readSources: typeof readEntityCheckSources,
): Promise<NextResponseType> {
  const body = await readBoundedRequestJson(request);
  if (body.kind === "too_large") return tooLargeRequestResponse();
  if (body.kind === "invalid") return invalidRequestResponse();
  const input = body.value;

  let entityRequest;
  try {
    entityRequest = parseEntityCheckRequest(input as never);
  } catch (error) {
    if (!(error instanceof TypeError || error instanceof RangeError)) {
      throw error;
    }
    return invalidRequestResponse();
  }

  const sourceResult = await readSources(
    entityRequest,
    readEntityCheckSourceConfiguration(environment),
    { fetch: globalThis.fetch, now: Date.now },
  );
  if (sourceResult.kind === "registry_unavailable" || sourceResult.kind === "sanctions_unavailable") {
    return unavailableSourceResponse(sourceResult.kind);
  }
  if (sourceResult.kind !== "read") {
    return unavailableResponse();
  }

  return NextResponse.json(
    assessEntityCheck(entityRequest, {
      registryCandidates: sourceResult.registryCandidates,
      registrySource: sourceResult.registrySource,
      sanctionsDataset: sourceResult.sanctionsDataset,
    }),
  );
}

export async function createEntityCheckProtectedHandler(
  environment: NodeJS.ProcessEnv,
  options: EntityCheckPostOptions = {},
): Promise<EntityCheckProtectedHandler> {
  const configuration = readX402Configuration(environment, "ENTITYCHECK_X402");
  if (configuration === null) {
    throw new RangeError("EntityCheck x402 configuration is unavailable");
  }
  if (readEntityCheckSourceConfiguration(environment) === null) {
    throw new RangeError("EntityCheck source configuration is unavailable");
  }

  const readSources = options.readSources ?? readEntityCheckSources;
  return createX402ProtectedHandler(configuration, {
    facilitatorClient: options.facilitatorClient,
    routePath: "/api/entitycheck",
    routeDescription: "EntityCheck assessment",
    handler: (request) => evaluateEntityCheck(request, environment, readSources),
  });
}

function configurationCacheKey(environment: NodeJS.ProcessEnv): string {
  const configuration = readX402Configuration(environment, "ENTITYCHECK_X402");
  const sources = readEntityCheckSourceConfiguration(environment);

  return JSON.stringify([configuration, sources]);
}

function getCachedEntityCheckProtectedHandler(
  environment: NodeJS.ProcessEnv,
): Promise<EntityCheckProtectedHandler> {
  const key = configurationCacheKey(environment);
  const cachedHandler = protectedHandlerCache.get(key);
  if (cachedHandler !== undefined) {
    return cachedHandler;
  }

  const pendingHandler = createEntityCheckProtectedHandler(environment);
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
  options: EntityCheckPostOptions = {},
): Promise<NextResponseType> {
  const configuration = readX402Configuration(environment, "ENTITYCHECK_X402");
  if (
    configuration === null ||
    readEntityCheckSourceConfiguration(environment) === null
  ) {
    return unavailableResponse();
  }

  try {
    const handler =
      options.facilitatorClient === undefined && options.readSources === undefined
        ? await getCachedEntityCheckProtectedHandler(environment)
        : await createEntityCheckProtectedHandler(environment, options);
    return await handler(request);
  } catch {
    return unavailableResponse();
  }
}
