"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonVariants } from "../../ui/button";
import { createProviderToolAllocationRequest, parseProviderToolAllocation } from "../../../lib/provider-tools-client";

function requestId(): string | null {
  const value = globalThis.crypto?.randomUUID?.();
  return typeof value === "string" ? value.toLowerCase() : null;
}

export function NewToolAction() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [retryId, setRetryId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function allocate() {
    const id = retryId ?? requestId();
    if (id === null) { setMessage("A new tool could not be prepared in this browser."); return; }
    const init = createProviderToolAllocationRequest(id);
    if (init === null) { setMessage("A new tool could not be prepared."); return; }
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/provider/tools", init);
      const allocation = response.ok ? parseProviderToolAllocation(await response.json()) : null;
      if (allocation === null) throw new Error("allocation failed");
      setRetryId(null);
      router.push(`/provider/deploy?tool=${encodeURIComponent(allocation.tool.toolPublicId)}`);
    } catch {
      setRetryId(id);
      setMessage("The request was not confirmed. Retry uses the same request, so it will not create another tool.");
    } finally {
      setPending(false);
    }
  }

  return <>
    <button type="button" className={buttonVariants({ size: "lg", shape: "pill" })} onClick={() => { setOpen(true); setMessage(null); }}>
      Deploy a new tool
    </button>
    {open ? <div role="dialog" aria-modal="true" aria-labelledby="new-tool-title" className="fixed inset-0 z-50 grid place-items-center bg-foreground/35 p-4" onKeyDown={(event) => { if (event.key === "Escape" && !pending) setOpen(false); }}>
      <div className="w-full max-w-lg rounded-panel border bg-card p-6 shadow-xl">
        <h2 id="new-tool-title" className="text-2xl font-bold tracking-tight">Deploy a new tool?</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">This starts a separate tool with its own deployment records. Your existing tools, receipts, and Directory records are unchanged.</p>
        {message === null ? null : <p role="status" className="mt-4 text-sm text-destructive">{message}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className={buttonVariants({ variant: "outline", shape: "pill" })} disabled={pending} onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className={buttonVariants({ shape: "pill" })} disabled={pending} onClick={() => void allocate()}>{pending ? "Creating…" : retryId === null ? "Create new tool" : "Retry creation"}</button>
        </div>
      </div>
    </div> : null}
  </>;
}
