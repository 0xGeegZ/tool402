import Link from "next/link";

const links = [
  { href: "/explore", label: "Explore tools" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/demo", label: "Guided demo" },
  { href: "/provider", label: "For providers" },
] as const;

export function LocalNavigation() {
  return (
    <nav aria-label="Main navigation">
      <ul className="flex flex-wrap items-center justify-end gap-1 text-[13px] font-semibold">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="rounded-full px-3.5 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
