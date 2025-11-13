import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Arvo",
  description: "Terms of Service for Arvo - AI-powered workout programming",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: November 12, 2024
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using Arvo ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
            </p>
            <p className="mb-4">
              Arvo is operated by aetha.inc. These terms apply to all users of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Arvo is an AI-powered workout programming application that provides:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Personalized workout generation using artificial intelligence</li>
              <li>Exercise selection and progression recommendations</li>
              <li>Workout tracking and performance analytics</li>
              <li>Training methodology implementation (e.g., Kuba Method, Mentzer HIT)</li>
              <li>Insight extraction from workout notes</li>
              <li>Exercise substitution suggestions</li>
            </ul>
            <p className="mb-4 font-semibold text-orange-600 dark:text-orange-400">
              IMPORTANT: The Service is for informational and educational purposes only. It is NOT medical advice, physical therapy, or professional coaching.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Medical Disclaimer</h2>
            <p className="mb-4 font-semibold">
              Arvo does not provide medical advice. Always consult with a qualified healthcare professional before starting any exercise program.
            </p>
            <p className="mb-4">
              The AI-generated recommendations are based on general fitness principles and your input data. They cannot:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Replace professional medical advice, diagnosis, or treatment</li>
              <li>Assess your specific health conditions or risk factors</li>
              <li>Detect or prevent injuries</li>
              <li>Account for undisclosed medical conditions</li>
            </ul>
            <p className="mb-4">
              You should consult a healthcare professional if you experience:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Persistent pain, discomfort, or unusual symptoms</li>
              <li>Cardiovascular concerns (chest pain, dizziness, shortness of breath)</li>
              <li>Joint or muscle injuries</li>
              <li>Any doubt about your ability to safely perform an exercise</li>
            </ul>
            <p className="mb-4">
              For complete medical disclaimer, see <Link href="/medical-disclaimer" className="text-primary-600 dark:text-primary-400 hover:underline">/medical-disclaimer</Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Assumption of Risk</h2>
            <p className="mb-4">
              Physical exercise involves inherent risks, including but not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Muscle strains, sprains, and tears</li>
              <li>Joint injuries</li>
              <li>Cardiovascular events</li>
              <li>Equipment-related injuries</li>
              <li>Accidents resulting in serious injury or death</li>
            </ul>
            <p className="mb-4 font-semibold">
              BY USING THIS SERVICE, YOU VOLUNTARILY ASSUME ALL RISKS associated with exercise and physical training. You acknowledge that you are solely responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Determining whether you are fit enough to perform suggested exercises</li>
              <li>Using proper form and technique</li>
              <li>Selecting appropriate weights and intensity</li>
              <li>Exercising in a safe environment</li>
              <li>Stopping exercise if you feel pain, discomfort, or unusual symptoms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. AI-Generated Content Limitations</h2>
            <p className="mb-4">
              Arvo uses artificial intelligence (AI) models to generate workout recommendations. You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>AI recommendations are algorithmic outputs, not expert human judgment</li>
              <li>AI may make errors, suggest inappropriate exercises, or miscalculate loads</li>
              <li>AI cannot fully understand context, nuance, or individual circumstances</li>
              <li>AI recommendations should be critically evaluated before implementation</li>
              <li>You are responsible for validating AI suggestions against your own knowledge and judgment</li>
            </ul>
            <p className="mb-4">
              We continuously improve our AI systems, but we cannot guarantee accuracy, completeness, or suitability of AI-generated content for your specific needs.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. User Responsibilities</h2>
            <p className="mb-4">You agree to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Provide accurate and complete information about your fitness level, limitations, and health status</li>
              <li>Update your profile if your circumstances change (e.g., new injury, illness)</li>
              <li>Use the Service in accordance with these Terms</li>
              <li>Not misuse or attempt to manipulate the AI systems</li>
              <li>Not share your account credentials with others</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Privacy and Data Collection</h2>
            <p className="mb-4">
              Your privacy is important to us. By using Arvo, you agree to our collection and use of your data as described in our <Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</Link>.
            </p>
            <p className="mb-4">
              We collect health-related data including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Physical measurements (weight, height, age)</li>
              <li>Workout performance data (sets, reps, weights, RIR)</li>
              <li>Pain and injury reports</li>
              <li>Workout notes and feedback</li>
              <li>Exercise preferences and patterns</li>
            </ul>
            <p className="mb-4">
              This data is used to personalize your experience and improve AI recommendations. We do not sell your personal data to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="mb-4 font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AETHA.INC AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Injuries, illnesses, or deaths resulting from use of the Service</li>
              <li>Indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Damages arising from AI errors, inaccuracies, or omissions</li>
              <li>Damages arising from reliance on Service content</li>
            </ul>
            <p className="mb-4">
              Our total liability to you for any claims arising from use of the Service shall not exceed the amount you paid for the Service in the 12 months preceding the claim, or €100, whichever is less.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless aetha.inc, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Any injuries or damages resulting from your exercise activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Age Restrictions</h2>
            <p className="mb-4">
              You must be at least 14 years old to use Arvo. Users under 18 should use the Service under parental supervision and with parental consent.
            </p>
            <p className="mb-4">
              If you are under 18, your parent or legal guardian must review and accept these Terms on your behalf.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Intellectual Property</h2>
            <p className="mb-4">
              All content, features, and functionality of the Service (including but not limited to text, graphics, logos, AI algorithms, and software) are owned by aetha.inc and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mb-4">
              You may not copy, modify, distribute, sell, or reverse-engineer any part of the Service without our explicit written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Training Methodology Attribution</h2>
            <p className="mb-4">
              Arvo implements training methodologies including the "Kuba Method" developed by Kuba Walczak. These methodologies are used with permission or under applicable licensing agreements.
            </p>
            <p className="mb-4">
              Users acknowledge that these methodologies are educational implementations and may differ from direct coaching by the original authors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Service Modifications and Termination</h2>
            <p className="mb-4">
              We reserve the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Modify or discontinue the Service at any time</li>
              <li>Change pricing or features</li>
              <li>Suspend or terminate your account for violations of these Terms</li>
              <li>Update these Terms (we will notify you of material changes)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p className="mb-4">
              These Terms are governed by the laws of Italy and the European Union. Any disputes shall be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
            <p className="mb-4">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="mb-4">
              Email: legal@aetha.inc<br />
              Website: <a href="https://aetha.inc" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">https://aetha.inc</a>
            </p>
          </section>

          <section className="mb-8 p-6 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Summary (Not Legally Binding)</h3>
            <p className="mb-2">
              In simple terms:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Arvo is a fitness tool, not medical advice</li>
              <li>Exercise has risks - you assume them by using the Service</li>
              <li>AI can make mistakes - use critical judgment</li>
              <li>We're not liable for injuries</li>
              <li>You must be 14+ to use Arvo</li>
              <li>We respect your privacy (see Privacy Policy)</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
