"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { atsCreateConfiguration } from "./ats-create-configuration";
import { campaignFixture } from "./campaign-fixture";
import { ProviderDeployStages } from "./provider-deploy-stages";
import {
  acknowledgementCopy,
  canAdvance,
  canGoBack,
  hbarToTinybars,
  providerDeployCategories,
  providerDeployStageStates,
  providerDeploySteps,
  revenueNoteConfigurationRows,
  stepCaption,
  termsV1Economics,
  validateNarrativeField,
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

const inputClassName = "min-h-11 w-full rounded-[calc(var(--radius)*0.75)] border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-ring";
const fieldLabelClassName = "space-y-2 text-sm font-medium text-foreground";
const fieldHintClassName = "text-sm leading-6 text-muted-foreground";

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

function narrativeItems(value: string): readonly string[] {
  return value.split("\n");
}

function inputError(values: WizardValues, step: number): string | null {
  try {
    if (step === 0) {
      validateNarrativeField("title", values.toolName);
      validateNarrativeField("customerProblem", values.customerProblem);
    }
    if (step === 2) {
      hbarToTinybars(values.quickPrice);
      hbarToTinybars(values.standardPrice);
      validateNarrativeField("targetAgentCustomers", narrativeItems(values.targetAgentCustomers));
    }
    if (step === 3) {
      validateNarrativeField("useOfFunds", narrativeItems(values.useOfFunds));
      validateNarrativeField("risks", narrativeItems(values.risks));
    }
    return null;
  } catch {
    return "Review the highlighted field limits before continuing. Narrative entries must be complete, one item per line, and prices must be between 1 and 10,000,000 tinybars.";
  }
}

function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Provider deploy progress" className="overflow-x-auto pb-1">
      <ol className="flex min-w-max items-center gap-2">
        {providerDeploySteps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isComplete = index < currentStep;
          return (
            <li key={step.label} className="flex items-center gap-2">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`flex size-8 items-center justify-center rounded-full border text-xs font-semibold ${isCurrent ? "border-primary bg-primary text-primary-foreground" : isComplete ? "border-border bg-secondary text-secondary-foreground" : "border-border bg-background text-muted-foreground"}`}
              >
                {index + 1}
              </span>
              <span className={`hidden text-xs font-medium sm:inline ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
              {index < providerDeploySteps.length - 1 ? <span aria-hidden="true" className="h-px w-6 bg-border" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className={fieldLabelClassName}>
      <span>{label}</span>
      {children}
      {hint ? <span className={fieldHintClassName}>{hint}</span> : null}
    </label>
  );
}

function ToolDetailsStep({ values, onTextChange, onCategoryChange }: {
  values: WizardValues;
  onTextChange: (field: Exclude<keyof WizardValues, "category" | "acknowledgement">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCategoryChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Tool name" hint="Up to 100 UTF-8 bytes.">
        <input className={inputClassName} value={values.toolName} onChange={onTextChange("toolName")} />
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
        <Field label="Customer problem" hint="Up to 1,000 UTF-8 bytes.">
          <textarea className={`${inputClassName} min-h-32 resize-y`} value={values.customerProblem} onChange={onTextChange("customerProblem")} />
        </Field>
      </div>
    </div>
  );
}

function InterfaceStep({ values, onTextChange }: {
  values: WizardValues;
  onTextChange: (field: Exclude<keyof WizardValues, "category" | "acknowledgement">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Qualifying resource" hint="Name the local resource that anchors this capability.">
        <input className={inputClassName} value={values.qualifyingResource} onChange={onTextChange("qualifyingResource")} />
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

function PricingStep({ values, onTextChange }: {
  values: WizardValues;
  onTextChange: (field: Exclude<keyof WizardValues, "category" | "acknowledgement">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Quick price (HBAR)" hint="0.1 HBAR is the largest accepted advertised price.">
          <input inputMode="decimal" className={inputClassName} value={values.quickPrice} onChange={onTextChange("quickPrice")} />
        </Field>
        <Field label="Standard price (HBAR)" hint="Display price only; the payment challenge remains authoritative.">
          <input inputMode="decimal" className={inputClassName} value={values.standardPrice} onChange={onTextChange("standardPrice")} />
        </Field>
      </div>
      <Field label="Target agent customers" hint="One use case per line, from one through six items.">
        <textarea className={`${inputClassName} min-h-32 resize-y`} value={values.targetAgentCustomers} onChange={onTextChange("targetAgentCustomers")} />
      </Field>
    </div>
  );
}

function TermsStep({
  values,
  onTextChange,
  onAcknowledgementChange,
}: {
  values: WizardValues;
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
        <Field label="Use of funds" hint="One item per line, from one through six items.">
          <textarea className={`${inputClassName} min-h-32 resize-y`} value={values.useOfFunds} onChange={onTextChange("useOfFunds")} />
        </Field>
        <Field label="Risks" hint="One item per line, from one through six items.">
          <textarea className={`${inputClassName} min-h-32 resize-y`} value={values.risks} onChange={onTextChange("risks")} />
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
    <div className="space-y-8">
      <section aria-labelledby="provider-deploy-review" className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Review</p>
          <h2 id="provider-deploy-review" className="text-2xl font-semibold tracking-tight">Check the prepared details</h2>
          <p className="text-sm leading-6 text-muted-foreground">Nothing is sent from this page. The values below remain a local, editable preview.</p>
        </div>
        <dl className="grid gap-3 rounded-[calc(var(--radius)*0.75)] border bg-muted/30 p-4 text-sm sm:grid-cols-2">
          {reviewRows.map(([label, value]) => (
            <div key={label} className="space-y-1">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <ProviderDeployStages states={providerDeployStageStates(atsCreateConfiguration)} projection={atsCreateConfiguration} />
    </div>
  );
}

export function ProviderDeployWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<WizardValues>(initialValues);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const currentDefinition = providerDeploySteps[currentStep];

  function changeText(field: Exclude<keyof WizardValues, "category" | "acknowledgement">) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((previous) => ({ ...previous, [field]: event.target.value }));
      setValidationMessage(null);
    };
  }

  function changeCategory(event: ChangeEvent<HTMLSelectElement>) {
    const category = providerDeployCategories.find((value) => value === event.target.value);
    if (!category) return;
    setValues((previous) => ({ ...previous, category }));
  }

  function changeAcknowledgement(event: ChangeEvent<HTMLInputElement>) {
    setValues((previous) => ({ ...previous, acknowledgement: event.target.checked }));
    setValidationMessage(null);
  }

  function moveForward() {
    const invalidInputMessage = inputError(values, currentStep);
    if (invalidInputMessage) {
      setValidationMessage(invalidInputMessage);
      return;
    }
    if (!canAdvance(currentStep, values)) return;
    setValidationMessage(null);
    setCurrentStep((step) => Math.min(step + 1, providerDeploySteps.length - 1));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    moveForward();
  }

  function renderCurrentStep() {
    switch (currentStep) {
      case 0:
        return <ToolDetailsStep values={values} onTextChange={changeText} onCategoryChange={changeCategory} />;
      case 1:
        return <InterfaceStep values={values} onTextChange={changeText} />;
      case 2:
        return <PricingStep values={values} onTextChange={changeText} />;
      case 3:
        return <TermsStep values={values} onTextChange={changeText} onAcknowledgementChange={changeAcknowledgement} />;
      default:
        return <ReviewStep values={values} />;
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 pb-8 sm:pb-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{campaignFixture.label}</Badge>
          <Badge variant="outline">Provider workspace</Badge>
        </div>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Prepare a tool offering</h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Shape a clear local preview before any separate signing or provider action is considered.
          </p>
        </div>
        <p className="border-l-2 border-border pl-4 text-sm leading-6 text-muted-foreground">
          Demo values are editable and local to this browser view. They do not create, publish, sign, or verify anything.
        </p>
      </header>

      <Card>
        <CardHeader className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{stepCaption(currentStep)}</p>
              <CardTitle>{currentDefinition?.label}</CardTitle>
              <CardDescription>Complete this local preview, then review the next bounded step.</CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">{currentStep + 1} / {providerDeploySteps.length}</Badge>
          </div>
          <StepProgress currentStep={currentStep} />
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-6">
            {renderCurrentStep()}
            {validationMessage ? <p aria-live="polite" className="rounded-[calc(var(--radius)*0.75)] border border-warning bg-warning px-3 py-2 text-sm text-warning-foreground">{validationMessage}</p> : null}
          </CardContent>
          <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" disabled={!canGoBack(currentStep)} onClick={() => { setCurrentStep((step) => Math.max(0, step - 1)); setValidationMessage(null); }}>
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
