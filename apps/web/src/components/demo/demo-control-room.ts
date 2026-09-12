export type RecordingStatus = "READY" | "ACTION REQUIRED" | "OPTIONAL" | "NOT AVAILABLE";

export type RecordingStep = Readonly<{
  id: string;
  href: string;
  title: string;
  wallet: string | null;
  do: string;
  say: string;
  show: string;
  nextAction?: string;
}>;

export const recordingSteps: readonly RecordingStep[] = Object.freeze([
  { id: "introduce", href: "/", title: "Introduce Tool402", wallet: null, do: "Open the home page and introduce the testnet product.", say: "Tool402 helps agents discover tools and pay for useful work on Hedera testnet.", show: "The product promise and testnet scope." },
  { id: "discover", href: "/explore", title: "Discover RiskScan", wallet: null, do: "Open RiskScan from the catalogue.", say: "RiskScan is a listed tool. An agent can inspect its price and limitations before calling it.", show: "The RiskScan catalogue card." },
  { id: "x402-boundary", href: "/explore/riskscan/tool-loop?demo=tool-loop", title: "Show the x402 request boundary", wallet: null, do: "Review the prefilled request and select Inspect request boundary.", say: "No result was released. The agent now decides whether the quote fits its spending policy.", show: "The real 402 challenge or the truthful unavailable result." },
  { id: "consumer-agent", href: "/demo", title: "Show Consumer Agent payment evidence", wallet: "Human Ops payer", do: "Run the safe preflight. Use an existing verified payment instead of paying again.", say: "The Consumer Agent checks the exact quote before one authorized paid retry.", show: "Safe terminal lines and a verified settlement link when one exists.", nextAction: "Continue without unverified payment" },
  { id: "provider-sign-in", href: "/sign-in", title: "Sign in as Provider", wallet: "PROVIDER", do: "Connect the Provider wallet and use Hedera Testnet.", say: "This signed session selects the Provider campaign. A connected wallet alone is not authority.", show: "The current wallet and signed-session result." },
  { id: "provider-campaign", href: "/provider/deploy", title: "Open the Provider campaign", wallet: "PROVIDER", do: "Use the existing RiskScan campaign. Do not create a second campaign for a retake.", say: "The campaign keeps the tool details and boundaries in one reviewed flow.", show: "RiskScan and the short campaign summary." },
  { id: "provider-terms", href: "/provider/deploy", title: "Review campaign terms", wallet: "PROVIDER", do: "Review the prefilled fields and terms. Do not pre-check acknowledgements.", say: "The ordinary campaign content is ready to review, but confirmation remains an explicit human step.", show: "The editable fields and unchecked acknowledgement." },
  { id: "ats-deployment", href: "/provider/deploy", title: "Prepare the ATS deployment", wallet: "PROVIDER", do: "Continue only after the real stage result is observed.", say: "The ATS asset is only verified after the independent receipt path accepts it.", show: "Pending state, or verified asset evidence if available.", nextAction: "Continue after verified receipt" },
  { id: "ats-lifecycle", href: "/demo", title: "Show the ATS lifecycle operation", wallet: "ATS issuer", do: "Use the approved one-unit transfer only after its preconditions are verified.", say: "We show the asset state before and after one bounded lifecycle operation.", show: "Verified pre-state, transaction, and post-state when available.", nextAction: "Continue after lifecycle evidence" },
  { id: "world", href: "/demo", title: "World verification", wallet: "PROVIDER", do: "Show World only when the current wallet has a valid verified proof.", say: "A QR code is not verification. The proof must be valid for this wallet and session.", show: "Verified state, or the honest optional omission.", nextAction: "Continue without World proof" },
  { id: "publication", href: "/provider", title: "Show publication", wallet: "PROVIDER", do: "Open the Provider status after a real publication.", say: "A published tool has an OPEN state and a visible service route.", show: "The admitted Directory state and route when available." },
  { id: "backing", href: "/explore/riskscan/back", title: "Back RiskScan", wallet: "BACKER", do: "Use the existing amount and read the acknowledgement before choosing it.", say: "The Backer signs intent first and explicitly submits the HBAR transfer second.", show: "Units, HBAR amount, unchecked acknowledgement, then allocation pending after submission.", nextAction: "Continue without funding" },
  { id: "backing-evidence", href: "/explore/riskscan/back", title: "Show backing evidence", wallet: "BACKER", do: "After a hash, do not send again. Use existing evidence if available.", say: "Payment submitted means allocation is pending until independent confirmation.", show: "Submitted — allocation pending." },
  { id: "dashboard", href: "/sign-in", title: "Show repeatability", wallet: "PROVIDER", do: "Open the signed dashboard through the existing sign-in route.", say: "The dashboard restores the campaign linked to the signed session without recreating it.", show: "The current campaign or honest empty state." },
  { id: "evidence-recap", href: "/demo", title: "Final evidence recap", wallet: null, do: "Return to the control room and show only verified links.", say: "Every claim in this recording is tied to a real product state or public evidence.", show: "The final evidence recap." },
]);

export const recordingReadiness = Object.freeze([
  { label: "Public deployment and RiskScan discovery", status: "ACTION REQUIRED" as const, detail: "Confirm the exact deployed build and public directory before recording." },
  { label: "Unsigned RiskScan x402 challenge", status: "ACTION REQUIRED" as const, detail: "Run the prefilled ToolLoop request and show its real outcome." },
  { label: "Provider wallet and selected campaign", status: "ACTION REQUIRED" as const, detail: "Use the current Provider account on Hedera Testnet." },
  { label: "ATS deployment evidence", status: "ACTION REQUIRED" as const, detail: "Requires independently verified asset evidence; a candidate is not enough." },
  { label: "ATS lifecycle evidence", status: "ACTION REQUIRED" as const, detail: "Requires the approved transfer and verified receipt." },
  { label: "B03 Consumer Agent settlement", status: "NOT AVAILABLE" as const, detail: "No verified public settlement reference is recorded in this build." },
  { label: "Backing route and BACKER wallet", status: "ACTION REQUIRED" as const, detail: "The route is available; a submitted hash remains allocation pending." },
  { label: "World proof", status: "OPTIONAL" as const, detail: "No integrated valid-proof route is currently available to this guide." },
]);

function knownStep(id: string): boolean {
  return recordingSteps.some((step) => step.id === id);
}

export function recordingTourHref(href: string, stepId: string): string {
  if (!knownStep(stepId) || !href.startsWith("/") || href.startsWith("//") || href.includes("\\")) {
    throw new TypeError("invalid recording step");
  }
  const separator = href.indexOf("?") === -1 ? "?" : "&";
  return href + separator + "tour=1&demoStep=" + encodeURIComponent(stepId);
}
