import { Geist, Geist_Mono } from "next/font/google";

import { DeployRedesignWizard } from "../../../components/design/deploy-redesign-wizard";

const redesignSans = Geist({ subsets: ["latin"], variable: "--font-redesign-sans" });
const redesignMono = Geist_Mono({ subsets: ["latin"], variable: "--font-redesign-mono" });

export default function DeployRedesignProposalPage() {
  return (
    <div className={`${redesignSans.variable} ${redesignMono.variable}`} style={{ fontFamily: "var(--font-redesign-sans)" }}>
      <div className="mb-8 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
        Design proposal · not wired to any deployment logic. Preview only, isolated from the live &quot;Prepare a tool&quot;
        flow at <code className="font-[family-name:var(--font-redesign-mono)] text-[12px]">/provider/deploy</code>.
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
          Prepared / demo data fixture
        </span>
        <span className="rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
          Hedera testnet · chain 296
        </span>
        <span className="rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
          Terms v1 · fixed
        </span>
      </div>

      <h1 className="text-balance text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
        Deploy the RiskScan campaign
      </h1>
      <p className="mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed text-neutral-500">
        Review every field of the prepared offering, then authorize each step with your issuer wallet. Nothing is created,
        funded, or published until the named signature and receipt exist.
      </p>

      <div className="mt-10">
        <DeployRedesignWizard />
      </div>
    </div>
  );
}
