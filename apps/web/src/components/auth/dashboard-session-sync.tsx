"use client";

import { useEffect, useRef } from "react";

import { useTool402Wallet } from "../wallet/use-tool402-wallet";

export function DashboardSessionSync({ address }: { readonly address: string }) {
  const { connection, resolved } = useTool402Wallet();
  const logoutStarted = useRef(false);

  useEffect(() => {
    if (!resolved) return;
    if (connection.status === "connected" && connection.chainId === 296 && connection.account === address) return;
    if (logoutStarted.current) return;
    logoutStarted.current = true;
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }).then((response) => {
      if (response.status !== 204) return;
      window.location.replace("/sign-in");
    }).catch(() => undefined);
  }, [address, connection, resolved]);

  return null;
}
