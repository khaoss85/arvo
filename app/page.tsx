import { getUser } from "@/lib/utils/auth.server";
import { HeroSection } from "@/components/features/landing/hero-section";
import { AIShowcase } from "@/components/features/landing/ai-showcase";
import { SmartRestTimer } from "@/components/features/landing/smart-rest-timer";
import { NotesIntelligence } from "@/components/features/landing/notes-intelligence";
import { VolumeTrackingVisual } from "@/components/features/landing/volume-tracking-visual";
import { CheckRoomSection } from "@/components/features/landing/CheckRoomSection";
import { RadarChartSection } from "@/components/features/landing/RadarChartSection";
import { BiomechanicsDemo } from "@/components/features/landing/biomechanics-demo";
import { GymReadyFeatures } from "@/components/features/landing/gym-ready-features";
import { AICoachingFeatures } from "@/components/features/landing/ai-coaching-features";
import { EquipmentVision } from "@/components/features/landing/equipment-vision";
import { MethodologiesSection } from "@/components/features/landing/methodologies-section";
import { ComparisonTable } from "@/components/features/landing/comparison-table";
import { FAQSection } from "@/components/features/landing/faq-section";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";

export default async function Home() {
  const user = await getUser();
  const isAuthenticated = !!user;

  // Check if waitlist mode is enabled via env variable
  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  return (
    <main className="min-h-screen">
      <HeroSection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <AIShowcase />
      <SmartRestTimer />
      <NotesIntelligence />
      <VolumeTrackingVisual />
      <CheckRoomSection variant="default" />
      <RadarChartSection variant="default" />
      <BiomechanicsDemo />
      <GymReadyFeatures />
      <AICoachingFeatures />
      <EquipmentVision />
      <MethodologiesSection />
      <ComparisonTable />
      <FAQSection />
      <CTASection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <Footer />
    </main>
  );
}
