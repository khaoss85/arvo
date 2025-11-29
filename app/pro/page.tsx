import { getUser } from "@/lib/utils/auth.server";
import type { Metadata } from "next";
import { PublicNavbar } from "@/components/features/landing/public-navbar";
import { HeroSectionPro } from "@/components/features/landing-pro/hero-section-pro";
import { WhoIsArvoFor } from "@/components/features/landing/who-is-arvo-for";
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
  title: "Arvo Pro - AI Workout Coach for Bodybuilding",
  description: "AI workout coach for bodybuilding. AI personal trainer for intermediate and advanced lifters. Train with Kuba Method, Mentzer HIT, FST-7. MEV/MAV/MRV volume tracking, set-by-set AI coaching for serious athletes.",
  keywords: [
    'AI workout coach for bodybuilding',
    'AI personal trainer for advanced lifters',
    'AI bodybuilding program',
    'AI coach for intermediate lifters',
    'IFBB PRO bodybuilding',
    'advanced workout tracker',
    'Kuba Cielen training',
    'Kuba method app',
    'Mike Mentzer HIT',
    'Mentzer HIT training app',
    'FST-7 training',
    'FST-7 workout app',
    'volume tracking MEV MAV MRV',
    'RIR RPE tracking',
    'AI bodybuilding coach',
    'methodology-aware training',
    'elite bodybuilding app',
    'professional bodybuilding tracker',
    'set-by-set coaching',
    'AI gym trainer',
  ],

  // OpenGraph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru/pro',
    title: 'Arvo Pro - AI Workout Coach for Bodybuilding',
    description: 'AI workout coach for bodybuilding. AI personal trainer for intermediate and advanced lifters. Kuba Method, Mentzer HIT, FST-7 with set-by-set AI coaching.',
    siteName: 'Arvo',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Arvo Pro - AI Workout Coach for Bodybuilding',
    description: 'AI workout coach for bodybuilding. AI personal trainer for intermediate and advanced lifters. Kuba, Mentzer, FST-7 methodologies.',
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
      <PublicNavbar isAuthenticated={isAuthenticated} />
      <HeroSectionPro isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <WhoIsArvoFor variant="pro" />
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
