import { getUser } from "@/lib/utils/auth.server";
import { HeroSection } from "@/components/features/landing/hero-section";
import { AIShowcase } from "@/components/features/landing/ai-showcase";
import { NotesIntelligence } from "@/components/features/landing/notes-intelligence";
import { VolumeTrackingVisual } from "@/components/features/landing/volume-tracking-visual";
import { BiomechanicsDemo } from "@/components/features/landing/biomechanics-demo";
import { GymReadyFeatures } from "@/components/features/landing/gym-ready-features";
import { MethodologiesSection } from "@/components/features/landing/methodologies-section";
import { ComparisonTable } from "@/components/features/landing/comparison-table";
import { FAQSection } from "@/components/features/landing/faq-section";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";

export default async function Home() {
  const user = await getUser();
  const isAuthenticated = !!user;

  return (
    <main className="min-h-screen">
      <HeroSection isAuthenticated={isAuthenticated} />
      <AIShowcase />
      <NotesIntelligence />
      <VolumeTrackingVisual />
      <BiomechanicsDemo />
      <GymReadyFeatures />
      <MethodologiesSection />
      <ComparisonTable />
      <FAQSection />
      <CTASection isAuthenticated={isAuthenticated} />
      <Footer />
    </main>
  );
}
