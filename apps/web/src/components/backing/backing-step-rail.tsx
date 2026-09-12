import { railPosition } from "./backing-presentation.ts";
import type { BackingViewKind } from "./backing-state.ts";

const steps = ["Choose amount", "Sign command", "Send HBAR", "Allocation"] as const;

export function BackingStepRail({ kind, signing }: { kind: BackingViewKind; signing: boolean }) {
  const position = railPosition(kind, signing);
  return (
    <ol aria-hidden="true" className="grid grid-cols-4 gap-2 text-center text-xs">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const done = stepNumber <= position.done;
        const current = stepNumber === position.current;
        return <li key={step} className={current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}>
          <span className="block font-medium">{done ? "✓" : stepNumber}</span>
          <span>{step}</span>
        </li>;
      })}
    </ol>
  );
}
