import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/dashboard", label: "Workspace" },
] as const;

export function LocalNavigation() {
  return (
    <nav aria-label="Main navigation">
      <ul className="flex items-center gap-1 text-sm font-medium">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="rounded-[var(--radius)] px-3 py-2 transition-colors hover:bg-muted">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
