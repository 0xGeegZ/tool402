import { LandingHero } from "../components/landing/landing-hero";
import { LandingFooter } from "../components/landing/landing-footer";
import { LandingSections } from "../components/landing/landing-sections";

export default function Home() {
  return (
    <main className="-mt-10">
      <LandingHero />
      <LandingSections />
      <LandingFooter />
    </main>
  );
}
