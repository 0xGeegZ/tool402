"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { readCurrentSession } from "../../lib/wallet/wallet-state.ts";
import { Button } from "../ui/button";
import { connectedWalletSession, useWalletSession, type WalletSession } from "../wallet/wallet-session";

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

function MetaMaskSignInButton({ session }: { session: WalletSession }) {
  const router = useRouter();
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
        challenge: challenge.challenge,
      });
      if (!isAuthenticated(verification)) {
        throw new Error("verification rejected");
      }

      router.replace("/dashboard");
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

export function MetaMaskDashboardSignIn() {
  const wallet = useWalletSession();
  const session: WalletSession | null = connectedWalletSession(wallet);

  return (
    <section aria-labelledby="metamask-dashboard-sign-in-title" className="space-y-3">
      <h2 id="metamask-dashboard-sign-in-title" className="text-lg font-semibold">Sign in with MetaMask</h2>
      {session === null ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">Connect MetaMask from the header on Hedera Testnet, then sign to unlock the dashboard.</p>
      ) : <MetaMaskSignInButton session={session} />}
    </section>
  );
}
