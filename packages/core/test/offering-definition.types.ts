import { parseOfferingDefinition } from "../src/index.ts";
import type {
  OfferingDefinition,
  OfferingTerms,
  Tinybar,
} from "../src/index.ts";

const input = {
  schemaVersion: 1,
  terms: {
    version: "offering-v1",
    fundingTargetTinybars: "200",
    noteUnitPriceTinybars: "10",
    maximumNoteUnits: "10",
    minimumPurchaseUnits: "1",
    reserveShareBps: "2000",
    issuerShareBps: "8000",
    platformFeeBps: "0",
    payoutCapTinybars: "300",
  },
  maturityAt: "2026-12-31T00:00:00.000Z",
  qualifyingResource: "riskscan.quick",
};

const definition: OfferingDefinition = parseOfferingDefinition(input);
const terms: OfferingTerms = definition.terms;
const schemaVersion: 1 = definition.schemaVersion;

// @ts-expect-error A parsed terms version is text, not a branded tinybar.
const versionAsTinybar: Tinybar = terms.version;
// @ts-expect-error The parser does not return an arbitrary schema version.
const unsupportedSchemaVersion: 2 = schemaVersion;

void definition;
void terms;
void schemaVersion;
void versionAsTinybar;
void unsupportedSchemaVersion;
