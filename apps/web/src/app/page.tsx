import { LandingHero } from "../components/landing/landing-hero";
import { LandingFooter } from "../components/landing/landing-footer";
import { LandingSections } from "../components/landing/landing-sections";

export default function Home() {
  return (
    <main className="space-y-16 pb-8 sm:space-y-24 sm:pb-12">
      <LandingHero />
      <LandingSections />
      <LandingFooter />
    </main>
  );
}
