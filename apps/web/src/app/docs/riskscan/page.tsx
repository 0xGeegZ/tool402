import { RiskScanGuide } from "../../../components/docs/riskscan-guide";
import { LandingFooter } from "../../../components/landing/landing-footer";

export default function RiskScanDocumentationPage() {
  return (
    <>
      <main className="pb-8 sm:pb-14">
        <RiskScanGuide />
      </main>
      <LandingFooter />
    </>
  );
}
