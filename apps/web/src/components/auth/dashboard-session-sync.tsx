"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useConnectionEffect } from "wagmi";

import { useTool402Wallet } from "../wallet/use-tool402-wallet";

export function DashboardSessionSync({
  address,
  issuedAt,
  children,
}: {
  readonly address: string;
  readonly issuedAt: string;
  readonly children: ReactNode;
}) {
  const { connection, resolved } = useTool402Wallet();
  const logoutStarted = useRef(false);
  const hasMatchedSessionWallet = useRef(false);
  const connectionRef = useRef(connection);
  connectionRef.current = connection;
  const [logoutFailed, setLogoutFailed] = useState(false);
  const [logoutInvalidated, setLogoutInvalidated] = useState(false);
  const currentSessionMatches = connection.status === "connected"
    && connection.chainId === 296
    && connection.account === address;

  const endSession = useCallback(() => {
    if (logoutStarted.current) return;
    logoutStarted.current = true;
    const logoutGeneration = connectionRef.current.generation;
    void fetch("/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ address, issuedAt }),
    }).then((response) => {
      const switchedWalletIsStillActive = connectionRef.current.status === "connected" && connectionRef.current.account !== address;
      if (connectionRef.current.generation !== logoutGeneration) {
        if (switchedWalletIsStillActive) {
          window.location.replace("/sign-in?switch=1");
          return;
        }
        setLogoutInvalidated(true);
        return;
      }
      if (response.status === 409) {
        if (switchedWalletIsStillActive) {
          window.location.replace("/sign-in?switch=1");
          return;
        }
        setLogoutInvalidated(true);
        return;
      }
      if (response.status !== 204) {
        setLogoutFailed(true);
        return;
      }
      window.location.replace("/sign-in");
    }).catch(() => {
      setLogoutFailed(true);
    });
  }, [address, issuedAt]);

  const retryLogout = useCallback(() => {
    logoutStarted.current = false;
    setLogoutFailed(false);
    endSession();
  }, [endSession]);

  useConnectionEffect({
    onDisconnect() {
      if (hasMatchedSessionWallet.current) endSession();
    },
  });

  useEffect(() => {
    if (!resolved) return;
    if (currentSessionMatches) {
      hasMatchedSessionWallet.current = true;
      if (logoutStarted.current) setLogoutInvalidated(true);
      return;
    }
    if (connection.status === "connected" || hasMatchedSessionWallet.current) endSession();
  }, [connection.status, currentSessionMatches, endSession, resolved]);

  if (!resolved || (currentSessionMatches && !logoutInvalidated)) return children;
  if (!hasMatchedSessionWallet.current && connection.status !== "connected") {
    return <div role="status" aria-live="polite" className="p-6 text-sm text-muted-foreground">Restoring the signed MetaMask wallet…</div>;
  }
  return (
    <div role="alert" aria-live="polite" className="p-6 text-sm text-muted-foreground">
      <p>{logoutInvalidated
        ? "Your wallet changed while ending the dashboard session. Reload the page to check the signed session."
        : logoutFailed
        ? "Your dashboard session could not be ended safely. Retry ending it before continuing."
        : "Ending the dashboard session safely…"}</p>
      {logoutInvalidated ? <button type="button" onClick={() => window.location.reload()}>Reload dashboard session</button> : null}
      {logoutFailed && !logoutInvalidated ? <button type="button" onClick={retryLogout}>Retry ending dashboard session</button> : null}
    </div>
  );
}
