import type { Metadata } from "next";
import { PublicNavbar } from "@/components/features/landing/public-navbar";
import { HeroFeatures } from "@/components/features/features-page/hero-features";
import { AgentArchitecture } from "@/components/features/features-page/agent-architecture";
import { SetBySetSection } from "@/components/features/features-page/set-by-set-section";
import { MethodologiesDetailed } from "@/components/features/features-page/methodologies-detailed";
import { VolumeTrackingSection } from "@/components/features/features-page/volume-tracking-section";
import { AdvancedTechniquesDetailed } from "@/components/features/features-page/advanced-techniques-detailed";
import { PlateauDetectionSection } from "@/components/features/features-page/plateau-detection-section";
import { CompetitorComparison } from "@/components/features/features-page/competitor-comparison";
import { TechnicalSpecs } from "@/components/features/features-page/technical-specs";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";
import { getUser } from "@/lib/utils/auth.server";

export const metadata: Metadata = {
  title: "How Arvo Works - 19 AI Agents, Set-by-Set Progression, Advanced Methodologies",
  description: "Discover how Arvo's 19 specialized AI agents deliver real-time set-by-set progression. Support for Kuba Method, Mentzer HIT, FST-7, Y3T. MEV/MAV/MRV volume tracking. Compare Arvo vs Fitbod, Freeletics, Strong.",
  keywords: [
    'AI personal trainer features',
    'workout app with AI agents',
    'set-by-set progression app',
    'Arvo vs Fitbod',
    'Arvo vs Freeletics',
    'Arvo vs Strong',
    'Arvo vs Hevy',
    'MEV MAV MRV tracking app',
    'Kuba method app',
    'Mentzer HIT app',
    'FST-7 workout app',
    'RIR RPE workout tracker',
    'AI workout coach features',
    'multi-agent workout AI',
  ],

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru/features',
    title: 'How Arvo Works - 19 AI Agents for Intelligent Training',
    description: 'Discover how Arvo\'s 19 specialized AI agents deliver real-time set-by-set progression. Kuba, Mentzer, FST-7 methodologies. Compare vs Fitbod, Freeletics.',
    siteName: 'Arvo',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'How Arvo Works - 19 AI Agents for Intelligent Training',
    description: 'Discover how Arvo\'s 19 specialized AI agents deliver real-time set-by-set progression.',
  },

  alternates: {
    canonical: 'https://arvo.guru/features',
  },
};

export default async function FeaturesPage() {
  const user = await getUser();
  const isAuthenticated = !!user;
  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  return (
    <main className="min-h-screen">
      <PublicNavbar isAuthenticated={isAuthenticated} />
      <HeroFeatures />
      <AgentArchitecture />
      <SetBySetSection />
      <MethodologiesDetailed />
      <VolumeTrackingSection />
      <AdvancedTechniquesDetailed />
      <PlateauDetectionSection />
      <CompetitorComparison />
      <TechnicalSpecs />
      <CTASection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <Footer />
    </main>
  );
}
