import { Logo } from "../tool402/logo";

export function LandingFooter() {
  return (
    <footer className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
      <Logo className="h-7" />
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        A marketplace-shaped starting point for the tools agents use.
      </p>
    </footer>
  );
}
