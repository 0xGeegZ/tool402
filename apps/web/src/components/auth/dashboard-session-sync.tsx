"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useConnectionEffect } from "wagmi";

import { useTool402Wallet } from "../wallet/use-tool402-wallet";

export function DashboardSessionSync({
  address,
  children,
}: {
  readonly address: string;
  readonly children: ReactNode;
}) {
  const { connection, resolved } = useTool402Wallet();
  const logoutStarted = useRef(false);
  const [logoutFailed, setLogoutFailed] = useState(false);
  const currentSessionMatches = connection.status === "connected"
    && connection.chainId === 296
    && connection.account === address;

  const endSession = useCallback(() => {
    if (logoutStarted.current) return;
    logoutStarted.current = true;
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }).then((response) => {
      if (response.status !== 204) {
        setLogoutFailed(true);
        return;
      }
      window.location.replace("/sign-in");
    }).catch(() => {
      setLogoutFailed(true);
    });
  }, []);

  const retryLogout = useCallback(() => {
    logoutStarted.current = false;
    setLogoutFailed(false);
    endSession();
  }, [endSession]);

  useConnectionEffect({ onDisconnect: endSession });

  useEffect(() => {
    if (!resolved) return;
    if (currentSessionMatches) return;
    endSession();
  }, [currentSessionMatches, endSession, resolved]);

  if (!resolved || currentSessionMatches) return children;
  return (
    <div role="alert" aria-live="polite" className="p-6 text-sm text-muted-foreground">
      <p>{logoutFailed
        ? "Your dashboard session could not be ended safely. Retry ending it before continuing."
        : "Ending the dashboard session safely…"}</p>
      {logoutFailed ? <button type="button" onClick={retryLogout}>Retry ending dashboard session</button> : null}
    </div>
  );
}
