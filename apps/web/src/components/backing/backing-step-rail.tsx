import type { RailPosition } from "./backing-presentation";

const steps = ["Choose amount", "Sign command", "Send HBAR", "Allocation"];

export function BackingStepRail({ current, done }: RailPosition) {
  return (
    <ol aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {steps.map((label, index) => {
        const step = index + 1;
        return (
          <li key={label} className={`flex items-center gap-2 ${step <= done ? "text-foreground" : step === current ? "font-medium text-primary" : "text-muted-foreground"}`}>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs">{step <= done ? "✓" : step}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
