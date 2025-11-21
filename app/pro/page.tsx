import { getUser } from "@/lib/utils/auth.server";
import type { Metadata } from "next";
import { HeroSectionPro } from "@/components/features/landing-pro/hero-section-pro";
import { CoachingShowcase } from "@/components/features/landing-pro/coaching-showcase";
import { ProblemSolution } from "@/components/features/landing-pro/problem-solution";
import { SmartRestTimer } from "@/components/features/landing/smart-rest-timer";
import { NotesIntelligence } from "@/components/features/landing/notes-intelligence";
import { VolumeTrackingVisual } from "@/components/features/landing/volume-tracking-visual";
import { RadarChartSection } from "@/components/features/landing/RadarChartSection";
import { CheckRoomSection } from "@/components/features/landing/CheckRoomSection";
import { BiomechanicsDemo } from "@/components/features/landing/biomechanics-demo";
import { GymReadyFeatures } from "@/components/features/landing/gym-ready-features";
import { AICoachingFeatures } from "@/components/features/landing/ai-coaching-features";
import { EquipmentVision } from "@/components/features/landing/equipment-vision";
import { MethodologiesSection } from "@/components/features/landing/methodologies-section";
import { ComparisonTable } from "@/components/features/landing/comparison-table";
import { FAQSection } from "@/components/features/landing/faq-section";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";

export const metadata: Metadata = {
  title: "Arvo Pro - Advanced AI Coaching for IFBB PRO Athletes",
  description: "Methodology-aware AI coaching for elite bodybuilders. Train with Kuba Cielen's system, Mike Mentzer's HIT, FST-7, and more. Context-aware volume tracking (MEV/MAV/MRV), set-by-set guidance, and cycle-to-cycle learning for serious athletes.",
  keywords: [
    'IFBB PRO bodybuilding',
    'advanced workout tracker',
    'Kuba Cielen training',
    'Mike Mentzer HIT',
    'FST-7 training',
    'volume tracking MEV MAV MRV',
    'RIR RPE tracking',
    'AI bodybuilding coach',
    'methodology-aware training',
    'elite bodybuilding app',
    'professional bodybuilding tracker',
    'context-aware volume',
    'set-by-set coaching',
    'biomechanics training',
    'exercise substitution AI',
    'equipment vision AI',
  ],

  // OpenGraph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru/pro',
    title: 'Arvo Pro - Advanced AI Coaching for IFBB PRO Athletes',
    description: 'Methodology-aware AI coaching for elite bodybuilders. Train with Kuba, Mentzer, FST-7 methodologies. Context-aware volume tracking and set-by-set guidance.',
    siteName: 'Arvo',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Arvo Pro - Advanced AI Coaching for IFBB PRO Athletes',
    description: 'Methodology-aware AI coaching for elite bodybuilders. Train with Kuba, Mentzer, FST-7 methodologies.',
  },

  // Canonical URL
  alternates: {
    canonical: 'https://arvo.guru/pro',
  },
};

export default async function ProPage() {
  const user = await getUser();
  const isAuthenticated = !!user;

  // Check if waitlist mode is enabled via env variable
  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  return (
    <main className="min-h-screen">
      <HeroSectionPro isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <ProblemSolution />
      <CoachingShowcase />
      <SmartRestTimer />
      <NotesIntelligence />
      <VolumeTrackingVisual />
      <RadarChartSection variant="pro" />
      <CheckRoomSection variant="pro" />
      <BiomechanicsDemo />
      <GymReadyFeatures />
      <AICoachingFeatures />
      <EquipmentVision />
      <MethodologiesSection />
      <ComparisonTable />
      <FAQSection variant="pro" />
      <CTASection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <Footer />
    </main>
  );
}
