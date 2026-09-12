import { LandingFooter } from "../../../components/landing/landing-footer";
import { ProviderDeployWizard } from "../../../components/provider/deploy/provider-deploy-wizard";
import { parseProviderToolId } from "@tool402/core";
import { notFound } from "next/navigation";

export default async function ProviderDeployPage({ searchParams }: { searchParams: Promise<{ tool?: string }> }) {
  const tool = (await searchParams).tool;
  const parsedToolPublicId = tool === undefined ? undefined : parseProviderToolId(tool);
  if (parsedToolPublicId === null) notFound();
  const selectedToolPublicId = parsedToolPublicId;
  return (
    <>
      <ProviderDeployWizard selectedToolPublicId={selectedToolPublicId} />
      <LandingFooter />
    </>
  );
}
