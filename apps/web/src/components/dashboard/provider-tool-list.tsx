"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { parseProviderToolPage, type ProviderToolSummary } from "../../lib/provider-tools-client.ts";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";

const maximumTools = 50;

async function readPage(cursor: string | null) {
  const query = cursor === null ? "" : `?cursor=${encodeURIComponent(cursor)}`;
  try {
    const response = await globalThis.fetch(`/api/provider/tools${query}`, {
      method: "GET", headers: { accept: "application/json" }, credentials: "same-origin", cache: "no-store",
    });
    if (response.status !== 200 || !response.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
    return parseProviderToolPage(await response.json());
  } catch {
    return null;
  }
}

function appendTools(current: readonly ProviderToolSummary[], incoming: readonly ProviderToolSummary[]) {
  const seen = new Set(current.map((tool) => tool.toolPublicId));
  return Object.freeze([...current, ...incoming.filter((tool) => !seen.has(tool.toolPublicId))].slice(0, maximumTools));
}

export function ProviderToolList() {
  const [tools, setTools] = useState<readonly ProviderToolSummary[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void readPage(null).then((page) => {
      if (cancelled) return;
      const initial = page?.tools ?? [];
      setTools(initial);
      setNextCursor(initial.length >= maximumTools ? null : page?.nextCursor ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  async function loadMore() {
    if (nextCursor === null || loadingMore || tools === null || tools.length >= maximumTools) return;
    setLoadingMore(true);
    const page = await readPage(nextCursor);
    if (page !== null) {
      const next = appendTools(tools, page.tools);
      setTools(next);
      setNextCursor(next.length >= maximumTools ? null : page.nextCursor);
    }
    setLoadingMore(false);
  }

  if (tools === null) return <p className="text-sm text-muted-foreground">Loading your tools…</p>;
  if (tools.length === 0) return <p className="text-sm text-muted-foreground">No additional tools have been created yet.</p>;
  return (
    <div className="mt-3 grid gap-3">
      <ul className="grid gap-3" aria-label="Your tools">
        {tools.map((tool) => (
          <li key={tool.toolPublicId} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-border bg-background p-3">
            <div className="min-w-0"><p className="truncate font-semibold">{tool.title}</p><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{tool.toolPublicId}</p></div>
            <div className="flex items-center gap-2"><Badge variant="secondary">{tool.state}</Badge><Link href={tool.state === "OPEN" || tool.state === "CLOSED" ? `/provider?tool=${encodeURIComponent(tool.toolPublicId)}` : `/provider/deploy?tool=${encodeURIComponent(tool.toolPublicId)}`} className={buttonVariants({ variant: "outline", size: "sm" })}>{tool.state === "OPEN" || tool.state === "CLOSED" ? "View" : "Resume"}</Link></div>
          </li>
        ))}
      </ul>
      {nextCursor === null ? null : <button type="button" className={buttonVariants({ variant: "outline", size: "sm" })} disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "Loading…" : "Load more tools"}</button>}
    </div>
  );
}
