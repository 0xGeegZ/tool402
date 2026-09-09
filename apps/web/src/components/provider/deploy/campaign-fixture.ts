import type { ProviderDeployCategory } from "./provider-deploy-state";

export type CampaignFixture = Readonly<{
  label: "PREPARED / DEMO DATA";
  toolName: string;
  category: ProviderDeployCategory;
  oneLiner: string;
  customerProblem: string;
  qualifyingResource: string;
  capability: string;
  capabilitySummary: string;
  quickPrice: string;
  standardPrice: string;
  targetAgentCustomers: readonly string[];
  useOfFunds: readonly string[];
  risks: readonly string[];
}>;

export const campaignFixture: CampaignFixture = Object.freeze({
  label: "PREPARED / DEMO DATA",
  toolName: "RiskScan",
  category: "security",
  oneLiner: "Explainable local risk assessment for tool requests.",
  customerProblem: "Tool operators need a bounded way to assess request risk before they continue a workflow.",
  qualifyingResource: "riskscan-local-assessment",
  capability: "evm-contract-risk-signals",
  capabilitySummary: "Produces a local, explainable assessment from provider-supplied request context.",
  quickPrice: "0.1",
  standardPrice: "0.1",
  targetAgentCustomers: Object.freeze(["Security-oriented agent operators"]),
  useOfFunds: Object.freeze(["Maintain the local assessment workflow and provider documentation."]),
  risks: Object.freeze(["Testnet terms do not promise yield, principal, or return."]),
});
