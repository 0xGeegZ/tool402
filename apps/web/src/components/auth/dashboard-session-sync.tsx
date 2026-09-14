"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { connection, resolved } = useTool402Wallet();
  const logoutStarted = useRef(false);
  const hasMatchedSessionWallet = useRef(false);
  const connectionRef = useRef(connection);
  connectionRef.current = connection;
  const [logoutFailed, setLogoutFailed] = useState(false);
  const currentSessionMatches = connection.status === "connected"
    && connection.chainId === 296
    && connection.account === address;

  const navigateToSignIn = useCallback(() => {
    const wallet = connectionRef.current;
    router.replace(
      wallet.status === "connected" && wallet.account !== address
        ? "/sign-in/account-changed"
        : "/sign-in",
    );
  }, [address, router]);

  const navigateToAccountChangedSignIn = useCallback(() => {
    router.replace("/sign-in/account-changed");
  }, [router]);

  const endSession = useCallback(() => {
    if (logoutStarted.current) return;
    logoutStarted.current = true;
    void fetch("/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ address, issuedAt }),
    }).then((response) => {
      if (response.status === 204) {
        navigateToSignIn();
        return;
      }
      if (response.status === 409) {
        navigateToAccountChangedSignIn();
        return;
      }
      setLogoutFailed(true);
    }).catch(() => {
      setLogoutFailed(true);
    });
  }, [address, issuedAt, navigateToAccountChangedSignIn, navigateToSignIn]);

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
      return;
    }
    if (connection.status === "connected" || hasMatchedSessionWallet.current) endSession();
  }, [connection.status, currentSessionMatches, endSession, resolved]);

  if (!resolved || currentSessionMatches) return children;
  if (!hasMatchedSessionWallet.current && connection.status !== "connected") {
    return <div role="status" aria-live="polite" className="p-6 text-sm text-muted-foreground">Restoring the signed MetaMask wallet…</div>;
  }
  return (
    <div role="alert" aria-live="polite" className="p-6 text-sm text-muted-foreground">
      <p>{logoutFailed
        ? "Your dashboard session could not be ended safely. Retry ending it before continuing."
        : "Ending the dashboard session safely…"}</p>
      {logoutFailed ? <button type="button" onClick={retryLogout}>Retry ending dashboard session</button> : null}
    </div>
  );
}
