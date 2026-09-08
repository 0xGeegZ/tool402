import { GuidedDemoSteps } from "../../components/demo/guided-demo-steps";
import { Badge } from "../../components/ui/badge";

export default function DemoPage() {
  return (
    <main className="py-6 sm:py-12">
      <article className="mx-auto max-w-4xl space-y-8">
        <header className="max-w-2xl space-y-3">
          <Badge variant="secondary">Guided demo</Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Take the guided tour</h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Open the local product screens in a clear demonstration order.
          </p>
        </header>
        <GuidedDemoSteps />
      </article>
    </main>
  );
}
