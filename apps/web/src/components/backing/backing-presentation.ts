import type { BackingOffering, BackingViewKind } from "./backing-state";

export interface RailPosition {
  readonly current: number;
  readonly done: number;
}

export function presetUnits(terms: BackingOffering["terms"]): readonly bigint[] {
  return [1n, 5n, 10n].map((factor) => terms.minimumPurchaseUnits * factor).filter((units) => units <= terms.maximumNoteUnits);
}

export function railPosition(kind: BackingViewKind, signing: boolean): RailPosition {
  switch (kind) {
    case "offering_unavailable":
    case "refused":
      return { current: 1, done: 0 };
    case "choosing":
      return signing ? { current: 2, done: 1 } : { current: 1, done: 0 };
    case "prepared":
      return { current: 3, done: 2 };
    case "payment_submitted":
    case "payment_outcome_unknown":
    case "allocation_pending":
      return { current: 4, done: 3 };
    case "complete":
      return { current: 4, done: 4 };
  }
}
