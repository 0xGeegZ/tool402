"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Badge } from "../../ui/badge";
import { Button, buttonVariants } from "../../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { atsCreateConfiguration } from "./ats-create-configuration";
import { campaignFixture } from "./campaign-fixture";
import { ProviderDeployStages } from "./provider-deploy-stages";
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

const inputClassName = "min-h-11 w-full rounded-field border border-border bg-background px-3 py-2 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground hover:border-foreground/20 focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
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
    <nav aria-label="Provider deploy progress" data-ui="provider-deploy-progress" className="pb-1">
      <ol className="grid grid-cols-5 gap-0">
        {providerDeploySteps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isComplete = index < currentStep;
          const stateClass = isCurrent || isComplete ? "bg-primary text-primary-foreground" : "border-2 border-primary/35 bg-card text-primary";
          return (
            <li key={step.label} className="relative flex min-w-0 flex-col items-center text-center">
              {index > 0 ? <span aria-hidden="true" className={`absolute left-0 right-1/2 top-3 h-0.5 -translate-y-1/2 ${index <= currentStep ? "bg-primary" : "bg-primary/20"}`} /> : null}
              {index < providerDeploySteps.length - 1 ? <span aria-hidden="true" className={`absolute left-1/2 right-0 top-3 h-0.5 -translate-y-1/2 ${index < currentStep ? "bg-primary" : "bg-primary/20"}`} /> : null}
              <button type="button" aria-label={`Return to step ${index + 1}: ${step.label}`} aria-current={isCurrent ? "step" : undefined} disabled={index >= currentStep} onClick={() => onStepSelect(index)} className="relative z-10 flex min-w-0 flex-col items-center gap-2 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default">
                <span aria-hidden="true" className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ring-4 ring-background transition-colors ${stateClass}`}>{isComplete ? "✓" : index + 1}</span>
                <span className={`max-w-36 text-[11px] font-medium leading-[1.35] ${isCurrent || isComplete ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{stepCaption(currentStep)}</p>
    </nav>
  );
}

function CampaignSummary({ values }: { values: WizardValues }) {
  const lineItems = (value: string) => value.split("\\n").filter(Boolean);
  return (
    <aside className="h-fit rounded-panel border border-border bg-card p-5 shadow-[0_10px_30px_color-mix(in_srgb,var(--primary)_8%,transparent)] lg:sticky lg:top-5" aria-labelledby="campaign-summary-title">
      <h2 id="campaign-summary-title" className="text-lg font-bold tracking-tight">Campaign summary</h2>
      <div className="mt-4 flex items-start gap-3 border-b border-border pb-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl" aria-hidden="true">▣</div>
        <div><p className="font-bold">{values.toolName || "Untitled tool"}</p><p className="text-xs leading-5 text-muted-foreground">{values.oneLiner || "Add a short description in Tool details."}</p></div>
      </div>
      <dl className="grid gap-3 border-b border-border py-4 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Category</dt><dd className="font-medium">{values.category}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Resource</dt><dd className="max-w-[13rem] text-right font-medium">{values.qualifyingResource || "Not set"}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Capability</dt><dd className="max-w-[13rem] text-right font-medium">{campaignFixture.capability}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Quick price</dt><dd className="font-medium">{values.quickPrice || "—"} HBAR</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Standard price</dt><dd className="font-medium">{values.standardPrice || "—"} HBAR</dd></div>
      </dl>
      <section className="border-b border-border py-4"><h3 className="font-bold">Offering details</h3><p className="mt-3 text-sm text-muted-foreground">Customer problem</p><p className="text-sm leading-6">{values.customerProblem || "Not set"}</p><p className="mt-3 text-sm text-muted-foreground">Capability summary</p><p className="text-sm leading-6">{values.capabilitySummary || "Not set"}</p><p className="mt-3 text-sm text-muted-foreground">Target agent customers</p><ul className="grid gap-1 text-sm leading-6">{lineItems(values.targetAgentCustomers).map((item) => <li key={item}>• {item}</li>)}</ul></section>
      <section className="border-b border-border py-4"><h3 className="font-bold">Funding &amp; revenue-note terms</h3><p className="mt-3 text-sm text-muted-foreground">Use of funds</p><ul className="grid gap-1 text-sm leading-6">{lineItems(values.useOfFunds).map((item) => <li key={item}>• {item}</li>)}</ul><p className="mt-3 text-sm text-muted-foreground">Risks</p><ul className="grid gap-1 text-sm leading-6">{lineItems(values.risks).map((item) => <li key={item}>• {item}</li>)}</ul><p className="mt-3 text-sm text-muted-foreground">Terms acknowledgement</p><p className="text-sm leading-6">{values.acknowledgement ? "Confirmed" : "Pending confirmation"}</p><a href="#terms" className="mt-4 inline-block text-sm font-semibold text-primary">View full terms →</a></section>
      <section className="border-b border-border py-4"><h3 className="font-bold">What happens next</h3><ol className="mt-3 grid gap-3 text-sm leading-5 text-muted-foreground"><li><span className="mr-2 inline-flex size-5 items-center justify-center rounded-full border border-primary text-xs text-primary">1</span>You connect your wallet and review the details</li><li><span className="mr-2 inline-flex size-5 items-center justify-center rounded-full border border-primary text-xs text-primary">2</span>You sign each deployment stage in order</li><li><span className="mr-2 inline-flex size-5 items-center justify-center rounded-full border border-primary text-xs text-primary">3</span>A revenue note is created on Hedera testnet</li><li><span className="mr-2 inline-flex size-5 items-center justify-center rounded-full border border-primary text-xs text-primary">4</span>Your tool is published to the Tool402 directory</li></ol></section>
      <section className="pt-4"><h3 className="font-bold">Security &amp; scope</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Nothing is created, funded, or published until the required signatures and receipts exist. This is a testnet prototype.</p><div className="mt-4 rounded-field bg-secondary p-3 text-sm leading-5"><strong>Testnet prototype</strong><br /><span className="text-muted-foreground">Local routes are descriptive and labelled with their current boundaries.</span></div></section>
    </aside>
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
      <details className="rounded-field border bg-background">
        <summary className="cursor-pointer list-none p-4 marker:content-none [&::-webkit-details-marker]:hidden">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Local configuration projection</p>
          <span className="mt-1 flex items-center justify-between gap-3">
            <span className="text-lg font-semibold">Revenue note context</span>
            <span className="text-sm text-muted-foreground">{configurationRows.length > 0 ? `${configurationRows.length} values · show` : "Not configured · show"}</span>
          </span>
        </summary>
        <div className="border-t px-4 pb-4">
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
        </div>
      </details>
      <label className="flex items-start gap-3 rounded-field border bg-background p-4 text-sm leading-6">
        <input className="mt-1 size-4 shrink-0 accent-[var(--primary)]" type="checkbox" checked={values.acknowledgement} onChange={onAcknowledgementChange} />
        <span>{acknowledgementCopy}</span>
      </label>
    </div>
  );
}

function ReviewStep({ values }: { values: WizardValues }) {
  const reviewRows = [["Tool name", values.toolName], ["Category", values.category], ["Qualifying resource", values.qualifyingResource], ["Quick display price", `${values.quickPrice} HBAR`], ["Standard price (HBAR)", `${values.standardPrice} HBAR`], ["Target agent customers", values.targetAgentCustomers], ["Capability summary", values.capabilitySummary], ["Funding terms", values.useOfFunds]] as const;
  const stageStates = [{ kind: "done" as const, detail: "Create and record the tool offering in a local projection." }, { kind: "blocked" as const, detail: "Generate the asset and metadata for the revenue note." }, { kind: "unavailable" as const, detail: "Create the revenue note in MetaMask and attach the returned candidate." }, { kind: "blocked" as const, detail: "Submit the tool and revenue note to the Tool402 directory." }];

  return (
    <div className="space-y-4">
      <section className="rounded-card border border-border bg-card p-5 shadow-none sm:p-6" aria-labelledby="wallet-title">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div className="flex gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-xl text-primary" aria-hidden="true">▣</div><div><h2 id="wallet-title" className="text-lg font-bold">Connect your wallet</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">A connected wallet only enables the next local signature request. It does not create, fund, or publish anything by itself.</p><Button type="button" className="mt-3 h-9 rounded-control px-4 text-sm">Connect MetaMask</Button></div></div>
          <div className="rounded-field bg-secondary p-4"><p className="font-semibold">Your keys, your control</p><p className="mt-1 text-sm leading-5 text-muted-foreground">You authorize each step. Nothing is submitted to the network until you sign and confirm.</p></div>
        </div>
      </section>
      <section className="rounded-card border border-border bg-card p-5 shadow-none sm:p-6" aria-labelledby="prepared-title">
        <div className="flex items-start justify-between gap-4"><div className="flex gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-xl text-primary" aria-hidden="true">▤</div><div><h2 id="prepared-title" className="text-lg font-bold">Prepared details</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Review the key details of your offering. These values remain editable until you sign.</p></div></div><Button type="button" variant="outline" className="hidden shrink-0 sm:inline-flex">Edit details</Button></div>
        <dl className="mt-4 grid gap-x-8 gap-y-3 rounded-field border border-border bg-muted/30 p-3 text-sm sm:grid-cols-2">{reviewRows.map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(7rem,0.8fr)_1.2fr] gap-2"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium text-foreground">{value}</dd></div>)}</dl>
      </section>
      <section className="rounded-card border border-border bg-card p-5 shadow-none sm:p-6" aria-labelledby="stages-title"><div className="flex gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-xl text-primary" aria-hidden="true">▱</div><div><h2 id="stages-title" className="text-lg font-bold">Deployment stages</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Complete each stage in order. You&apos;ll be prompted to sign when required.</p></div></div><div className="mt-5"><ProviderDeployStages states={stageStates} /></div><p className="mt-4 rounded-field border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">ⓘ A declined signature leaves its stage ready to try again. Nothing was recorded. This page never retries on its own.</p></section>
    </div>
  );
}

export function ProviderDeployWizard() {
  const [currentStep, setCurrentStep] = useState<number>(0);
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
    <main className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14" data-ui="provider-deploy-surface">
      <header data-ui="provider-deploy-identity" className="pt-6 lg:pt-8">
        <div className="flex flex-wrap gap-2"><Badge variant="outline" className="rounded-full border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning-foreground">Prepared / demo data fixture</Badge><Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-foreground">Hedera testnet · chain 296</Badge><Badge variant="outline" className="rounded-full border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">Terms v1 · fixed</Badge></div>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-foreground sm:text-4xl">Deploy the RiskScan campaign</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">Review every field of the prepared offering, then authorize each step with your issuer wallet. Nothing is created, funded, or published until the named signature and receipt exist.</p>
      </header>
      <div className="mt-7"><StepProgress currentStep={currentStep} onStepSelect={returnToStep} /></div>
      <div data-ui="provider-deploy-workspace" className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_326px]">
        <section data-ui="provider-deploy-form">
          <Card className="overflow-hidden rounded-card border border-border bg-card shadow-[0_10px_30px_color-mix(in_srgb,var(--primary)_5%,transparent)]">
            <CardHeader className="space-y-1 px-5 pb-2 pt-5 sm:px-6 sm:pt-6"><CardTitle className="text-xl tracking-tight sm:text-2xl">{currentDefinition?.label}</CardTitle><CardDescription className="text-xs leading-5">Complete the prepared fields for this step. Every value remains editable until review.</CardDescription></CardHeader>
            <form onSubmit={onSubmit}><CardContent className="px-5 py-5 sm:px-6 sm:py-6">{renderCurrentStep()}{validationMessage ? <p aria-live="polite" className="mt-6 rounded-field border border-warning bg-warning px-3 py-2 text-sm text-warning-foreground">{validationMessage}</p> : null}</CardContent><CardFooter className="flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><Button type="button" variant="ghost" className="justify-start px-2 text-sm" disabled={!canGoBack(currentStep)} onClick={() => returnToStep(Math.max(0, currentStep - 1))}>Back</Button>{currentStep < providerDeploySteps.length - 1 ? <Button type="submit" className="h-10 rounded-control px-5 text-sm" disabled={!canAdvance(currentStep, values)}>Continue <span aria-hidden="true">→</span></Button> : <Link href="/provider" className={buttonVariants({ variant: "outline", size: "md" })}>Back to the provider workspace</Link>}</CardFooter></form>
          </Card>
        </section>
        <CampaignSummary values={values} />
      </div>
    </main>
  );
}

