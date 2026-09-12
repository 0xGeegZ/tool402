import type { BackingViewKind } from "./backing-state.ts";

type OfferingTerms = Readonly<{
  minimumPurchaseUnits: bigint;
  maximumNoteUnits: bigint;
}>;

export function presetUnits(terms: OfferingTerms): readonly bigint[] {
  return Object.freeze([10n, 50n, 100n].filter(
    (value) => value >= terms.minimumPurchaseUnits && value <= terms.maximumNoteUnits,
  ));
}

export function railPosition(kind: BackingViewKind, signing: boolean): Readonly<{ current: number; done: number }> {
  if (kind === "complete") return Object.freeze({ current: 4, done: 4 });
  if (kind === "payment_submitted" || kind === "payment_outcome_unknown" || kind === "allocation_pending") return Object.freeze({ current: 4, done: 3 });
  if (kind === "prepared") return Object.freeze({ current: 3, done: 2 });
  if (kind === "choosing" && signing) return Object.freeze({ current: 2, done: 1 });
  return Object.freeze({ current: 1, done: 0 });
}
