"use client";

import { useEffect, useRef } from "react";

import { useWalletSession } from "../wallet/wallet-session";

export function DashboardSessionSync({ address }: { readonly address: string }) {
  const { state, settled } = useWalletSession();
  const logoutStarted = useRef(false);

  useEffect(() => {
    if (!settled) return;
    if (
      (state.kind === "connected" || state.kind === "not_issuer")
      && state.address === address
    ) return;
    if (logoutStarted.current) return;
    logoutStarted.current = true;
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }).then((response) => {
      if (response.status !== 204) return;
      window.location.replace("/sign-in");
    }).catch(() => undefined);
  }, [address, settled, state]);

  return null;
}
