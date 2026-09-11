import { DocumentationHome } from "../../components/docs/documentation-home";
import { LandingFooter } from "../../components/landing/landing-footer";

export default function DocumentationPage() {
  return (
    <>
      <main className="pb-8 sm:pb-14">
        <DocumentationHome />
      </main>
      <LandingFooter />
    </>
  );
}
