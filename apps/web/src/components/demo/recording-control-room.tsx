"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "../ui/button";
import { recordingReadiness, recordingSteps, recordingTourHref, type RecordingStatus } from "./demo-control-room";

const preflightCommand = "export RISKSCAN_PAY_SERVICE_BASE_URL='https://tool402.vercel.app'\nexport RISKSCAN_PAY_INPUT_JSON='{\"requestRef\":\"b03-release-001\",\"subjectRef\":\"tool402-release\",\"context\":\"One authorized Hedera-testnet RiskScan exercise\",\"declarations\":{\"identity\":true,\"pricing\":true,\"limitations\":true,\"evidence\":true}}'\nexport RISKSCAN_PAY_POLICY_JSON='{\"network\":\"hedera:testnet\",\"asset\":\"0.0.0\",\"maximumAmount\":\"100000\"}'\nnpm run riskscan:pay --workspace=@tool402/agent -- --preflight";
const paidCommand = ": \"$" + "{RISKSCAN_PAY_PAYER_ACCOUNT_ID:?set privately in ignored runtime configuration}\"\n: \"$" + "{RISKSCAN_PAY_PAYER_PRIVATE_KEY:?set privately in ignored runtime configuration}\"\nnpm run riskscan:pay --workspace=@tool402/agent";
const expectedPreflight = "RISKSCAN_PAY_DIAGNOSTIC PREFLIGHT_GUARD_REACHED";
const expectedPaidResult = "RISKSCAN_PAY_OUTCOME paid\nRISKSCAN_PAY_SETTLEMENT <non-empty-safe-settlement-reference>\nRISKSCAN_PAY_DIAGNOSTIC PAID";

function tone(status: RecordingStatus): string {
  if (status === "READY") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
  if (status === "OPTIONAL") return "border-sky-500/30 bg-sky-500/10 text-sky-700";
  if (status === "NOT AVAILABLE") return "border-border bg-muted text-muted-foreground";
  return "border-amber-500/30 bg-amber-500/10 text-amber-800";
}

function CopyCommandButton({ label, value }: { label: string; value: string }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");
  async function copy(): Promise<void> {
    if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") {
      setCopyStatus("unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("unavailable");
    }
  }
  return (
    <Button type="button" variant="outline" onClick={() => { void copy(); }}>
      {copyStatus === "copied" ? "Copied" : copyStatus === "unavailable" ? "Copy unavailable" : label}
    </Button>
  );
}

export function RecordingControlRoom() {
  const start = recordingSteps[0];
  return (
    <div className="space-y-8">
      <section aria-labelledby="recording-readiness" className="rounded-panel border border-brand-purple/20 bg-brand-purple/5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Recording control room</p>
            <h2 id="recording-readiness" className="mt-1 text-2xl font-bold">Recording readiness</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Start a rehearsal now. Qualification evidence is incomplete until the real checks below are satisfied.</p>
          </div>
          <Link href={recordingTourHref(start.href, start.id)} className="inline-flex min-h-10 items-center justify-center rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Start recording demo →
          </Link>
        </div>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {recordingReadiness.map((item) => (
            <li key={item.label} className="rounded-card border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{item.label}</p>
                <span className={"rounded-full border px-2 py-1 text-[11px] font-bold tracking-wide " + tone(item.status)}>{item.status}</span>
              </div>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="consumer-agent-card" className="rounded-card border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Step 04</p>
        <h2 id="consumer-agent-card" className="mt-1 text-xl font-bold">Consumer Agent paid request</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Run preflight first. If one verified payment already exists, show its evidence and do not pay again for a retake.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-control bg-muted p-4">
            <p className="font-semibold">DO</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6"><li>Run preflight.</li><li>Run one authorized paid request only when it has not already completed.</li></ol>
          </div>
          <div className="rounded-control bg-muted p-4">
            <p className="font-semibold">SHOW</p>
            <p className="mt-2 text-sm leading-6">Expected preflight:</p><pre className="mt-1 overflow-x-auto text-xs leading-5">{expectedPreflight}</pre><p className="mt-3 text-sm leading-6">Expected paid result:</p><pre className="mt-1 overflow-x-auto text-xs leading-5">{expectedPaidResult}</pre>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-control border border-border p-3"><pre className="overflow-x-auto text-xs leading-5">{preflightCommand}</pre><div className="mt-3"><CopyCommandButton label="Copy preflight command" value={preflightCommand} /></div></div>
          <div className="rounded-control border border-border p-3"><pre className="overflow-x-auto text-xs leading-5">{paidCommand}</pre><div className="mt-3"><CopyCommandButton label="Copy paid-command template" value={paidCommand} /></div></div>
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">Recorded payment evidence: NOT AVAILABLE. No explorer link is rendered until a real verified settlement reference is available.</p>
      </section>

      <section aria-labelledby="retake-options" className="rounded-card border border-border bg-card p-5 sm:p-6">
        <h2 id="retake-options" className="text-xl font-bold">Retake options</h2>
        <ul className="mt-3 grid gap-3 text-sm leading-6 text-muted-foreground">
          <li><strong className="text-foreground">Narration mistake:</strong> restart only the guide navigation.</li>
          <li><strong className="text-foreground">B03 or ATS already completed:</strong> reuse verified evidence; do not send again.</li>
          <li><strong className="text-foreground">Backing submitted:</strong> reuse pending or explorer evidence where available; do not blindly fund again.</li>
          <li><strong className="text-foreground">Fresh Provider tool:</strong> use M55 only after it is integrated and selected by its owner.</li>
        </ul>
      </section>

      <section aria-labelledby="final-evidence-recap" className="rounded-panel border border-border bg-secondary/35 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Final step</p>
        <h2 id="final-evidence-recap" className="mt-1 text-2xl font-bold">Tool402 demo evidence</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold">Consumer Agent payment</dt><dd className="text-muted-foreground">Not available in this build.</dd></div>
          <div><dt className="font-semibold">ATS deployment and lifecycle</dt><dd className="text-muted-foreground">Action required: verified asset and transfer evidence.</dd></div>
          <div><dt className="font-semibold">Provider campaign</dt><dd className="text-muted-foreground">Show current admitted status on the Provider route.</dd></div>
          <div><dt className="font-semibold">Backing</dt><dd className="text-muted-foreground">Submitted is allocation pending until independent confirmation.</dd></div>
          <div><dt className="font-semibold">World</dt><dd className="text-muted-foreground">Optional until an integrated valid-proof route exists.</dd></div>
          <div><dt className="font-semibold">Repository</dt><dd className="text-muted-foreground">Tool402 repository; use the submitted commit recorded in the release packet.</dd></div>
        </dl>
      </section>
    </div>
  );
}
