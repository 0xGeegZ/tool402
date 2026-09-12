import { LandingFooter } from "../../../components/landing/landing-footer";
import { ProviderDeployWizard } from "../../../components/provider/deploy/provider-deploy-wizard";
import { parseProviderToolId } from "@tool402/core";

export default async function ProviderDeployPage({ searchParams }: { searchParams: Promise<{ tool?: string }> }) {
  const selectedToolPublicId = parseProviderToolId((await searchParams).tool) ?? undefined;
  return (
    <>
      <ProviderDeployWizard selectedToolPublicId={selectedToolPublicId} />
      <LandingFooter />
    </>
  );
}
