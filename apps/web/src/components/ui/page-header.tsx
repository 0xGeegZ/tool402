import Link from "next/link";

import { Badge } from "./badge";
import { buttonVariants } from "./button";

type PageHeaderAction = {
  readonly href: string;
  readonly label: string;
};

type PageHeaderActions =
  | readonly []
  | readonly [PageHeaderAction]
  | readonly [PageHeaderAction, PageHeaderAction]
  | readonly [PageHeaderAction, PageHeaderAction, PageHeaderAction];

type PageHeaderProps = {
  readonly title: string;
  readonly description?: string;
  readonly eyebrow?: string;
  readonly actions?: PageHeaderActions;
};

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="max-w-3xl space-y-4">
      {eyebrow ? <Badge variant="outline" className="w-fit">{eyebrow}</Badge> : null}
      <h1 className="text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">{title}</h1>
      {description ? <p className="text-lg leading-8 text-muted-foreground">{description}</p> : null}
      {actions?.length ? (
        <div className="flex flex-wrap gap-3 pt-2">
          {actions.map((action, index) => (
            <Link key={action.href} href={action.href} className={buttonVariants({ variant: index === 0 ? "primary" : "outline", size: "md" })}>
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
