"use client";

import Link from "next/link";

import { buttonVariants } from "../ui/button";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const publicLinks = [
  { href: "/explore", label: "Explore tools" },
  { href: "/docs", label: "Docs" },
  { href: "/demo", label: "Guided demo" },
  { href: "/provider", label: "Campaign" },
] as const;

const dashboardLink = { href: "/dashboard", label: "Dashboard" } as const;

type NavigationLink = (typeof publicLinks)[number] | typeof dashboardLink;

function isActiveLink(pathname: string, href: NavigationLink["href"]) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SheetContentProps = {
  readonly children: ReactNode;
  readonly side: "right";
};

function SheetContent({ children, side }: SheetContentProps) {
  return (
    <aside
      id="mobile-navigation-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-navigation-title"
      data-side={side}
      onClick={(event) => event.stopPropagation()}
      className="absolute inset-y-0 right-0 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col border-l border-border bg-background p-5"
    >
      {children}
    </aside>
  );
}

export function LocalNavigation({ showDashboard = false }: Readonly<{ showDashboard?: boolean }>) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const links: readonly NavigationLink[] = showDashboard
    ? [...publicLinks, dashboardLink]
    : publicLinks;

  function closeMenu({ restoreFocus = false }: { restoreFocus?: boolean } = {}) {
    setMenuOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuTriggerRef.current?.focus());
    }
  }

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const frame = window.requestAnimationFrame(() => menuCloseRef.current?.focus());
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
      }
      if (event.key === "Tab") {
        const panel = document.getElementById("mobile-navigation-panel");
        const focusable = panel?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const desktopBreakpoint = window.matchMedia("(min-width: 1024px)");
    function closeAtDesktopBreakpoint() {
      if (desktopBreakpoint.matches) setMenuOpen(false);
    }

    closeAtDesktopBreakpoint();
    desktopBreakpoint.addEventListener("change", closeAtDesktopBreakpoint);
    return () => desktopBreakpoint.removeEventListener("change", closeAtDesktopBreakpoint);
  }, []);

  return (
    <nav aria-label="Main navigation">
      <ul className="hidden items-center gap-1 lg:flex">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActiveLink(pathname, link.href) ? "page" : undefined}
              className={`touch-target rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isActiveLink(pathname, link.href) ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 lg:hidden">
        <Link
          href="/explore"
          className={buttonVariants({ variant: "outline", shape: "pill", className: "bg-secondary font-semibold" })}
        >
          Explore
        </Link>
        <button
          ref={menuTriggerRef}
          type="button"
          aria-label="Open menu"
          aria-controls="mobile-navigation-panel"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="inline-flex size-10 touch-target items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5">
            <path d="M3.5 6.25h13M3.5 10h13M3.5 13.75h13" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {menuOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-[1px] lg:hidden"
              onClick={() => closeMenu({ restoreFocus: true })}
            >
              <SheetContent side="right">
                <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tool402</p>
                    <h2 id="mobile-navigation-title" className="mt-1 text-xl font-bold tracking-tight text-foreground">
                      Navigate
                    </h2>
                  </div>
                  <button
                    ref={menuCloseRef}
                    type="button"
                    aria-label="Close menu"
                    onClick={() => closeMenu({ restoreFocus: true })}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5">
                      <path d="m5.5 5.5 9 9m0-9-9 9" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <ul className="mt-5 grid gap-1">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => closeMenu()}
                        aria-current={isActiveLink(pathname, link.href) ? "page" : undefined}
                        className={`flex min-h-11 items-center rounded-control px-3 text-base font-semibold transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isActiveLink(pathname, link.href) ? "bg-secondary text-foreground" : "text-foreground"}`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto border-t border-border pt-5">
                  <Link
                    href="/provider/deploy"
                    onClick={() => closeMenu()}
                    className={buttonVariants({ size: "lg", shape: "pill", className: "w-full font-semibold" })}
                  >
                    Prepare a tool
                  </Link>
                </div>
              </SheetContent>
            </div>,
            document.body,
          )
        : null}
    </nav>
  );
}
