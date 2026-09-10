"use client";

import factoryArtifact from "@hashgraph/asset-tokenization-contracts/artifacts/contracts/factory/Factory.sol/Factory.json" with { type: "json" };
import { encodeFunctionData } from "viem";

import { Button } from "../../ui/button";

const contractsAvailable =
  factoryArtifact.abi.some((entry) => entry.type === "function" && entry.name === "deployBond") &&
  typeof encodeFunctionData === "function";

export function AtsCreateAction() {
  return (
    <Button
      type="button"
      disabled
      data-ats-contracts-bundle={contractsAvailable ? "loaded" : "missing"}
      variant="outline"
    >
      Create revenue note — unavailable
    </Button>
  );
}
