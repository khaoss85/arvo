import { getUser } from "@/lib/utils/auth.server";
import type { Metadata } from "next";
import { HeroSectionSimple } from "@/components/features/landing-simple/hero-section-simple";
import { SimpleShowcase } from "@/components/features/landing-simple/simple-showcase";
import { AutoProgression } from "@/components/features/landing-simple/auto-progression";
import { SimpleResults } from "@/components/features/landing-simple/simple-results";
import { SmartRestTimer } from "@/components/features/landing/smart-rest-timer";
import { NotesIntelligence } from "@/components/features/landing/notes-intelligence";
import { MethodologiesSection } from "@/components/features/landing/methodologies-section";
import { FAQSection } from "@/components/features/landing/faq-section";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";

export const metadata: Metadata = {
  title: "Arvo - L'app che pensa per te",
  description: "Niente da studiare. Niente da decidere. Solo risultati. 3 minuti per iniziare, zero complicazioni.",
};

export default async function SimplePage() {
  const user = await getUser();
  const isAuthenticated = !!user;

  return (
    <main className="min-h-screen">
      <HeroSectionSimple isAuthenticated={isAuthenticated} />
      <SimpleShowcase />
      <AutoProgression />
      <SmartRestTimer />
      <NotesIntelligence />
      <SimpleResults />
      <MethodologiesSection />
      <FAQSection />
      <CTASection isAuthenticated={isAuthenticated} />
      <Footer />
    </main>
  );
}
