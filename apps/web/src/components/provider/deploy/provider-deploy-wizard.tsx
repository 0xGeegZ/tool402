"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
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

const inputClassName = "min-h-11 w-full rounded-xl border border-border bg-[#fbf7ef] px-3 py-2 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground hover:border-foreground/20 focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
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
    <nav aria-label="Provider deploy progress" data-ui="provider-deploy-progress" className="space-y-3">
      <ol className="grid grid-cols-5 gap-1 sm:gap-3">
        {providerDeploySteps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isComplete = index < currentStep;
          return (
            <li key={step.label} className="relative min-w-0">
              {index < providerDeploySteps.length - 1 ? (
                <span
                  aria-hidden="true"
                  data-ui="provider-deploy-step-connector"
                  className={`absolute left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] top-5 h-0.5 ${isComplete ? "bg-primary" : "bg-secondary"}`}
                />
              ) : null}
              <button
                type="button"
                aria-label={`Return to step ${index + 1}: ${step.label}`}
                aria-current={isCurrent ? "step" : undefined}
                disabled={index >= currentStep}
                onClick={() => onStepSelect(index)}
                className={`relative z-10 flex w-full flex-col items-center gap-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-100 ${isCurrent ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"}`}
              >
                <span aria-hidden="true" className={`flex size-10 items-center justify-center rounded-full border-2 bg-card text-sm font-semibold ${isCurrent ? "border-primary bg-primary text-primary-foreground" : isComplete ? "border-primary text-primary" : "border-secondary text-muted-foreground"}`}>
                  {index + 1}
                </span>
                <span className="text-[10px] font-medium leading-4 sm:text-[11px]">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-xs font-medium text-muted-foreground">{stepCaption(currentStep)}</p>
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
      <div className="rounded-[calc(var(--radius)*0.75)] border bg-muted/50 p-4">
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
      <section aria-labelledby="provider-deploy-terms" className="rounded-[calc(var(--radius)*0.75)] border bg-muted/40 p-4">
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
      <section aria-labelledby="provider-deploy-configuration" className="rounded-[calc(var(--radius)*0.75)] border bg-background p-4">
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
      <label className="flex items-start gap-3 rounded-[calc(var(--radius)*0.75)] border bg-background p-4 text-sm leading-6">
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
    <DeployStageSigning values={values}>
      <section aria-labelledby="provider-deploy-review" className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Review</p>
          <h2 id="provider-deploy-review" className="text-2xl font-semibold tracking-tight">Check the prepared details</h2>
          <p className="text-sm leading-6 text-muted-foreground">Nothing is sent until you request and confirm a signature below. The values above remain a local, editable preview.</p>
        </div>
        <section aria-labelledby="provider-deploy-review-details" className="rounded-2xl border bg-card p-5 shadow-none sm:p-6">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Local review</p>
            <h3 id="provider-deploy-review-details" className="text-lg font-semibold tracking-tight">Prepared campaign details</h3>
          </div>
          <dl className="mt-5 divide-y divide-border text-sm">
            {reviewRows.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[minmax(10rem,0.42fr)_1fr] sm:gap-6">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </section>
    </DeployStageSigning>
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
    <main className="mx-auto max-w-6xl px-3 pb-10 sm:px-5 sm:pb-14" data-ui="provider-deploy-surface">
      <header data-ui="provider-deploy-identity" className="max-w-4xl">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning-foreground">
            Prepared / demo data fixture
          </Badge>
          <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-foreground">
            Hedera testnet · chain 296
          </Badge>
          <Badge variant="outline" className="rounded-full border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
            Terms v1 · fixed
          </Badge>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-5xl">Deploy the RiskScan campaign</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Review every field of the prepared offering, then authorize each step with your issuer wallet. Nothing is created, funded, or published until the named signature and receipt exist.
        </p>
      </header>

      <div className="mt-7">
        <StepProgress currentStep={currentStep} onStepSelect={returnToStep} />
      </div>

      <div data-ui="provider-deploy-workspace" className="mt-8 space-y-5">
        <section data-ui="provider-deploy-form">
          <Card className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-none">
            <CardHeader className="space-y-1 px-5 pb-3 pt-6 sm:px-8 sm:pt-8">
              <CardTitle className="text-xl tracking-tight sm:text-2xl">{currentDefinition?.label}</CardTitle>
              <CardDescription className="text-xs leading-5">
                Complete the prepared fields for this step. Every value remains editable until review.
              </CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit}>
              <CardContent className="px-5 py-6 sm:px-8 sm:py-8">
                {renderCurrentStep()}
                {validationMessage ? <p aria-live="polite" className="mt-6 rounded-xl border border-warning bg-warning px-3 py-2 text-sm text-warning-foreground">{validationMessage}</p> : null}
              </CardContent>
              <CardFooter className="flex flex-col-reverse gap-3 border-t border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <Button type="button" variant="ghost" className="justify-start px-2 text-sm" disabled={!canGoBack(currentStep)} onClick={() => returnToStep(Math.max(0, currentStep - 1))}>
                  Back
                </Button>
                {currentStep < providerDeploySteps.length - 1 ? (
                  <Button type="submit" className="h-10 rounded-xl px-4 text-sm" disabled={!canAdvance(currentStep, values)}>
                    Continue
                  </Button>
                ) : <Badge variant="outline">Review complete locally</Badge>}
              </CardFooter>
            </form>
          </Card>
        </section>
      </div>
    </main>
  );
}
