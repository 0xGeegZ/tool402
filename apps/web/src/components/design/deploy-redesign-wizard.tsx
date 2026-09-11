"use client";

import { useState } from "react";

type StepId = "details" | "interface" | "pricing" | "funding" | "review";

const STEPS: ReadonlyArray<{ id: StepId; index: string; label: string }> = [
  { id: "details", index: "01", label: "Tool details" },
  { id: "interface", index: "02", label: "Interface & capability" },
  { id: "pricing", index: "03", label: "Pricing & customers" },
  { id: "funding", index: "04", label: "Funding & revenue note" },
  { id: "review", index: "05", label: "Review & sign" },
];

const DEPLOYMENT_STAGES = [
  { n: 1, label: "Record the draft offering", kind: "STAGE B · HUMAN", call: "offering.create" },
  { n: 2, label: "Prepare asset creation", kind: "BLOCKED", call: "external.prepare · ATS_CREATE" },
  { n: 3, label: "Create the revenue note", kind: "STAGE B · HUMAN", call: "revenueNote.create" },
  { n: 4, label: "Publish to the Tool Directory", kind: "BLOCKED", call: "directory.publish" },
] as const;

function ConsoleField({
  label,
  hint,
  value,
  mono = false,
  multiline = false,
}: {
  label: string;
  hint?: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">{label}</label>
      {multiline ? (
        <textarea
          readOnly
          rows={3}
          value={value}
          className={`w-full resize-none rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-[13px] leading-relaxed text-neutral-100 outline-none focus-visible:border-lime-400 ${
            mono ? "font-[family-name:var(--font-redesign-mono)]" : ""
          }`}
        />
      ) : (
        <input
          readOnly
          value={value}
          className={`w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-[13px] text-neutral-100 outline-none focus-visible:border-lime-400 ${
            mono ? "font-[family-name:var(--font-redesign-mono)]" : ""
          }`}
        />
      )}
      {hint ? <p className="text-[11px] leading-normal text-neutral-500">{hint}</p> : null}
    </div>
  );
}

function ManifestRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-neutral-800/70 py-1.5 last:border-0">
      <span className="text-[11px] text-neutral-500">{k}</span>
      <span className="truncate text-right text-[12px] text-neutral-100 font-[family-name:var(--font-redesign-mono)]">{v}</span>
    </div>
  );
}

export function DeployRedesignWizard() {
  const [activeId, setActiveId] = useState<StepId>("details");
  const activeIndex = STEPS.findIndex((s) => s.id === activeId);

  function goTo(id: StepId) {
    setActiveId(id);
  }

  function next() {
    const i = STEPS.findIndex((s) => s.id === activeId);
    if (i < STEPS.length - 1) setActiveId(STEPS[i + 1].id);
  }

  function back() {
    const i = STEPS.findIndex((s) => s.id === activeId);
    if (i > 0) setActiveId(STEPS[i - 1].id);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
      {/* Step rail */}
      <nav aria-label="Deployment steps" className="lg:sticky lg:top-24 lg:self-start">
        <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {STEPS.map((step, i) => {
            const isActive = step.id === activeId;
            const isDone = i < activeIndex;
            return (
              <li key={step.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => goTo(step.id)}
                  aria-current={isActive ? "step" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                    isActive ? "bg-neutral-900" : "hover:bg-neutral-900/50"
                  }`}
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-redesign-mono)] text-[11px] ${
                      isDone
                        ? "bg-lime-400 text-neutral-950"
                        : isActive
                          ? "border border-lime-400 text-lime-400"
                          : "border border-neutral-700 text-neutral-500"
                    }`}
                  >
                    {isDone ? "✓" : step.index}
                  </span>
                  <span className={`text-[13px] leading-tight ${isActive ? "text-neutral-100" : "text-neutral-500"}`}>
                    {step.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Console panel */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-lime-400" />
            <span className="font-[family-name:var(--font-redesign-mono)] text-[11px] uppercase tracking-[0.08em] text-neutral-400">
              Step {activeIndex + 1} of {STEPS.length} · {STEPS[activeIndex].label}
            </span>
          </div>
          <span className="font-[family-name:var(--font-redesign-mono)] text-[11px] text-neutral-500">DRAFT · UNSIGNED</span>
        </div>

        <div className="px-6 py-6">
          {activeId === "details" && (
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <ConsoleField label="Tool name" value="RiskScan" mono />
                <ConsoleField label="Category" value="security" mono />
              </div>
              <ConsoleField label="One-liner" value="Explainable local risk assessment for tool requests." />
              <ConsoleField
                label="Customer problem"
                multiline
                value="Tool operators need a bounded way to assess request risk before they continue a workflow."
              />
            </div>
          )}

          {activeId === "interface" && (
            <div className="flex flex-col gap-5">
              <ConsoleField label="Qualifying resource" value="riskscan-local-assessment" mono />
              <ConsoleField
                label="Capability summary"
                multiline
                value="Produces a local, explainable assessment from provider-supplied request context."
              />
              <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-900/60 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-neutral-500">Fixed capability · read-only</p>
                <p className="mt-1 font-[family-name:var(--font-redesign-mono)] text-[13px] text-lime-300">
                  evm-contract-risk-signals
                </p>
              </div>
            </div>
          )}

          {activeId === "pricing" && (
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <ConsoleField label="Quick price" value="0.1 HBAR" mono hint="Largest accepted advertised price." />
                <ConsoleField label="Standard price" value="0.1 HBAR" mono hint="Display price only." />
              </div>
              <ConsoleField label="Target agent customers" value="Security-oriented agent operators" hint="One use case per line." />
            </div>
          )}

          {activeId === "funding" && (
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <ConsoleField label="Use of funds" multiline value="Maintain the local assessment workflow and provider documentation." />
                <ConsoleField label="Risks" multiline value="Testnet terms do not promise yield, principal, or return." />
              </div>
              <div className="rounded-md border border-neutral-800 bg-neutral-900/60 p-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-neutral-500">Terms v1 · read-only</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <ManifestRow k="Funding target" v="1000 HBAR" />
                  <ManifestRow k="Note unit price" v="1 HBAR" />
                  <ManifestRow k="Maximum units" v="1000" />
                  <ManifestRow k="Minimum purchase" v="10 units" />
                  <ManifestRow k="Revenue routing" v="80/20/0%" />
                  <ManifestRow k="Payout cap" v="1500 HBAR" />
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-md border border-neutral-800 bg-neutral-900/40 p-3 text-[12px] leading-relaxed text-neutral-400">
                <input type="checkbox" className="mt-0.5 size-3.5 accent-lime-400" readOnly />
                I confirm these are testnet, experimental terms. They promise no yield, principal, or return.
              </label>
            </div>
          )}

          {activeId === "review" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 rounded-md border border-neutral-800 bg-neutral-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-medium text-neutral-100">Issuer wallet</p>
                  <p className="text-[12px] text-neutral-500">Connecting only asks MetaMask for an account; it signs nothing.</p>
                </div>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-lime-400 px-4 py-2 text-[13px] font-semibold text-neutral-950 transition-colors hover:bg-lime-300"
                >
                  Connect MetaMask
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-neutral-500">Deployment stages</p>
                <ol className="flex flex-col gap-2">
                  {DEPLOYMENT_STAGES.map((stage) => (
                    <li
                      key={stage.n}
                      className="flex items-center justify-between gap-3 rounded-md border border-neutral-800 bg-neutral-900/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-6 items-center justify-center rounded-full border border-neutral-700 font-[family-name:var(--font-redesign-mono)] text-[11px] text-neutral-400">
                          {stage.n}
                        </span>
                        <div>
                          <p className="text-[13px] text-neutral-100">{stage.label}</p>
                          <p className="font-[family-name:var(--font-redesign-mono)] text-[11px] text-neutral-500">{stage.call}</p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.05em] ${
                          stage.kind === "BLOCKED"
                            ? "bg-neutral-800 text-neutral-500"
                            : "bg-amber-400/10 text-amber-300 border border-amber-400/30"
                        }`}
                      >
                        {stage.kind}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="text-[11px] leading-relaxed text-neutral-500">
                  A declined signature leaves its stage ready to try again. Nothing was recorded. This page never retries on its own.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-4">
          <button
            type="button"
            onClick={back}
            disabled={activeIndex === 0}
            className="text-[13px] text-neutral-400 transition-colors hover:text-neutral-100 disabled:opacity-30"
          >
            Back
          </button>
          <button
            type="button"
            onClick={next}
            disabled={activeIndex === STEPS.length - 1}
            className="inline-flex items-center justify-center rounded-full bg-lime-400 px-5 py-2 text-[13px] font-semibold text-neutral-950 transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {activeIndex === STEPS.length - 1 ? "Awaiting signature" : "Continue"}
          </button>
        </div>
      </div>

      {/* Manifest / live receipt panel */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.08em] text-neutral-500">Deployment manifest</p>
          <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2">
            <span className="size-1.5 rounded-full bg-amber-300" />
            <span className="text-[11px] text-amber-200">Nothing created, funded, or published yet</span>
          </div>
          <div className="flex flex-col">
            <ManifestRow k="tool" v="RiskScan" />
            <ManifestRow k="category" v="security" />
            {activeIndex >= 1 ? <ManifestRow k="resource" v="riskscan-local-assessment" /> : null}
            {activeIndex >= 1 ? <ManifestRow k="capability" v="evm-contract-risk-signals" /> : null}
            {activeIndex >= 2 ? <ManifestRow k="quick_price" v="0.1 HBAR" /> : null}
            {activeIndex >= 2 ? <ManifestRow k="standard_price" v="0.1 HBAR" /> : null}
            {activeIndex >= 3 ? <ManifestRow k="funding_target" v="1000 HBAR" /> : null}
            {activeIndex >= 3 ? <ManifestRow k="note_unit_price" v="1 HBAR" /> : null}
            {activeIndex >= 4 ? <ManifestRow k="wallet" v="not connected" /> : null}
            {activeIndex >= 4 ? <ManifestRow k="stages_signed" v="0 / 4" /> : null}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-neutral-500">
            Every value here mirrors what will be requested for signature. Nothing on this panel is sent until you confirm each
            step.
          </p>
        </div>
      </aside>
    </div>
  );
}
