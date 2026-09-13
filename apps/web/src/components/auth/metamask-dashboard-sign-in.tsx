"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignMessage } from "wagmi";

import { Button } from "../ui/button";
import { dashboardTourHref } from "../demo/demo-tour-navigation";
import { isTool402MetaMaskConnector, useTool402Wallet, type Tool402WalletConnection } from "../wallet/use-tool402-wallet";

const failureMessage = "Sign-in could not be completed. Please try again.";

function isChallenge(value: unknown): value is Readonly<{ message: string; challenge?: string }> {
  const keys = typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype ? Object.keys(value) : [];
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype &&
    (keys.length === 2 || (keys.length === 3 && typeof (value as { challenge?: unknown }).challenge === "string")) &&
    typeof (value as { message?: unknown }).message === "string" &&
    typeof (value as { expiresAt?: unknown }).expiresAt === "string"
  );
}

function isAuthenticated(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(value).length === 1 &&
    (value as { outcome?: unknown }).outcome === "authenticated"
  );
}

async function postJson(path: string, body: object): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isCurrentConnection(
  current: Tool402WalletConnection,
  expected: Tool402WalletConnection,
): boolean {
  return current.status === "connected"
    && current.generation === expected.generation
    && current.status === expected.status
    && current.account === expected.account
    && current.chainId === 296
    && current.chainId === expected.chainId
    && isTool402MetaMaskConnector(current.connector)
    && current.connector?.id === expected.connector?.id;
}

function MetaMaskSignInButton({
  connection,
  readCurrentConnection,
  tour,
  demoStep,
}: {
  readonly connection: Tool402WalletConnection;
  readonly readCurrentConnection: () => Tool402WalletConnection;
  readonly tour: "1" | null;
  readonly demoStep: string | null;
  readonly returnTo: string | null;
}) {
  const router = useRouter();
  const { mutateAsync: signMessage } = useSignMessage({ mutation: { retry: false } });
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const inProgress = useRef(false);
  const address = connection.account;

  async function signIn() {
    if (pending || inProgress.current) {
      return;
    }

    inProgress.current = true;
    setPending(true);
    setFailure(null);
    try {
      if (address === undefined || !isCurrentConnection(readCurrentConnection(), connection)) {
        throw new Error("wallet session changed");
      }

      const challenge = await postJson("/api/auth/metamask/challenge", { address });
      if (!isChallenge(challenge)) {
        throw new Error("challenge rejected");
      }

      const message = challenge.message;
      if (!isCurrentConnection(readCurrentConnection(), connection)) {
        throw new Error("wallet session changed");
      }
      const signature = await signMessage({ message });
      if (typeof signature !== "string") {
        throw new Error("signature rejected");
      }

      if (!isCurrentConnection(readCurrentConnection(), connection)) {
        throw new Error("wallet session changed");
      }

      const verification = await postJson("/api/auth/metamask/verify", {
        message,
        signature,
        challenge: challenge.challenge,
      });
      if (!isCurrentConnection(readCurrentConnection(), connection)) {
        throw new Error("wallet session changed");
      }
      if (!isAuthenticated(verification)) {
        throw new Error("verification rejected");
      }

      router.replace(returnTo ?? dashboardTourHref(tour, demoStep));
      router.refresh();
    } catch {
      setFailure(failureMessage);
    } finally {
      inProgress.current = false;
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Confirm the secure authentication message in MetaMask. It does not send funds or cost HBAR.
      </p>
      <Button disabled={pending} aria-disabled={pending} onClick={signIn}>
        {pending ? "Unlocking dashboard…" : "Sign and open dashboard"}
      </Button>
      {failure === null ? null : (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {failure}
        </p>
      )}
    </div>
  );
}

export function MetaMaskDashboardSignIn({ tour = null, demoStep = null, returnTo = null }: { tour?: "1" | null; demoStep?: string | null; returnTo?: string | null }) {
  const { connection, resolved, state, connect, connectErrorCode } = useTool402Wallet();
  const connectionRef = useRef(connection);
  connectionRef.current = connection;
  const canSignIn = resolved
    && connection.status === "connected"
    && connection.account !== undefined
    && connection.chainId === 296
    && isTool402MetaMaskConnector(connection.connector);

  return (
    <section aria-labelledby="metamask-dashboard-sign-in-title" className="space-y-3">
      <h2 id="metamask-dashboard-sign-in-title" className="text-lg font-semibold">Sign in with MetaMask</h2>
      {!canSignIn ? (
        <div className="space-y-2">
          <p aria-live="polite" className="text-sm text-muted-foreground">Connect MetaMask on Hedera Testnet, then sign to unlock the dashboard.</p>
          <Button
            disabled={state.kind === "resolving" || state.kind === "connecting"}
            aria-disabled={state.kind === "resolving" || state.kind === "connecting"}
            onClick={() => void connect()}
          >
            {state.kind === "request_failed" || state.kind === "no_provider" ? "Retry MetaMask connection" : "Connect MetaMask"}
          </Button>
          {state.kind === "request_failed" ? (
            <p aria-live="polite" className="text-sm text-muted-foreground">
              MetaMask rejected or could not complete the connection{connectErrorCode === null ? "." : ` (code ${connectErrorCode}).`}
            </p>
          ) : null}
        </div>
      ) : <MetaMaskSignInButton connection={connection} readCurrentConnection={() => connectionRef.current} tour={tour} demoStep={demoStep} returnTo={returnTo} />}
    </section>
  );
}
