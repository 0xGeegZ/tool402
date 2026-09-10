"use client";

import { Bond } from "@hashgraph/asset-tokenization-sdk";

import { Button } from "../../ui/button";

const sdkAvailable =
  typeof Bond === "object" &&
  Bond !== null &&
  typeof Bond.create === "function";

export function AtsCreateAction() {
  return (
    <Button
      type="button"
      disabled
      data-sdk-bundle={sdkAvailable ? "loaded" : "missing"}
      variant="outline"
    >
      Create revenue note — unavailable
    </Button>
  );
}
