"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useConnectionEffect } from "wagmi";

import { Button } from "../ui/button";
import { useTool402Wallet } from "../wallet/use-tool402-wallet";

export async function serializeDashboardSessionMutation<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || navigator.locks === undefined) {
    return await operation();
  }
  return await navigator.locks.request("tool402:dashboard-session", { mode: "exclusive" }, operation);
}

function matchesDashboardWallet(connection: ReturnType<typeof useTool402Wallet>["connection"], address: string): boolean {
  return connection.status === "connected"
    && connection.account === address
    && connection.chainId === 296;
}

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
  const currentSessionMatches = matchesDashboardWallet(connection, address);

  const navigateToSignIn = useCallback(() => {
    const wallet = connectionRef.current;
    router.replace(
      wallet.status === "connected" && wallet.account !== address
        ? "/sign-in/account-changed"
        : "/sign-in",
    );
  }, [address, router]);

  const endSession = useCallback(() => {
    if (logoutStarted.current) return;
    logoutStarted.current = true;
    void serializeDashboardSessionMutation(async () => {
      if (matchesDashboardWallet(connectionRef.current, address)) {
        logoutStarted.current = false;
        return;
      }
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ address, issuedAt }),
      });
      if (response.status === 204) {
        navigateToSignIn();
        return;
      }
      if (response.status === 409) {
        // The browser has already established a newer signed session. Do not
        // let this stale logout redirect or mask that current account.
        logoutStarted.current = false;
        router.refresh();
        return;
      }
      setLogoutFailed(true);
    }).catch(() => {
      setLogoutFailed(true);
    });
  }, [address, issuedAt, navigateToSignIn, router]);

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
    if (hasMatchedSessionWallet.current || (
      connection.status === "connected"
      && (connection.account !== address || connection.chainId !== 296)
    )) {
      endSession();
    }
  }, [address, connection.account, connection.chainId, connection.status, currentSessionMatches, endSession, resolved]);

  if (!resolved || currentSessionMatches || (!hasMatchedSessionWallet.current && connection.status !== "connected")) {
    return children;
  }
  return (
    <div role="alert" aria-live="polite" className="p-6 text-sm text-muted-foreground">
      <p>{logoutFailed
        ? "Your dashboard session could not be ended safely. Retry ending it before continuing."
        : "Ending the dashboard session safely…"}</p>
      {logoutFailed ? <Button variant="outline" onClick={retryLogout}>Retry ending dashboard session</Button> : null}
    </div>
  );
}
