import {
  validateRiskScanRequest,
  type RiskScanRequest,
  type RiskScanRequestInput,
} from "./risk-scan.ts";

export type RiskScanQuickDeclaration =
  | "identity"
  | "pricing"
  | "limitations"
  | "evidence";

export type RiskScanQuickDeclarations = Record<
  RiskScanQuickDeclaration,
  boolean
>;

export interface RiskScanQuickInput extends RiskScanRequestInput {
  declarations: RiskScanQuickDeclarations;
}

export type RiskScanQuickDisposition =
  | "needs_disclosure"
  | "disclosures_reported";

export interface RiskScanQuickResult extends RiskScanRequest {
  disposition: RiskScanQuickDisposition;
  reasons: string[];
  limitations: string[];
}

const declarationOrder: readonly RiskScanQuickDeclaration[] = [
  "identity",
  "pricing",
  "limitations",
  "evidence",
];

const declarationLabels: Record<RiskScanQuickDeclaration, string> = {
  identity: "identity disclosure",
  pricing: "pricing disclosure",
  limitations: "limitations disclosure",
  evidence: "evidence disclosure",
};

const quickLimitation =
  "Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record.";

function validateDeclarations(value: unknown): RiskScanQuickDeclarations {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("declarations must be an object");
  }

  const declarations = value as Record<string, unknown>;
  const validatedDeclarations = {} as RiskScanQuickDeclarations;

  for (const declaration of Reflect.ownKeys(declarations)) {
    if (
      typeof declaration !== "string" ||
      !declarationOrder.includes(declaration as RiskScanQuickDeclaration)
    ) {
      throw new RangeError(`unsupported declaration: ${String(declaration)}`);
    }
  }

  for (const declaration of declarationOrder) {
    const reported = declarations[declaration];

    if (!Object.hasOwn(declarations, declaration) || typeof reported !== "boolean") {
      throw new TypeError(`${declaration} must be a boolean`);
    }

    validatedDeclarations[declaration] = reported;
  }

  return validatedDeclarations;
}

export function assessRiskScanQuick(
  input: RiskScanQuickInput,
): RiskScanQuickResult {
  const request = validateRiskScanRequest(input);
  const declarations = validateDeclarations(input.declarations);
  const missingDeclarations = declarationOrder.filter(
    (declaration) => !declarations[declaration],
  );

  if (missingDeclarations.length > 0) {
    return {
      ...request,
      disposition: "needs_disclosure",
      reasons: missingDeclarations.map(
        (declaration) => declarationLabels[declaration],
      ),
      limitations: [quickLimitation],
    };
  }

  return {
    ...request,
    disposition: "disclosures_reported",
    reasons: declarationOrder.map(
      (declaration) => `caller reported ${declarationLabels[declaration]}`,
    ),
    limitations: [quickLimitation],
  };
}
