import type {
  DirectoryProjectionOutcome,
  OfferingProjectionOutcome,
  OfferingProjectionRecord,
  OfferingState,
  ProjectionFailure,
} from "../../../lib/offering-projection";

export const NOT_RECORDED = "not recorded";

export type NextAction = Readonly<{ label: string; control: "/provider/deploy" | null }>;

const nextActions: Record<OfferingState, NextAction> = {
  DRAFT: Object.freeze({ label: "Prepare the revenue note asset", control: "/provider/deploy" }),
  ASSET_PENDING: Object.freeze({ label: "Create the note in MetaMask", control: "/provider/deploy" }),
  READY: Object.freeze({ label: "Publish the directory version", control: "/provider/deploy" }),
  OPEN: Object.freeze({ label: "Whitelist the first backer and issue their units", control: "/provider/deploy" }),
  CLOSED: Object.freeze({ label: "None. The offering is closed.", control: null }),
};

const outcomeStatements: Record<ProjectionFailure["kind"], string> = {
  not_configured: "No backend deployment is configured on this host, so no record was read.",
  absent: "The backend holds no record for this identifier.",
  unavailable: "The backend could not be reached, so no record was read.",
  unexpected_response: "The backend answered in a shape this page does not render, so no record is shown.",
};

const assetStates: readonly OfferingState[] = ["READY", "OPEN", "CLOSED"];
const preparedStates: readonly OfferingState[] = ["ASSET_PENDING", "READY", "OPEN", "CLOSED"];

export function nextActionFor(state: string): NextAction {
  if (!Object.hasOwn(nextActions, state)) {
    throw new TypeError("unknown offering state");
  }
  return nextActions[state as OfferingState];
}

export function outcomeStatement(kind: string): string {
  if (!Object.hasOwn(outcomeStatements, kind)) {
    throw new TypeError("unknown projection outcome");
  }
  return outcomeStatements[kind as ProjectionFailure["kind"]];
}

export function formatAcceptedAt(value: string): string {
  if (!/^(?:0|[1-9][0-9]*)$/u.test(value)) return NOT_RECORDED;
  const milliseconds = Number(value);
  if (!Number.isSafeInteger(milliseconds)) return NOT_RECORDED;
  try {
    return new Date(milliseconds).toISOString();
  } catch {
    return NOT_RECORDED;
  }
}

export function hashscanLink(record: OfferingProjectionRecord): string | null {
  return record.atsAssetEvmAddress !== undefined && assetStates.includes(record.state)
    ? "https://hashscan.io/testnet/contract/" + record.atsAssetEvmAddress
    : null;
}

export type EvidenceRow = Readonly<{ record: string; reference: string; verification: string; time: string }>;

function row(record: string, reference: string, verification: string, time: string): EvidenceRow {
  return Object.freeze({ record, reference, verification, time });
}

export function evidenceRows(
  offering: OfferingProjectionOutcome,
  directory: DirectoryProjectionOutcome,
): readonly EvidenceRow[] {
  const loaded = offering.kind === "loaded" ? offering.record : null;
  const prepared = loaded !== null && preparedStates.includes(loaded.state);
  const addressRecorded = loaded !== null && loaded.atsAssetEvmAddress !== undefined && assetStates.includes(loaded.state);
  return Object.freeze([
    row(
      "offering.create",
      loaded === null ? NOT_RECORDED : `${loaded.offeringPublicId} v${loaded.version}`,
      loaded === null ? NOT_RECORDED : "signed command admitted",
      loaded === null ? NOT_RECORDED : formatAcceptedAt(loaded.acceptedAt),
    ),
    row("external.prepare ATS_CREATE", NOT_RECORDED, prepared ? "prepared attempt recorded" : NOT_RECORDED, NOT_RECORDED),
    row(
      "revenue note",
      loaded?.atsAssetEvmAddress ?? NOT_RECORDED,
      addressRecorded ? "address recorded" : NOT_RECORDED,
      NOT_RECORDED,
    ),
    directory.kind === "loaded"
      ? row(
          "directory.publish",
          `riskscan v${directory.directoryVersion}`,
          `published directory version ${directory.directoryVersion}`,
          directory.record.publishedAt,
        )
      : row("directory.publish", NOT_RECORDED, NOT_RECORDED, NOT_RECORDED),
  ]);
}
