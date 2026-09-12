import Link from "next/link";

import { BackingFlow } from "../../../../components/backing/backing-flow";

export default function RiskScanBackPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <Link href="/explore/riskscan" className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            Back to RiskScan
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Back RiskScan</h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Request note units and fund them from MetaMask on Hedera Testnet. The issuer allocates units separately.
          </p>
        </header>
        <BackingFlow projection={null} />
      </article>
    </main>
  );
}
