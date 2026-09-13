"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useWalletSession } from "../wallet/wallet-session";

export function DashboardSessionSync({ address }: { readonly address: string }) {
  const { state, settled } = useWalletSession();
  const router = useRouter();
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
      router.replace("/sign-in");
      router.refresh();
    }).catch(() => undefined);
  }, [address, router, settled, state]);

  return null;
}
