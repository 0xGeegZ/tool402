import { GuidedDemoSteps } from "../../components/demo/guided-demo-steps";
import { PageHeader } from "../../components/ui/page-header";

export default function DemoPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-4xl space-y-8">
        <PageHeader eyebrow="Guided demo" title="Take the guided tour" description="Open the local product screens in a clear demonstration order." />
        <GuidedDemoSteps />
      </article>
    </main>
  );
}
