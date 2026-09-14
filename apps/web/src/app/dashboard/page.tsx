import { DashboardCampaign } from "../../components/dashboard/dashboard-campaign";
import { DashboardIdentity } from "../../components/dashboard/dashboard-identity";
import { LandingFooter } from "../../components/landing/landing-footer";
import { PageHeader } from "../../components/ui/page-header";

export const instant = false;

export default function DashboardPage() {
  return (
    <>
      <main className="space-y-8 pb-10 sm:space-y-10 sm:pb-14">
        <PageHeader
          eyebrow="Dashboard"
          title="Your campaign"
          description="Review the current RiskScan campaign associated with your signed dashboard session."
        />
        <DashboardIdentity />
        <DashboardCampaign />
      </main>
      <LandingFooter />
    </>
  );
}
