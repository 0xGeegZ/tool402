"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  discoverMetaMaskProvider,
  watchWalletSessionChanges,
  type Eip1193Provider,
} from "../../lib/wallet/metamask-provider";
import { readCurrentSession } from "../../lib/wallet/wallet-state";

export function DashboardSessionSync({ address }: { readonly address: string }) {
  const router = useRouter();
  const logoutStarted = useRef(false);

  useEffect(() => {
    let active = true;
    let stopWatching = () => {};

    const logout = () => {
      if (!active || logoutStarted.current) return;
      logoutStarted.current = true;
      void fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      }).then((response) => {
        if (!active || response.status !== 204) return;
        router.replace("/sign-in");
        router.refresh();
      }).catch(() => undefined);
    };

    const settle = async (provider: Eip1193Provider) => {
      const { state } = await readCurrentSession(provider);
      if (!active) return;
      if (state.kind === "connected" && state.address === address) return;
      logout();
    };

    void discoverMetaMaskProvider(window).then((selection) => {
      if (!active) return;
      if (selection.kind !== "provider") {
        logout();
        return;
      }
      stopWatching = watchWalletSessionChanges(selection.provider, () => {
        void settle(selection.provider);
      });
      void settle(selection.provider);
    }).catch(() => logout());

    return () => {
      active = false;
      stopWatching();
    };
  }, [address, router]);

  return null;
}
