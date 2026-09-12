"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useWalletSession } from "../wallet/wallet-session";

export function DashboardSessionSync() {
  const router = useRouter();
  const { state } = useWalletSession();
  const observedIdentity = useRef(false);
  const logoutStarted = useRef(false);

  useEffect(() => {
    if (state.kind === "connected" || state.kind === "not_issuer") {
      observedIdentity.current = true;
      logoutStarted.current = false;
      return;
    }
    if (state.kind !== "disconnected" || !observedIdentity.current || logoutStarted.current) {
      return;
    }

    observedIdentity.current = false;
    logoutStarted.current = true;
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }).then((response) => {
      if (response.status !== 204) return;
      router.replace("/sign-in");
      router.refresh();
    }).catch(() => undefined);
  }, [router, state.kind]);

  return null;
}
