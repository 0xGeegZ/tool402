import type { RiskScanConsumerDiscovery } from "@tool402/agent/riskscan-tool-directory";

export type RiskScanDirectoryViewState =
  | { kind: "idle" }
  | { kind: "inspecting" }
  | RiskScanConsumerDiscovery;

export type MutableBoolean = { current: boolean };

export async function runExclusive<T>(
  inFlight: MutableBoolean,
  runner: () => Promise<T>,
): Promise<T | undefined> {
  if (inFlight.current) return undefined;
  inFlight.current = true;
  try {
    return await runner();
  } finally {
    inFlight.current = false;
  }
}

export function directoryOutcomeMessage(state: RiskScanDirectoryViewState): string | null {
  switch (state.kind) {
    case "idle":
      return null;
    case "tool_selected":
      return "The local directory descriptor was selected. No RiskScan request was sent.";
    case "inspecting":
      return "Inspecting the local directory.";
    case "directory_unavailable":
      return "The local directory could not be read. No RiskScan request was sent.";
    case "directory_invalid":
      return "The local directory response could not be used. No RiskScan request was sent.";
  }
}
