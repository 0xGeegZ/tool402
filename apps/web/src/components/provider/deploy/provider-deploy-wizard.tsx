"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { formatHbar, formatShare, groupThousands } from "../../../lib/hbar-format";
import { createStageBAtsCreateExecutionProjection } from "../../../lib/ats/stage-b-ats-create-execution-projection.ts";
import { Badge } from "../../ui/badge";
import { Button, buttonVariants } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { atsCreateConfiguration } from "./ats-create-configuration";
import { campaignFixture } from "./campaign-fixture";
import { DeployStageSigning } from "./deploy-stage-signing";
import {
  acknowledgementCopy,
  canAdvance,
  canGoBack,
  providerDeployCategories,
  providerDeployFieldErrors,
  providerDeploySteps,
  revenueNoteConfigurationRows,
  stepCaption,
  termsV1Economics,
  type ProviderDeployFieldErrors,
  type ProviderDeployValidationField,
} from "./provider-deploy-state";

type WizardValues = {
  toolName: string;
  category: (typeof providerDeployCategories)[number];
  oneLiner: string;
  customerProblem: string;
  qualifyingResource: string;
  capabilitySummary: string;
  quickPrice: string;
  standardPrice: string;
  targetAgentCustomers: string;
  useOfFunds: string;
  risks: string;
  acknowledgement: boolean;
};

const inputClassName = "min-h-10 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground hover:border-foreground/20 focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&[readonly]]:bg-muted [&[readonly]]:text-muted-foreground";
const monoValueClassName = "font-mono tabular-nums tracking-[-0.02em]";
const fieldHintClassName = "text-[13px] leading-5 text-muted-foreground";
const fieldErrorClassName = "text-[13px] leading-5 text-destructive-foreground";
const emptyFieldErrors: ProviderDeployFieldErrors = Object.freeze({});
const tinybarsPerHbar = 100_000_000n;

function wholeHbar(value: string): string {
  return formatHbar(BigInt(value) * tinybarsPerHbar);
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const routing = termsV1Economics.revenueRouting;
const routingShort = `${formatShare(BigInt(routing.operatorBps))} / ${formatShare(BigInt(routing.backerReserveBps))} / ${formatShare(BigInt(routing.feeBps))}`;
const termsEconomicsRows = [
  ["Funding target", wholeHbar(termsV1Economics.fundingTargetHbar)],
  ["Note unit price", wholeHbar(termsV1Economics.noteUnitPriceHbar)],
  ["Maximum note units", groupThousands(termsV1Economics.maximumNoteUnits)],
  ["Minimum purchase", `${termsV1Economics.minimumPurchaseUnits} units`],
  ["Revenue routing", `${formatShare(BigInt(routing.operatorBps))}% operator / ${formatShare(BigInt(routing.backerReserveBps))}% backer reserve / ${formatShare(BigInt(routing.feeBps))}% fee`],
  ["Payout cap and maturity", `${wholeHbar(termsV1Economics.payoutCapHbar)} · until ${termsV1Economics.maturityDate}`],
] as const;

function initialValues(): WizardValues {
  return {
    toolName: campaignFixture.toolName,
    category: campaignFixture.category,
    oneLiner: campaignFixture.oneLiner,
    customerProblem: campaignFixture.customerProblem,
    qualifyingResource: campaignFixture.qualifyingResource,
    capabilitySummary: campaignFixture.capabilitySummary,
    quickPrice: campaignFixture.quickPrice,
    standardPrice: campaignFixture.standardPrice,
    targetAgentCustomers: campaignFixture.targetAgentCustomers.join("\n"),
    useOfFunds: campaignFixture.useOfFunds.join("\n"),
    risks: campaignFixture.risks.join("\n"),
    acknowledgement: false,
  };
}

function fieldErrorId(field: ProviderDeployValidationField): string {
  return `provider-deploy-${field}-error`;
}

function fieldClassName(error: string | undefined): string {
  return error ? `${inputClassName} border-destructive-foreground focus:border-destructive-foreground` : inputClassName;
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6" />
      <path d="M10 3v6.5L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9.5V3" />
    </svg>
  );
}

function StepProgress({
  currentStep,
  onStepSelect,
}: {
  currentStep: number;
  onStepSelect: (step: number) => void;
}) {
  return (
    <nav aria-label="Provider deploy progress" data-ui="provider-deploy-progress" className="flex flex-col gap-2">
      <ol className="flex gap-1.5 sm:gap-2">
        {providerDeploySteps.map((step, index) => {
          const isCurrent = index === currentStep;
          const reached = index <= currentStep;
          return (
            <li key={step.label} className="min-w-0 flex-1">
              <button
                type="button"
                aria-label={`Return to step ${index + 1}: ${step.label}`}
                aria-current={isCurrent ? "step" : undefined}
                disabled={index >= currentStep}
                onClick={() => onStepSelect(index)}
                className="flex w-full flex-col gap-2 rounded-tile text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-100"
              >
                <span aria-hidden="true" className={`h-1.5 w-full rounded-full ${reached ? "bg-brand-purple" : "bg-muted"}`} />
                <span className={`hidden text-xs font-medium leading-4 sm:block ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-[13px] font-medium text-muted-foreground">{stepCaption(currentStep)}</p>
    </nav>
  );
}

function Field({
  label,
  hint,
  error,
  errorId,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm text-foreground">
      <span className="mb-2 block font-medium">{label}</span>
      {children}
      {error && errorId ? <span id={errorId} className={`mt-1.5 block ${fieldErrorClassName}`}>{error}</span> : hint ? <span className={`mt-1.5 block ${fieldHintClassName}`}>{hint}</span> : null}
    </label>
  );
}

function StepCard({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  return (
    <Card className="rounded-control border border-border bg-card shadow-none">
      <CardHeader className="gap-1 p-4 pb-0 sm:p-5 sm:pb-0">
        <CardTitle className="text-lg font-bold tracking-[-0.01em] sm:text-[22px] sm:leading-7">{title}</CardTitle>
        <CardDescription className="text-[13px] leading-5">{help}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4 pt-5 sm:p-5">{children}</CardContent>
    </Card>
  );
}

type TextChange = (field: Exclude<keyof WizardValues, "category" | "acknowledgement">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

function ToolDetailsStep({ values, fieldErrors, onTextChange, onCategoryChange }: {
  values: WizardValues;
  fieldErrors: ProviderDeployFieldErrors;
  onTextChange: TextChange;
  onCategoryChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <StepCard title="Tool details" help="Tell backers what the tool does and which agents pay for it. Prefilled from the fixture; every field is editable.">
      <Field label="Tool name" hint="Up to 100 UTF-8 bytes." error={fieldErrors.toolName} errorId={fieldErrorId("toolName")}>
        <input aria-invalid={fieldErrors.toolName ? true : undefined} aria-describedby={fieldErrors.toolName ? fieldErrorId("toolName") : undefined} className={fieldClassName(fieldErrors.toolName)} value={values.toolName} onChange={onTextChange("toolName")} />
      </Field>
      <Field label="Category">
        <select className={inputClassName} value={values.category} onChange={onCategoryChange}>
          {providerDeployCategories.map((category) => <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>)}
        </select>
      </Field>
      <Field label="One-liner" hint="The first line agents and backers see in Explore.">
        <input className={inputClassName} value={values.oneLiner} onChange={onTextChange("oneLiner")} />
      </Field>
      <Field label="Customer problem" hint="Up to 1,000 UTF-8 bytes." error={fieldErrors.customerProblem} errorId={fieldErrorId("customerProblem")}>
        <textarea aria-invalid={fieldErrors.customerProblem ? true : undefined} aria-describedby={fieldErrors.customerProblem ? fieldErrorId("customerProblem") : undefined} className={`${fieldClassName(fieldErrors.customerProblem)} min-h-22 resize-y`} value={values.customerProblem} onChange={onTextChange("customerProblem")} />
      </Field>
    </StepCard>
  );
}

function InterfaceStep({ values, fieldErrors, onTextChange }: {
  values: WizardValues;
  fieldErrors: ProviderDeployFieldErrors;
  onTextChange: TextChange;
}) {
  return (
    <StepCard title="Interface and capability" help="The qualifying resource is the exact x402-gated route agents pay for. Directory copy never overrides the live 402 challenge.">
      <Field label="Qualifying resource" error={fieldErrors.qualifyingResource} errorId={fieldErrorId("qualifyingResource")}>
        <input aria-invalid={fieldErrors.qualifyingResource ? true : undefined} aria-describedby={fieldErrors.qualifyingResource ? fieldErrorId("qualifyingResource") : undefined} className={`${fieldClassName(fieldErrors.qualifyingResource)} ${monoValueClassName}`} value={values.qualifyingResource} onChange={onTextChange("qualifyingResource")} />
      </Field>
      <Field label="Capability" hint="Fixed by the accepted directory record schema.">
        <input className={`${inputClassName} ${monoValueClassName}`} value={campaignFixture.capability} readOnly />
      </Field>
      <Field label="Capability summary">
        <textarea className={`${inputClassName} min-h-22 resize-y`} value={values.capabilitySummary} onChange={onTextChange("capabilitySummary")} />
      </Field>
    </StepCard>
  );
}

function PricingStep({ values, fieldErrors, onTextChange }: {
  values: WizardValues;
  fieldErrors: ProviderDeployFieldErrors;
  onTextChange: TextChange;
}) {
  return (
    <StepCard title="Pricing and target agent customers" help="Per-task prices are advertised tiers. The live 402 requirements remain the only payment authority.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quick price per task (HBAR)" hint="0.1 HBAR is the largest accepted advertised price." error={fieldErrors.quickPrice} errorId={fieldErrorId("quickPrice")}>
          <input inputMode="decimal" aria-invalid={fieldErrors.quickPrice ? true : undefined} aria-describedby={fieldErrors.quickPrice ? fieldErrorId("quickPrice") : undefined} className={`${fieldClassName(fieldErrors.quickPrice)} ${monoValueClassName}`} value={values.quickPrice} onChange={onTextChange("quickPrice")} />
        </Field>
        <Field label="Standard price per task (HBAR)" hint="Display price only; the payment challenge remains authoritative." error={fieldErrors.standardPrice} errorId={fieldErrorId("standardPrice")}>
          <input inputMode="decimal" aria-invalid={fieldErrors.standardPrice ? true : undefined} aria-describedby={fieldErrors.standardPrice ? fieldErrorId("standardPrice") : undefined} className={`${fieldClassName(fieldErrors.standardPrice)} ${monoValueClassName}`} value={values.standardPrice} onChange={onTextChange("standardPrice")} />
        </Field>
      </div>
      <Field label="Target agent customers" hint="One use case per line, from one through six items." error={fieldErrors.targetAgentCustomers} errorId={fieldErrorId("targetAgentCustomers")}>
        <textarea aria-invalid={fieldErrors.targetAgentCustomers ? true : undefined} aria-describedby={fieldErrors.targetAgentCustomers ? fieldErrorId("targetAgentCustomers") : undefined} className={`${fieldClassName(fieldErrors.targetAgentCustomers)} min-h-22 resize-y`} value={values.targetAgentCustomers} onChange={onTextChange("targetAgentCustomers")} />
      </Field>
    </StepCard>
  );
}

function TermsStep({
  values,
  fieldErrors,
  onTextChange,
  onAcknowledgementChange,
}: {
  values: WizardValues;
  fieldErrors: ProviderDeployFieldErrors;
  onTextChange: TextChange;
  onAcknowledgementChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const configurationRows = revenueNoteConfigurationRows(atsCreateConfiguration);

  return (
    <StepCard title="Funding and revenue-note terms" help="Economics are fixed for this offering version. A material change creates a new version with a fresh signature.">
      <div className="grid gap-4 sm:grid-cols-2">
        {termsEconomicsRows.map(([label, value]) => (
          <Field key={label} label={label}>
            <input className={`${inputClassName} ${monoValueClassName}`} value={value} readOnly />
          </Field>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <Field label="Use of funds" hint="One item per line, from one through six items." error={fieldErrors.useOfFunds} errorId={fieldErrorId("useOfFunds")}>
          <textarea aria-invalid={fieldErrors.useOfFunds ? true : undefined} aria-describedby={fieldErrors.useOfFunds ? fieldErrorId("useOfFunds") : undefined} className={`${fieldClassName(fieldErrors.useOfFunds)} min-h-22 resize-y`} value={values.useOfFunds} onChange={onTextChange("useOfFunds")} />
        </Field>
        <Field label="Risks" hint="One item per line, from one through six items." error={fieldErrors.risks} errorId={fieldErrorId("risks")}>
          <textarea aria-invalid={fieldErrors.risks ? true : undefined} aria-describedby={fieldErrors.risks ? fieldErrorId("risks") : undefined} className={`${fieldClassName(fieldErrors.risks)} min-h-22 resize-y`} value={values.risks} onChange={onTextChange("risks")} />
        </Field>
      </div>
      <div className="flex flex-col gap-2 rounded-control bg-muted px-4 py-3">
        <span className="text-[13px] font-semibold">ATS revenue note (fixed parameters)</span>
        {configurationRows.length > 0 ? (
          <dl className="grid gap-x-4 gap-y-1 text-[13px] sm:grid-cols-[auto_minmax(0,1fr)]">
            {configurationRows.map((row) => (
              <div key={row.label} className="contents">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className={`break-all ${monoValueClassName}`}>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : <p className="text-[13px] text-muted-foreground">Not configured. No projection is available to display.</p>}
      </div>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input className="mt-1 size-4 shrink-0 accent-[var(--primary)]" type="checkbox" checked={values.acknowledgement} onChange={onAcknowledgementChange} />
        <span>{acknowledgementCopy}</span>
      </label>
    </StepCard>
  );
}

function ReviewStep({ values }: { values: WizardValues }) {
  const issuer = createStageBAtsCreateExecutionProjection().issuerEvmAddress;
  const note = atsCreateConfiguration.revenueNote;
  const rows: readonly (readonly [string, string, boolean])[] = [
    ["Tool", values.toolName, false],
    ["Qualifying resource", values.qualifyingResource, true],
    ["Advertised tiers", `quick ${values.quickPrice} · standard ${values.standardPrice} HBAR`, true],
    ["Funding target · unit price", `${wholeHbar(termsV1Economics.fundingTargetHbar)} · ${wholeHbar(termsV1Economics.noteUnitPriceHbar)}`, true],
    ["Revenue routing", `${routingShort} · cap ${wholeHbar(termsV1Economics.payoutCapHbar)} · maturity ${termsV1Economics.maturityDate}`, true],
    ["Revenue note", `${note.symbol} · ${note.numberOfUnits} units · factory ${atsCreateConfiguration.factoryHederaId}`, true],
    ["Issuer wallet", `${shortAddress(issuer)} (configured issuer)`, true],
    ["Subject · version", `${atsCreateConfiguration.subjectPublicId} · ${atsCreateConfiguration.offeringVersion}`, true],
  ];

  return (
    <Card className="rounded-control border border-border bg-card shadow-none">
        <CardHeader className="gap-1 p-4 sm:p-5">
          <CardTitle className="text-lg font-bold tracking-[-0.01em] sm:text-[22px] sm:leading-7">Review and sign</CardTitle>
          <CardDescription className="text-[13px] leading-5">Each stage below needs its own wallet signature. The exact canonical payload is shown before you sign.</CardDescription>
        </CardHeader>
        <dl className="border-t border-border">
        {rows.map(([label, value, mono]) => (
          <div key={label} className="flex items-start justify-between gap-3 border-t border-border px-4 py-2.5 text-[13px] first:border-t-0 sm:gap-4 sm:px-5 sm:py-3 sm:text-sm">
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className={`min-w-0 break-words text-right ${mono ? monoValueClassName : "font-medium"}`}>{value}</dd>
          </div>
        ))}
        </dl>
    </Card>
  );
}

export function ProviderDeployWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<WizardValues>(initialValues);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const fieldErrors = showValidationErrors ? providerDeployFieldErrors(values, currentStep) : emptyFieldErrors;
  const validationMessage = Object.keys(fieldErrors).length > 0
    ? "Correct the fields marked invalid before continuing."
    : null;
  const lastStep = providerDeploySteps.length - 1;
  const stepRef = useRef<HTMLDivElement>(null);
  const announcedStep = useRef(currentStep);
  useEffect(() => {
    if (announcedStep.current === currentStep) return;
    announcedStep.current = currentStep;
    stepRef.current?.focus();
  }, [currentStep]);

  function changeText(field: Exclude<keyof WizardValues, "category" | "acknowledgement">) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((previous) => ({ ...previous, [field]: event.target.value }));
    };
  }

  function changeCategory(event: ChangeEvent<HTMLSelectElement>) {
    const category = providerDeployCategories.find((value) => value === event.target.value);
    if (!category) return;
    setValues((previous) => ({ ...previous, category }));
  }

  function changeAcknowledgement(event: ChangeEvent<HTMLInputElement>) {
    setValues((previous) => ({ ...previous, acknowledgement: event.target.checked }));
  }

  function returnToStep(step: number) {
    setCurrentStep(step);
    setShowValidationErrors(false);
  }

  function moveForward() {
    const nextFieldErrors = providerDeployFieldErrors(values, currentStep);
    if (Object.keys(nextFieldErrors).length > 0) {
      setShowValidationErrors(true);
      return;
    }
    if (!canAdvance(currentStep, values)) return;
    setShowValidationErrors(false);
    setCurrentStep((step) => Math.min(step + 1, lastStep));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    moveForward();
  }

  function renderCurrentStep() {
    switch (currentStep) {
      case 0:
        return <ToolDetailsStep values={values} fieldErrors={fieldErrors} onTextChange={changeText} onCategoryChange={changeCategory} />;
      case 1:
        return <InterfaceStep values={values} fieldErrors={fieldErrors} onTextChange={changeText} />;
      case 2:
        return <PricingStep values={values} fieldErrors={fieldErrors} onTextChange={changeText} />;
      default:
        return <TermsStep values={values} fieldErrors={fieldErrors} onTextChange={changeText} onAcknowledgementChange={changeAcknowledgement} />;
    }
  }

  const footer = (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-5 sm:pt-6">
      <Button type="button" variant="ghost" className="gap-2" disabled={!canGoBack(currentStep)} onClick={() => returnToStep(Math.max(0, currentStep - 1))}>
        <ArrowLeftIcon />
        Back
      </Button>
      {currentStep < lastStep ? (
        <Button type="submit" className="gap-2" disabled={!canAdvance(currentStep, values)}>
          Continue
          <ArrowRightIcon />
        </Button>
      ) : (
        <Link href="/provider" className={buttonVariants({ variant: "outline" })}>
          Open provider status
        </Link>
      )}
    </div>
  );

  return (
    <main className="mx-auto flex w-full max-w-[1088px] flex-col gap-5 pb-12 sm:gap-8 sm:pb-20" data-ui="provider-deploy-surface">
      <header data-ui="provider-deploy-identity" className="flex flex-col gap-2.5 sm:gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
          <Badge className="gap-1.5 bg-warning uppercase text-warning-foreground">
            <FlaskIcon />
            Prepared / demo data fixture
          </Badge>
          <Badge variant="secondary">Hedera testnet · chain 296</Badge>
          <Badge variant="outline">Terms v1 · fixed</Badge>
        </div>
        <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-4xl sm:leading-[1.1]">Deploy the RiskScan campaign</h1>
        <p className="hidden max-w-[720px] text-base text-muted-foreground sm:block">
          Review every field of the prepared offering, then authorize each step with your MetaMask issuer wallet. Nothing is created, funded, or published until the named signature and receipt exist.
        </p>
      </header>

      <StepProgress currentStep={currentStep} onStepSelect={returnToStep} />

      <form data-ui="provider-deploy-form" onSubmit={onSubmit}>
        <div ref={stepRef} tabIndex={-1} aria-label={stepCaption(currentStep)} data-ui="provider-deploy-workspace" className="scroll-mt-24 outline-none">
          <DeployStageSigning values={values} footer={footer} reviewing={currentStep === lastStep}>
            {currentStep === lastStep ? <ReviewStep values={values} /> : renderCurrentStep()}
            {validationMessage ? <p aria-live="polite" className="rounded-control border border-warning bg-warning px-3 py-2 text-sm text-warning-foreground">{validationMessage}</p> : null}
          </DeployStageSigning>
        </div>
      </form>
    </main>
  );
}
