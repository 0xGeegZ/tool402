import { LandingHero } from "../components/landing/landing-hero";
import { LandingFooter } from "../components/landing/landing-footer";
import { LandingSections } from "../components/landing/landing-sections";

export default function Home() {
  return (
    <main className="space-y-20 pb-12 sm:space-y-28 sm:pb-16">
      <LandingHero />
      <LandingSections />
      <LandingFooter />
    </main>
  );
}
