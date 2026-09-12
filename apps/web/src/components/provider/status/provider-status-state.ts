import type { OfferingRecord, OfferingState } from "../../../lib/offering-projection";

export const providerStatusRegionOrder = [
  "campaign hero",
  "progress rail",
  "activity timeline",
  "campaign snapshot",
  "supporting cards",
  "technical record",
] as const;

type CampaignTone = "complete" | "current";

export function providerCampaignPresentation(offeringState: OfferingState, directoryLoaded: boolean) {
  const offering = {
    DRAFT: { heroTitle: "Campaign in progress", offeringTitle: "Offering admitted", offeringTone: "current" },
    ASSET_PENDING: { heroTitle: "Campaign in progress", offeringTitle: "Offering admitted", offeringTone: "current" },
    READY: { heroTitle: "Campaign prepared", offeringTitle: "Offering admitted", offeringTone: "complete" },
    OPEN: { heroTitle: "Campaign ready", offeringTitle: "Offering published", offeringTone: "complete" },
    CLOSED: { heroTitle: "Campaign closed", offeringTitle: "Offering closed", offeringTone: "complete" },
  } as const satisfies Record<OfferingState, { readonly heroTitle: string; readonly offeringTitle: string; readonly offeringTone: CampaignTone }>;
  const current = offering[offeringState];
  const directoryTitle = directoryLoaded ? "Directory active" : "Directory unavailable";
  return { heroTitle: current.heroTitle, offeringTitle: current.offeringTitle, offeringStage: `Offering admitted · ${offeringState}`, offeringTone: current.offeringTone, directoryTitle, directoryStage: directoryTitle, directoryTone: directoryLoaded ? "complete" as const : "current" as const, issuanceStage: "Unavailable in this demo" };
}

export function nextProviderAction(state: OfferingState) {
  const actions = {
    DRAFT: "Prepare the revenue note asset",
    ASSET_PENDING: "Create the note in MetaMask",
    READY: "Publish the directory version",
    OPEN: "Campaign deployed",
    CLOSED: "Campaign closed",
  } as const;
  return { message: actions[state], href: ["OPEN", "CLOSED"].includes(state) ? null : "/provider/deploy" };
}

export function providerEvidenceRows(
  offering: Pick<OfferingRecord, "offeringPublicId" | "version" | "state" | "acceptedAt" | "atsAssetEvmAddress">,
  directory: { readonly directoryVersion: number; readonly record: { readonly publishedAt: string; readonly serviceSlug: string } } | undefined,
) {
  const assetRecorded = offering.atsAssetEvmAddress !== undefined && ["READY", "OPEN", "CLOSED"].includes(offering.state);
  const preparationRecorded = ["ASSET_PENDING", "READY", "OPEN", "CLOSED"].includes(offering.state);
  return [
    ["offering.create", `${offering.offeringPublicId} v${offering.version}`, "signed command admitted", String(offering.acceptedAt)],
    ["external.prepare", "not recorded", preparationRecorded ? "prepared attempt recorded" : "not recorded", "not recorded"],
    ["revenue note", assetRecorded ? offering.atsAssetEvmAddress : "not recorded", assetRecorded ? "address recorded" : "not recorded", "not recorded"],
    ["directory.publish", directory === undefined ? "not recorded" : `${directory.record.serviceSlug} v${directory.directoryVersion}`, directory === undefined ? "not recorded" : "a published directory version exists", directory?.record.publishedAt ?? "not recorded"],
  ] as const;
}

export function hashscanContractUrl(state: OfferingState, address: string | undefined) {
  return address !== undefined && ["READY", "OPEN", "CLOSED"].includes(state)
    ? `https://hashscan.io/testnet/contract/${address}`
    : null;
}
