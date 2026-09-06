import Link from "next/link";

const links = [
  { href: "/explore", label: "Explore" },
  { href: "/explore/riskscan", label: "RiskScan" },
  { href: "/explore/riskscan/tool-loop", label: "Tool loop" },
  { href: "/dashboard/riskscan/compatibility", label: "Native compatibility" },
  { href: "/dashboard/riskscan", label: "RiskScan workbench" },
] as const;

export function WorkspaceNavigation() {
  return (
    <nav aria-label="Workspace route map">
      <ul className="flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
