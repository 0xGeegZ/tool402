"use client";

import { useRef, useState } from "react";

import { readCurrentSession } from "../../lib/wallet/wallet-state.ts";
import { Button } from "../ui/button";
import { WalletIsland, type WalletSession } from "../wallet/wallet-connect";

const failureMessage = "Sign-in could not be completed. Please try again.";

function isChallenge(value: unknown): value is Readonly<{ message: string }> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(value).length === 2 &&
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

function MetaMaskSignInButton({ session }: { session: WalletSession }) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const inProgress = useRef(false);
  const { address, provider } = session;

  async function signIn() {
    if (pending || inProgress.current) {
      return;
    }

    inProgress.current = true;
    setPending(true);
    setFailure(null);
    try {
      const current = await readCurrentSession(provider);
      if (current.state.kind !== "connected" || current.state.address !== address) {
        throw new Error("wallet session changed");
      }

      const challenge = await postJson("/api/auth/metamask/challenge", { address });
      if (!isChallenge(challenge)) {
        throw new Error("challenge rejected");
      }

      const message = challenge.message;
      const signature = await provider.request({
        method: "personal_sign",
        params: [message, address],
      });
      if (typeof signature !== "string") {
        throw new Error("signature rejected");
      }

      const verification = await postJson("/api/auth/metamask/verify", {
        message,
        signature,
      });
      if (!isAuthenticated(verification)) {
        throw new Error("verification rejected");
      }

      window.location.assign("/dashboard");
    } catch {
      setFailure(failureMessage);
    } finally {
      inProgress.current = false;
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button disabled={pending} aria-disabled={pending} onClick={signIn}>
        {pending ? "Signing in…" : "Sign in with MetaMask"}
      </Button>
      {failure === null ? null : (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {failure}
        </p>
      )}
    </div>
  );
}

export function MetaMaskDashboardSignIn() {
  return (
    <WalletIsland heading="Sign in with MetaMask">
      {(session) => <MetaMaskSignInButton session={session} />}
    </WalletIsland>
  );
}
