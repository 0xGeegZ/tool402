import Link from "next/link";

import { Badge } from "./badge";
import { buttonVariants } from "./button";

export type PageHeaderAction = Readonly<{ href: string; label: string }>;

export type PageHeaderActions =
  | readonly [PageHeaderAction]
  | readonly [PageHeaderAction, PageHeaderAction]
  | readonly [PageHeaderAction, PageHeaderAction, PageHeaderAction];

export type PageHeaderProps = Readonly<{
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: PageHeaderActions;
}>;

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="max-w-3xl space-y-4">
      {eyebrow === undefined ? null : <Badge variant="outline" className="w-fit">{eyebrow}</Badge>}
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      {description === undefined ? null : <p className="text-lg leading-8 text-muted-foreground">{description}</p>}
      {actions === undefined ? null : (
        <div className="flex flex-wrap gap-3">
          {actions.map((action, index) => (
            <Link key={action.href} href={action.href} className={buttonVariants({ variant: index === 0 ? "primary" : "outline" })}>
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
