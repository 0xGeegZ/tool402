"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { buttonVariants } from "../../ui/button";
import { createProviderToolAllocationRequest, parseProviderToolAllocation } from "../../../lib/provider-tools-client";

const retryStorageKey = "tool402:provider-tool-allocation-request-id";

function storedRetryId(): string | null {
  try {
    const value = globalThis.sessionStorage?.getItem(retryStorageKey);
    return createProviderToolAllocationRequest(value ?? "") === null ? null : value;
  } catch {
    return null;
  }
}

function persistRetryId(value: string | null): void {
  try {
    if (value === null) globalThis.sessionStorage?.removeItem(retryStorageKey);
    else globalThis.sessionStorage?.setItem(retryStorageKey, value);
  } catch {
    // Storage is only a retry convenience; allocation remains explicitly user initiated.
  }
}

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
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const retry = storedRetryId();
    if (retry !== null) setRetryId(retry);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open]);

  async function allocate() {
    const id = retryId ?? requestId();
    if (id === null) { setMessage("A new tool could not be prepared in this browser."); return; }
    const init = createProviderToolAllocationRequest(id);
    if (init === null) { setMessage("A new tool could not be prepared."); return; }
    persistRetryId(id);
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/provider/tools", init);
      const allocation = response.ok ? parseProviderToolAllocation(await response.json()) : null;
      if (allocation === null) throw new Error("allocation failed");
      persistRetryId(null);
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
    <button type="button" className={buttonVariants({ size: "lg", shape: "pill" })} onClick={() => { setOpen(true); setMessage(retryId === null ? null : "Retry the earlier creation request without creating another tool."); }}>
      Deploy a new tool
    </button>
    {open ? <div role="dialog" aria-modal="true" aria-labelledby="new-tool-title" className="fixed inset-0 z-50 grid place-items-center bg-foreground/35 p-4" onKeyDown={(event) => {
      if (event.key === "Escape" && !pending) { setOpen(false); return; }
      if (event.key !== "Tab") return;
      const targets = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])") ?? [])];
      if (targets.length === 0) return;
      const current = targets.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? (current <= 0 ? targets.length - 1 : current - 1) : (current === targets.length - 1 ? 0 : current + 1);
      event.preventDefault();
      targets[next]?.focus();
    }}>
      <div ref={dialogRef} className="w-full max-w-lg rounded-panel border bg-card p-6 shadow-xl">
        <h2 id="new-tool-title" className="text-2xl font-bold tracking-tight">Deploy a new tool?</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">A separate tool will be created with prefilled details you can edit. Your existing tools and deployments remain unchanged.</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Deployment requires new signatures and testnet transaction fees.</p>
        {message === null ? null : <p role="status" className="mt-4 text-sm text-destructive">{message}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className={buttonVariants({ variant: "outline", shape: "pill" })} disabled={pending} onClick={() => setOpen(false)}>Keep current tool</button>
          <button data-autofocus type="button" className={buttonVariants({ shape: "pill" })} disabled={pending} onClick={() => void allocate()}>{pending ? "Creating…" : retryId === null ? "Create new tool" : "Retry creation"}</button>
        </div>
      </div>
    </div> : null}
  </>;
}
