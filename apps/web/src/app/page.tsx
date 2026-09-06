import { LandingHero } from "../components/landing/landing-hero";
import { LandingFooter } from "../components/landing/landing-footer";
import { LandingSections } from "../components/landing/landing-sections";

export default function Home() {
  return (
    <main className="space-y-16 py-6 sm:space-y-24 sm:py-12">
      <LandingHero />
      <LandingSections />
      <LandingFooter />
    </main>
  );
}
