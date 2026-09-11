import { ApiReference } from "../../../components/docs/api-reference";
import { LandingFooter } from "../../../components/landing/landing-footer";

export default function ApiDocumentationPage() {
  return (
    <>
      <main className="pb-8 sm:pb-14">
        <ApiReference />
      </main>
      <LandingFooter />
    </>
  );
}
