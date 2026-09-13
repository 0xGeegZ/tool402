import { LandingFooter } from "../../../components/landing/landing-footer";
import { ProviderDeployWizard } from "../../../components/provider/deploy/provider-deploy-wizard";
import { parseProviderToolId } from "@tool402/core";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type ProviderDeployPageProps = {
  readonly searchParams: Promise<{ tool?: string }>;
};

export default function ProviderDeployPage({ searchParams }: ProviderDeployPageProps) {
  return (
    <Suspense fallback={null}>
      <ProviderDeployBoundary searchParams={searchParams} />
    </Suspense>
  );
}

async function ProviderDeployBoundary({ searchParams }: ProviderDeployPageProps) {
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
