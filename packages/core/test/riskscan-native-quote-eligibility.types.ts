import { evaluateRiskScanNativeQuote } from "../src/index.ts";
import type {
  HederaAccountId,
  NoteUnits,
  RiskScanNativeAssetId,
  RiskScanNativeAtomicAmount,
} from "../src/index.ts";

declare const nativeAsset: RiskScanNativeAssetId;
declare const nativeAtomicAmount: RiskScanNativeAtomicAmount;
declare const accountId: HederaAccountId;
declare const noteUnits: NoteUnits;

const eligibility = evaluateRiskScanNativeQuote(
  {
    network: "hedera:testnet",
    asset: "0.0.777",
    maximumAmount: "900719925474099300000",
  },
  {
    network: "hedera:testnet",
    asset: "0.0.777",
    amount: "900719925474099300000",
  },
);

if (eligibility.kind === "eligible") {
  const eligibleAsset: RiskScanNativeAssetId = eligibility.asset;
  const eligibleAmount: RiskScanNativeAtomicAmount = eligibility.amount;

  void eligibleAsset;
  void eligibleAmount;

  // @ts-expect-error A native asset identifier is not a recipient account identifier.
  const eligibleAssetAsAccount: HederaAccountId = eligibility.asset;
  // @ts-expect-error A native atomic amount is not the generic parser brand.
  const eligibleAmountAsNoteUnits: NoteUnits = eligibility.amount;

  void eligibleAssetAsAccount;
  void eligibleAmountAsNoteUnits;
}

// @ts-expect-error Asset and recipient-account brands remain distinct.
const assetAsAccount: HederaAccountId = nativeAsset;
// @ts-expect-error Recipient-account and asset brands remain distinct.
const accountAsAsset: RiskScanNativeAssetId = accountId;
// @ts-expect-error Atomic and generic parser brands remain distinct.
const atomicAsNoteUnits: NoteUnits = nativeAtomicAmount;
// @ts-expect-error Generic parser and native atomic brands remain distinct.
const noteUnitsAsAtomic: RiskScanNativeAtomicAmount = noteUnits;

void assetAsAccount;
void accountAsAsset;
void atomicAsNoteUnits;
void noteUnitsAsAtomic;
