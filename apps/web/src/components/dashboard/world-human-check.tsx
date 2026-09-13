"use client";

import { IDKitRequestWidget, selfieCheckLegacy, type IDKitResult, type RpContext } from "@worldcoin/idkit";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "../ui/button";
import { Status, type StatusTone } from "../ui/status";

type RequestValues = Readonly<{
  app_id: `app_${string}`;
  action: string;
  environment: "sandbox" | "production";
  rp_context: RpContext;
}>;

type Announcement = Readonly<{ tone: StatusTone; message: string }>;

const preparing: Announcement = { tone: "working", message: "Preparing the World request." };
const waiting: Announcement = { tone: "working", message: "Waiting for the World App. Scan the code, then take the selfie check on your phone." };
const verified: Announcement = { tone: "success", message: "Verified. Refreshing your identity card." };
const abandoned: Announcement = { tone: "warning", message: "Verification did not complete. Try again when you are ready." };
const refused: Announcement = { tone: "error", message: "World could not verify this selfie check. Nothing was stored." };
const unavailable: Announcement = { tone: "error", message: "World verification is not available on this host." };
const notEnabled: Announcement = { tone: "error", message: "Selfie Check is not enabled for this World app yet." };

function describeError(code: string): Announcement {
  if (code === "credential_unavailable" || code === "feature_unavailable") return notEnabled;
  return { tone: "error", message: `World returned ${code}. Nothing was stored.` };
}

export function WorldHumanCheck({ address }: { address: string }) {
  const router = useRouter();
  const [request, setRequest] = useState<RequestValues | null>(null);
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  async function start() {
    setAnnouncement(preparing);
    const response = await fetch("/api/world/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address }),
      credentials: "same-origin",
      cache: "no-store",
    }).catch(() => null);
    if (response === null || !response.ok) {
      setAnnouncement(unavailable);
      return;
    }
    setRequest(await response.json());
    setAnnouncement(waiting);
    setOpen(true);
  }

  async function send(result: IDKitResult) {
    const response = await fetch("/api/world/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, idkitResponse: result }),
      credentials: "same-origin",
      cache: "no-store",
    }).catch(() => null);
    if (response !== null && response.ok) {
      setAnnouncement(verified);
      return;
    }
    setAnnouncement(response !== null && response.status === 403 ? refused : unavailable);
    throw new Error("world_verification_failed");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) return;
    setAnnouncement((current) => (current !== null && current.tone === "working" ? abandoned : current));
  }

  function handleError(code: string) {
    setAnnouncement((current) => (current !== null && current.tone === "error" ? current : describeError(code)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button size="sm" onClick={start}>Verify with World</Button>
      </div>
      {announcement === null ? null : <Status tone={announcement.tone}>{announcement.message}</Status>}
      {request === null ? null : (
        <IDKitRequestWidget
          open={open}
          onOpenChange={handleOpenChange}
          app_id={request.app_id}
          action={request.action}
          environment={request.environment}
          rp_context={request.rp_context}
          allow_legacy_proofs={true}
          preset={selfieCheckLegacy({ signal: address })}
          handleVerify={send}
          onSuccess={() => {
            setAnnouncement(verified);
            router.refresh();
          }}
          onError={(code) => handleError(String(code))}
        />
      )}
    </div>
  );
}
