import { cookies } from "next/headers";

import { readDashboardSession, readDashboardSessionCookieName } from "../../lib/dashboard-auth/dashboard-auth";
import { readHumanVerification, readWorldConfigured, WORLD_HUMAN_COOKIE } from "../../lib/world/human-check";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { WorldHumanCheck } from "./world-human-check";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type IdentityState = "unverified" | "verified" | "unavailable";

const worldTileClassNames: Record<IdentityState, string> = {
  unverified: "bg-secondary text-primary",
  verified: "bg-success text-success-foreground",
  unavailable: "bg-secondary text-primary",
};

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatCheckDate(milliseconds: number): string {
  const date = new Date(milliseconds);
  return `${date.getUTCDate()} ${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export async function DashboardIdentity() {
  const sessionCookieName = readDashboardSessionCookieName(process.env);
  const cookieStore = await cookies();
  const session = await readDashboardSession(
    sessionCookieName === null ? null : cookieStore.get(sessionCookieName)?.value ?? null,
    process.env,
  );
  if (session === null) return null;

  const configured = readWorldConfigured(process.env);
  const human = configured
    ? await readHumanVerification(cookieStore.get(WORLD_HUMAN_COOKIE)?.value ?? null, session.address, process.env)
    : null;
  const state: IdentityState = configured ? (human === null ? "unverified" : "verified") : "unavailable";
  const shortAddress = shortenAddress(session.address);
  const passedOn = human === null ? "" : formatCheckDate(human.verifiedAt);

  return (
    <section aria-label="Your identity">
      <Card className="rounded-card border-border bg-card shadow-none">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Your identity</p>
            <h2 className="text-xl font-bold tracking-[-0.035em] text-foreground">Signed in as {shortAddress}</h2>
            <p className="text-sm leading-6 text-muted-foreground">MetaMask proves control of the account on Hedera Testnet. World proves a human holds it.</p>
          </div>

          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-tile bg-secondary text-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5Z" />
                <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h12" />
                <circle cx="16.5" cy="12.5" r="1.2" />
              </svg>
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">MetaMask</p>
                <Badge className="bg-success text-success-foreground">Signed in</Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">Hedera Testnet (0x128) · session valid for 8 hours</p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-border pt-4">
            <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-tile ${worldTileClassNames[state]}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3.6 9h16.8M3.6 15h16.8" />
                <path d="M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9s1.2-6.4 3.6-9Z" />
              </svg>
            </span>
            <div className="w-full space-y-2">
              {state === "unverified" ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">World</p>
                    <Badge variant="outline">Not verified</Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">Prove a human holds this account with a Selfie Check in the World App. It confirms a live person, not your identity, and it is not KYC.</p>
                  <WorldHumanCheck address={session.address} />
                </>
              ) : state === "verified" ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">World</p>
                    <Badge className="bg-success text-success-foreground">
                      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="m5 13 4 4 10-10" />
                      </svg>
                      Verified human
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">Selfie Check passed in the World App on {passedOn}. It stays on this browser for 30 days and is bound to {shortAddress}.</p>
                  <p className="text-right text-xs text-muted-foreground">Not identity · not KYC</p>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">World</p>
                    <Badge variant="outline">Unavailable</Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">World verification is not configured on this host. Nothing was requested.</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
