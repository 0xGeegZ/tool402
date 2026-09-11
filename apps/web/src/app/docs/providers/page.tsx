import { ProviderRiskScanGuide } from "../../../components/docs/provider-riskscan-guide";
import { LandingFooter } from "../../../components/landing/landing-footer";

export default function ProviderDocumentationPage() {
  return (
    <>
      <main className="pb-8 sm:pb-14">
        <ProviderRiskScanGuide />
      </main>
      <LandingFooter />
    </>
  );
}
