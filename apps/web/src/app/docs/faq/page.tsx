import { DocumentationFaq } from "../../../components/docs/documentation-faq";
import { LandingFooter } from "../../../components/landing/landing-footer";

export default function FaqDocumentationPage() {
  return (
    <>
      <main className="pb-8 sm:pb-14">
        <DocumentationFaq />
      </main>
      <LandingFooter />
    </>
  );
}
