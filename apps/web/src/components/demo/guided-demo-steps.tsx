import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { recordingSteps, recordingTourHref } from "./demo-control-room";

export const steps = recordingSteps;

export function GuidedDemoSteps() {
  return (
    <section aria-labelledby="recording-itinerary" className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Recording itinerary</p>
        <h2 id="recording-itinerary" className="mt-1 text-2xl font-bold">Follow the story in order</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">The guide keeps all presenter notes in the browser. It never creates a payment, signature, asset, or proof.</p>
      </div>
      <ol className="grid gap-4 md:grid-cols-2">
        {recordingSteps.map((step, index) => (
          <li key={step.id}>
            <Card className="h-full rounded-card shadow-none">
              <CardHeader className="gap-2">
                <p className="text-sm font-medium text-primary">Step {String(index + 1).padStart(2, "0")}</p>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.show}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6"><strong>DO:</strong> {step.do}</p>
                <p className="text-sm leading-6"><strong>SAY:</strong> {step.say}</p>
                {step.wallet === null ? null : <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Wallet needed: {step.wallet}</p>}
                <Link href={recordingTourHref(step.href, step.id)} className="inline-flex min-h-9 touch-target items-center rounded-control bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Open this step →
                </Link>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
