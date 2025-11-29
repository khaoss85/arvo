import type { Metadata } from "next";
import { PublicNavbar } from "@/components/features/landing/public-navbar";
import { PricingHero } from "@/components/features/pricing/pricing-hero";
import { PricingTiers } from "@/components/features/pricing/pricing-tiers";
import { TrainingModes } from "@/components/features/pricing/training-modes";
import { MethodologyList } from "@/components/features/pricing/methodology-list";
import { PricingFAQ } from "@/components/features/pricing/pricing-faq";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";
import { getUser } from "@/lib/utils/auth.server";

export const metadata: Metadata = {
  title: "Pricing - Arvo AI Personal Trainer | €6/month",
  description: "Arvo pricing: Free during beta, then €6/month. 19 AI agents, set-by-set progression, Kuba & Mentzer methods. Compare: Fitbod $16, JuggernautAI $35.",
  keywords: [
    'AI personal trainer price',
    'workout app cost',
    'Arvo pricing',
    'AI fitness app subscription',
    'bodybuilding app price',
    'cheap AI workout coach',
    'Arvo vs Fitbod price',
    'gym app monthly cost',
  ],

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru/pricing',
    title: 'Arvo Pricing - €6/month for AI Personal Training',
    description: 'Free during beta. Then €6/month for 19 AI agents, set-by-set progression, and advanced methodologies like Kuba & Mentzer.',
    siteName: 'Arvo',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Arvo Pricing - €6/month for AI Personal Training',
    description: 'Free during beta. 19 AI agents. Set-by-set progression. Advanced methodologies.',
  },

  alternates: {
    canonical: 'https://arvo.guru/pricing',
  },
};

export default async function PricingPage() {
  const user = await getUser();
  const isAuthenticated = !!user;
  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  return (
    <main className="min-h-screen">
      <PublicNavbar isAuthenticated={isAuthenticated} />
      <PricingHero />
      <PricingTiers isAuthenticated={isAuthenticated} />
      <TrainingModes />
      <MethodologyList />
      <PricingFAQ />
      <CTASection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <Footer />
    </main>
  );
}
