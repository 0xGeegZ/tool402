import type { OfferingRecord, OfferingState } from "../../../lib/offering-projection";

export const providerStatusRegionOrder = [
  "state ribbon",
  "next action",
  "deployment evidence table",
  "active terms card",
  "active directory card",
  "signer card",
] as const;

export function nextProviderAction(state: OfferingState) {
  const actions = {
    DRAFT: "Prepare the revenue note asset",
    ASSET_PENDING: "Create the note in MetaMask",
    READY: "Publish the directory version",
    OPEN: "Whitelist the first backer and issue their units",
    CLOSED: "None. The offering is closed.",
  } as const;
  return { message: actions[state], href: state === "CLOSED" ? null : "/provider/deploy" };
}

export function providerEvidenceRows(
  offering: Pick<OfferingRecord, "offeringPublicId" | "version" | "state" | "acceptedAt" | "atsAssetEvmAddress">,
  directory: { readonly directoryVersion: number; readonly record: { readonly publishedAt: string } } | undefined,
) {
  const assetRecorded = offering.atsAssetEvmAddress !== undefined && ["READY", "OPEN", "CLOSED"].includes(offering.state);
  const preparationRecorded = ["ASSET_PENDING", "READY", "OPEN", "CLOSED"].includes(offering.state);
  return [
    ["offering.create", `${offering.offeringPublicId} v${offering.version}`, "signed command admitted", String(offering.acceptedAt)],
    ["external.prepare", "not recorded", preparationRecorded ? "prepared attempt recorded" : "not recorded", "not recorded"],
    ["revenue note", assetRecorded ? offering.atsAssetEvmAddress : "not recorded", assetRecorded ? "address recorded" : "not recorded", "not recorded"],
    ["directory.publish", directory === undefined ? "not recorded" : `riskscan v${directory.directoryVersion}`, directory === undefined ? "not recorded" : "a published directory version exists", directory?.record.publishedAt ?? "not recorded"],
  ] as const;
}

export function hashscanContractUrl(state: OfferingState, address: string | undefined) {
  return address !== undefined && ["READY", "OPEN", "CLOSED"].includes(state)
    ? `https://hashscan.io/testnet/contract/${address}`
    : null;
}
