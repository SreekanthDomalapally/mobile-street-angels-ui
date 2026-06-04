import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/sections/hero";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { FeaturesSection } from "@/components/sections/features";
import { MissionSection } from "@/components/sections/mission";
import { DownloadSection } from "@/components/sections/download";
import { DonateSection } from "@/components/sections/donate";
import { FaqSection } from "@/components/sections/faq";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <MissionSection />
        <DownloadSection />
        <DonateSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
