"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { PageHeader } from "../../ui/page-header";
import { atsCreateConfiguration } from "./ats-create-configuration";
import { campaignFixture } from "./campaign-fixture";
import { DeployStageSigning } from "./deploy-stage-signing";
import {
  acknowledgementCopy,
  canAdvance,
  canGoBack,
  providerDeployCategories,
  providerDeployFieldErrors,
  providerDeployStages,
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

const inputClassName = "min-h-11 w-full rounded-field border bg-background px-3 py-2 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const fieldLabelClassName = "space-y-2 text-sm font-medium text-foreground";
const fieldHintClassName = "text-sm leading-6 text-muted-foreground";
const fieldErrorClassName = "text-sm leading-6 text-destructive";
const emptyFieldErrors: ProviderDeployFieldErrors = Object.freeze({});

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
  return error ? `${inputClassName} border-destructive focus:border-destructive` : inputClassName;
}

function StepProgress({
  currentStep,
  onStepSelect,
}: {
  currentStep: number;
  onStepSelect: (step: number) => void;
}) {
  return (
    <nav aria-label="Provider deploy progress" data-ui="provider-deploy-progress" className="rounded-field border bg-muted/40 p-1">
      <ol className="grid grid-cols-5 gap-1">
        {providerDeploySteps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isComplete = index < currentStep;
          return (
            <li key={step.label} className="min-w-0">
              <button
                type="button"
                aria-label={`Return to step ${index + 1}: ${step.label}`}
                aria-current={isCurrent ? "step" : undefined}
                disabled={index >= currentStep}
                onClick={() => onStepSelect(index)}
                title={step.label}
                className={`grid w-full min-w-0 gap-1 rounded-tile border px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-100 ${isCurrent ? "border-primary bg-primary text-primary-foreground" : isComplete ? "border-border bg-secondary text-secondary-foreground hover:border-primary" : "border-border bg-background text-muted-foreground"}`}
              >
                <span className="mx-auto flex size-7 items-center justify-center rounded-full border border-current text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="hidden truncate text-xs font-medium sm:block">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function PrepareFlowMap({ currentStep }: { currentStep: number }) {
  const flowCards = [
    { eyebrow: "1 · Provider · web", title: "Open the prepared offering", detail: "Edit the local fixture first. No command is sent from this step.", state: "browser draft only" },
    { eyebrow: "2 · MetaMask", title: "Connect on Hedera Testnet", detail: "One EIP-6963 wallet provider is required before signature handoff.", state: "wallet island" },
    { eyebrow: "3 · BFF · Convex", title: "Sign the offering command", detail: "The server verifies signer, nonce, expiry, and payload hash before admission.", state: "offering.create" },
    { eyebrow: "4 · BFF · Convex", title: "Prepare the revenue note", detail: "The ATS_CREATE attempt remains pending until its candidate receipt exists.", state: "PREPARED · ASSET_PENDING" },
    { eyebrow: "5 · Hedera", title: "Create the note asset", detail: "Human wallet action on testnet; the returned transaction and EVM address become the candidate.", state: "transaction receipt" },
    { eyebrow: "6 · Convex", title: "Attach the candidate", detail: "The candidate is attached to the prepared attempt; no silent retry is inferred.", state: "attempt submitted" },
    { eyebrow: "7 · Mirror Node", title: "Independent verification", detail: "Network, factory target, and resolver checks must agree before readiness.", state: "confirmed · ready" },
    { eyebrow: "8 · BFF · Convex", title: "Publish the directory version", detail: "The directory version becomes active only after the preceding evidence is accepted.", state: "directory active" },
    { eyebrow: "9 · Hedera", title: "Lifecycle: whitelist and issue", detail: "The provider status surface owns the post-publish allocation lifecycle.", state: "offering open" },
  ] as const;

  return (
    <section aria-labelledby="prepare-flow-map-title" className="space-y-4 rounded-[calc(var(--radius)*1.25)] border bg-card/70 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary">Hybrid D · persist before sign</Badge>
          <h2 id="prepare-flow-map-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">Prepare the tool: who signs what, and where truth lives</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Editable intent comes first. Wallet signatures are isolated to the review stage, while accepted records and verified receipts remain the authority for each transition.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs"><Badge variant="outline">Provider · MetaMask</Badge><Badge variant="outline">BFF · Convex</Badge><Badge variant="outline">Hedera testnet</Badge></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-[calc(var(--radius)*0.9)] border bg-background px-4 py-3 text-xs">
        <span className="font-medium text-muted-foreground">Offering state</span>
        {(["DRAFT", "ASSET_PENDING", "READY", "OPEN"] as const).map((state, index) => <span key={state} className="flex items-center gap-2"><Badge variant={index === 0 && currentStep === 0 ? "default" : "secondary"}>{state}</Badge>{index < 3 ? <span aria-hidden="true" className="text-muted-foreground">›</span> : null}</span>)}
        <span className="ml-auto text-muted-foreground">Directory: DRAFT → PUBLISH · attempt: PREPARED → SUBMITTED → CONFIRMED</span>
      </div>
      <div className="overflow-x-auto pb-1">
        <ol className="grid min-w-[1060px] grid-cols-9 gap-3">
          {flowCards.map((card, index) => <li key={card.title} className="relative min-w-0 rounded-[calc(var(--radius)*0.9)] border bg-background p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{card.eyebrow}</p>
            <p className="mt-3 text-sm font-semibold leading-5 text-foreground">{card.title}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.detail}</p>
            <p className={`mt-4 font-mono text-[10px] font-semibold ${index === 0 && currentStep === 0 ? "text-primary" : "text-muted-foreground"}`}>{card.state}</p>
            {index < flowCards.length - 1 ? <span aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-lg text-muted-foreground lg:block">→</span> : null}
          </li>)}
        </ol>
      </div>
    </section>
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
    <label className={fieldLabelClassName}>
      <span>{label}</span>
      {children}
      {error && errorId ? <span id={errorId} className={fieldErrorClassName}>{error}</span> : hint ? <span className={fieldHintClassName}>{hint}</span> : null}
    </label>
  );
}

function ToolDetailsStep({ values, fieldErrors, onTextChange, onCategoryChange }: {
  values: WizardValues;
  fieldErrors: ProviderDeployFieldErrors;
  onTextChange: (field: Exclude<keyof WizardValues, "category" | "acknowledgement">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCategoryChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Tool name" hint="Up to 100 UTF-8 bytes." error={fieldErrors.toolName} errorId={fieldErrorId("toolName")}>
        <input aria-invalid={fieldErrors.toolName ? true : undefined} aria-describedby={fieldErrors.toolName ? fieldErrorId("toolName") : undefined} className={fieldClassName(fieldErrors.toolName)} value={values.toolName} onChange={onTextChange("toolName")} />
      </Field>
      <Field label="Category" hint="The directory uses this fixed selection.">
        <select className={inputClassName} value={values.category} onChange={onCategoryChange}>
          {providerDeployCategories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="One-liner" hint="A concise explanation for the local directory card.">
          <input className={inputClassName} value={values.oneLiner} onChange={onTextChange("oneLiner")} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Customer problem" hint="Up to 1,000 UTF-8 bytes." error={fieldErrors.customerProblem} errorId={fieldErrorId("customerProblem")}>
          <textarea aria-invalid={fieldErrors.customerProblem ? true : undefined} aria-describedby={fieldErrors.customerProblem ? fieldErrorId("customerProblem") : undefined} className={`${fieldClassName(fieldErrors.customerProblem)} min-h-32 resize-y`} value={values.customerProblem} onChange={onTextChange("customerProblem")} />
        </Field>
      </div>
    </div>
  );
}

function InterfaceStep({ values, fieldErrors, onTextChange }: {
  values: WizardValues;
  fieldErrors: ProviderDeployFieldErrors;
  onTextChange: (field: Exclude<keyof WizardValues, "category" | "acknowledgement">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Qualifying resource" hint="Name the local resource that anchors this capability." error={fieldErrors.qualifyingResource} errorId={fieldErrorId("qualifyingResource")}>
        <input aria-invalid={fieldErrors.qualifyingResource ? true : undefined} aria-describedby={fieldErrors.qualifyingResource ? fieldErrorId("qualifyingResource") : undefined} className={fieldClassName(fieldErrors.qualifyingResource)} value={values.qualifyingResource} onChange={onTextChange("qualifyingResource")} />
      </Field>
      <Field label="Capability summary" hint="Describe the bounded capability in clear terms.">
        <textarea className={`${inputClassName} min-h-32 resize-y`} value={values.capabilitySummary} onChange={onTextChange("capabilitySummary")} />
      </Field>
      <div className="rounded-field border bg-muted/50 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Fixed capability</p>
        <p className="mt-2 font-mono text-sm text-foreground">{campaignFixture.capability}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">This directory capability is read-only in the prepared fixture.</p>
      </div>
    </div>
  );
}

function PricingStep({ values, fieldErrors, onTextChange }: {
  values: WizardValues;
  fieldErrors: ProviderDeployFieldErrors;
  onTextChange: (field: Exclude<keyof WizardValues, "category" | "acknowledgement">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Quick price (HBAR)" hint="0.1 HBAR is the largest accepted advertised price." error={fieldErrors.quickPrice} errorId={fieldErrorId("quickPrice")}>
          <input inputMode="decimal" aria-invalid={fieldErrors.quickPrice ? true : undefined} aria-describedby={fieldErrors.quickPrice ? fieldErrorId("quickPrice") : undefined} className={fieldClassName(fieldErrors.quickPrice)} value={values.quickPrice} onChange={onTextChange("quickPrice")} />
        </Field>
        <Field label="Standard price (HBAR)" hint="Display price only; the payment challenge remains authoritative." error={fieldErrors.standardPrice} errorId={fieldErrorId("standardPrice")}>
          <input inputMode="decimal" aria-invalid={fieldErrors.standardPrice ? true : undefined} aria-describedby={fieldErrors.standardPrice ? fieldErrorId("standardPrice") : undefined} className={fieldClassName(fieldErrors.standardPrice)} value={values.standardPrice} onChange={onTextChange("standardPrice")} />
        </Field>
      </div>
      <Field label="Target agent customers" hint="One use case per line, from one through six items." error={fieldErrors.targetAgentCustomers} errorId={fieldErrorId("targetAgentCustomers")}>
        <textarea aria-invalid={fieldErrors.targetAgentCustomers ? true : undefined} aria-describedby={fieldErrors.targetAgentCustomers ? fieldErrorId("targetAgentCustomers") : undefined} className={`${fieldClassName(fieldErrors.targetAgentCustomers)} min-h-32 resize-y`} value={values.targetAgentCustomers} onChange={onTextChange("targetAgentCustomers")} />
      </Field>
    </div>
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
  onTextChange: (field: Exclude<keyof WizardValues, "category" | "acknowledgement">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onAcknowledgementChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const configurationRows = revenueNoteConfigurationRows(atsCreateConfiguration);
  const economics = [
    ["Funding target", `${termsV1Economics.fundingTargetHbar} HBAR`],
    ["Note unit price", `${termsV1Economics.noteUnitPriceHbar} HBAR`],
    ["Maximum note units", termsV1Economics.maximumNoteUnits],
    ["Minimum purchase", `${termsV1Economics.minimumPurchaseUnits} units`],
    ["Revenue routing", "80% operator / 20% backer reserve / 0% fee"],
    ["Payout cap and maturity", `${termsV1Economics.payoutCapHbar} HBAR until ${termsV1Economics.maturityDate}`],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Use of funds" hint="One item per line, from one through six items." error={fieldErrors.useOfFunds} errorId={fieldErrorId("useOfFunds")}>
          <textarea aria-invalid={fieldErrors.useOfFunds ? true : undefined} aria-describedby={fieldErrors.useOfFunds ? fieldErrorId("useOfFunds") : undefined} className={`${fieldClassName(fieldErrors.useOfFunds)} min-h-32 resize-y`} value={values.useOfFunds} onChange={onTextChange("useOfFunds")} />
        </Field>
        <Field label="Risks" hint="One item per line, from one through six items." error={fieldErrors.risks} errorId={fieldErrorId("risks")}>
          <textarea aria-invalid={fieldErrors.risks ? true : undefined} aria-describedby={fieldErrors.risks ? fieldErrorId("risks") : undefined} className={`${fieldClassName(fieldErrors.risks)} min-h-32 resize-y`} value={values.risks} onChange={onTextChange("risks")} />
        </Field>
      </div>
      <section aria-labelledby="provider-deploy-terms" className="rounded-field border bg-muted/40 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Read-only terms v1</p>
          <h2 id="provider-deploy-terms" className="text-lg font-semibold">Funding and revenue-note terms</h2>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {economics.map(([label, value]) => (
            <div key={label} className="space-y-1">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="provider-deploy-configuration" className="rounded-field border bg-background p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Local configuration projection</p>
        <h2 id="provider-deploy-configuration" className="mt-1 text-lg font-semibold">Revenue note context</h2>
        {configurationRows.length > 0 ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {configurationRows.map((row) => (
              <div key={row.label} className="space-y-1">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="break-words font-mono text-xs text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : <p className="mt-3 text-sm text-muted-foreground">Not configured. No projection is available to display.</p>}
      </section>
      <label className="flex items-start gap-3 rounded-field border bg-background p-4 text-sm leading-6">
        <input className="mt-1 size-4 shrink-0 accent-[var(--primary)]" type="checkbox" checked={values.acknowledgement} onChange={onAcknowledgementChange} />
        <span>{acknowledgementCopy}</span>
      </label>
    </div>
  );
}

function ReviewStep({ values }: { values: WizardValues }) {
  const reviewRows = [
    ["Tool", values.toolName],
    ["Category", values.category],
    ["Resource", values.qualifyingResource],
    ["Quick display price", `${values.quickPrice} HBAR`],
    ["Standard display price", `${values.standardPrice} HBAR`],
  ] as const;

  return (
    <div className="space-y-8">
      <section aria-labelledby="provider-deploy-review" className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Review</p>
          <h2 id="provider-deploy-review" className="text-2xl font-semibold tracking-tight">Check the prepared details</h2>
          <p className="text-sm leading-6 text-muted-foreground">Nothing is sent until you request and confirm a signature below. The values above remain a local, editable preview.</p>
        </div>
        <dl className="grid gap-3 rounded-field border bg-muted/30 p-4 text-sm sm:grid-cols-2">
          {reviewRows.map(([label, value]) => (
            <div key={label} className="space-y-1">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <DeployStageSigning values={values} />
    </div>
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
  const currentDefinition = providerDeploySteps[currentStep];

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
    setCurrentStep((step) => Math.min(step + 1, providerDeploySteps.length - 1));
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
      case 3:
        return <TermsStep values={values} fieldErrors={fieldErrors} onTextChange={changeText} onAcknowledgementChange={changeAcknowledgement} />;
      default:
        return <ReviewStep values={values} />;
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 pb-10 sm:pb-14" data-ui="provider-deploy-surface">
      <div className="space-y-5 border-b border-border pb-7">
        <Link href="/provider" className="inline-flex w-fit items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          Back to provider workspace
        </Link>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2"><Badge variant="secondary">Prepared / demo data fixture</Badge><Badge variant="outline">Hedera testnet · chain 296</Badge><Badge variant="outline">Terms v1 · fixed</Badge></div>
            <PageHeader
              eyebrow="Provider preparation"
              title="Deploy the RiskScan campaign"
              description="Review every field of the prepared offering, then authorize each bounded step with the issuer wallet. Nothing is created, funded, or published until the named signature and receipt exist."
            />
          </div>
        </div>
      </div>

      <PrepareFlowMap currentStep={currentStep} />

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="space-y-5 border-b bg-muted/20 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{stepCaption(currentStep)}</p>
              <CardTitle>{currentDefinition?.label}</CardTitle>
              <CardDescription>Complete this local preview, then review the next bounded step.</CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">{currentStep + 1} / {providerDeploySteps.length}</Badge>
          </div>
          <StepProgress currentStep={currentStep} onStepSelect={returnToStep} />
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-6">
            {renderCurrentStep()}
            {validationMessage ? <p aria-live="polite" className="rounded-field border border-warning bg-warning px-3 py-2 text-sm text-warning-foreground">{validationMessage}</p> : null}
          </CardContent>
          <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" disabled={!canGoBack(currentStep)} onClick={() => returnToStep(Math.max(0, currentStep - 1))}>
              Back
            </Button>
            {currentStep < providerDeploySteps.length - 1 ? (
              <Button type="submit" disabled={!canAdvance(currentStep, values)}>
                Continue to {providerDeploySteps[currentStep + 1]?.label}
              </Button>
            ) : <Badge variant="outline">Review complete locally</Badge>}
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
