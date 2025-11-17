import { getUser } from "@/lib/utils/auth.server";
import { HeroSectionPro } from "@/components/features/landing-pro/hero-section-pro";
import { CoachingShowcase } from "@/components/features/landing-pro/coaching-showcase";
import { ProblemSolution } from "@/components/features/landing-pro/problem-solution";
import { SmartRestTimer } from "@/components/features/landing/smart-rest-timer";
import { NotesIntelligence } from "@/components/features/landing/notes-intelligence";
import { VolumeTrackingVisual } from "@/components/features/landing/volume-tracking-visual";
import { BiomechanicsDemo } from "@/components/features/landing/biomechanics-demo";
import { GymReadyFeatures } from "@/components/features/landing/gym-ready-features";
import { AICoachingFeatures } from "@/components/features/landing/ai-coaching-features";
import { EquipmentVision } from "@/components/features/landing/equipment-vision";
import { MethodologiesSection } from "@/components/features/landing/methodologies-section";
import { ComparisonTable } from "@/components/features/landing/comparison-table";
import { FAQSection } from "@/components/features/landing/faq-section";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";

export default async function ProPage() {
  const user = await getUser();
  const isAuthenticated = !!user;

  return (
    <main className="min-h-screen">
      <HeroSectionPro isAuthenticated={isAuthenticated} />
      <ProblemSolution />
      <CoachingShowcase />
      <SmartRestTimer />
      <NotesIntelligence />
      <VolumeTrackingVisual />
      <BiomechanicsDemo />
      <GymReadyFeatures />
      <AICoachingFeatures />
      <EquipmentVision />
      <MethodologiesSection />
      <ComparisonTable />
      <FAQSection variant="pro" />
      <CTASection isAuthenticated={isAuthenticated} />
      <Footer />
    </main>
  );
}
