"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { parseProviderToolPage, type ProviderToolSummary } from "../../lib/provider-tools-client.ts";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";

export function ProviderToolList() {
  const [tools, setTools] = useState<readonly ProviderToolSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void globalThis.fetch("/api/provider/tools", {
      method: "GET", headers: { accept: "application/json" }, credentials: "same-origin", cache: "no-store",
    }).then(async (response) => response.status === 200 ? parseProviderToolPage(await response.json()) : null)
      .then((page) => { if (!cancelled) setTools(page?.tools ?? []); })
      .catch(() => { if (!cancelled) setTools([]); });
    return () => { cancelled = true; };
  }, []);

  if (tools === null) return <p className="text-sm text-muted-foreground">Loading your tools…</p>;
  if (tools.length === 0) return <p className="text-sm text-muted-foreground">No additional tools have been created yet.</p>;
  return (
    <ul className="mt-3 grid gap-3" aria-label="Your tools">
      {tools.map((tool) => (
        <li key={tool.toolPublicId} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-border bg-background p-3">
          <div className="min-w-0"><p className="truncate font-semibold">{tool.title}</p><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{tool.toolPublicId}</p></div>
          <div className="flex items-center gap-2"><Badge variant="secondary">{tool.state}</Badge><Link href={`/provider/deploy?tool=${encodeURIComponent(tool.toolPublicId)}`} className={buttonVariants({ variant: "outline", size: "sm" })}>{tool.state === "OPEN" || tool.state === "CLOSED" ? "View" : "Resume"}</Link></div>
        </li>
      ))}
    </ul>
  );
}
