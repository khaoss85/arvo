import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Arvo",
  description: "Privacy Policy for Arvo - How we collect, use, and protect your data",
};

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: November 12, 2024
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-8 p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Your Privacy Matters</h3>
            <p className="mb-2">
              Arvo is committed to protecting your privacy. This policy explains how we collect, use, store, and protect your personal information, including health data.
            </p>
            <p className="mb-0">
              We comply with the General Data Protection Regulation (GDPR) and applicable data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">1.1 Account Information</h3>
            <p className="mb-4">When you create an account, we collect:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Email address (for authentication and communication)</li>
              <li>Account creation timestamp</li>
              <li>Login activity and session data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">1.2 Health and Fitness Data (Special Category Data)</h3>
            <p className="mb-4 font-semibold text-orange-600 dark:text-orange-400">
              IMPORTANT: Under GDPR Article 9, health data is "special category" personal data requiring explicit consent and extra protection.
            </p>
            <p className="mb-4">We collect the following health-related data:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Physical measurements:</strong> Age, weight, height, gender</li>
              <li><strong>Fitness profile:</strong> Training experience level, available equipment, training frequency</li>
              <li><strong>Workout performance:</strong> Exercises performed, sets, reps, weights used, RIR (Reps In Reserve), rest times</li>
              <li><strong>Pain and injury data:</strong> Reported limitations, pain locations, severity, affected exercises</li>
              <li><strong>Workout notes:</strong> Free-text feedback including subjective feelings, fatigue, discomfort</li>
              <li><strong>Mental readiness:</strong> Self-reported readiness scores</li>
              <li><strong>Body composition:</strong> (if provided) body fat percentage, muscle mass</li>
              <li><strong>Caloric phase:</strong> Bulk, maintenance, or cut status</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">1.3 Usage Data</h3>
            <p className="mb-4">We automatically collect:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Device information (browser, operating system, screen size)</li>
              <li>IP address (anonymized)</li>
              <li>Pages visited and features used</li>
              <li>Error logs and performance metrics</li>
              <li>AI interaction patterns (e.g., workouts generated, exercises selected)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">1.4 Data from Third-Party Services</h3>
            <p className="mb-4">We use:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Supabase:</strong> Authentication and database hosting</li>
              <li><strong>Anthropic/OpenAI:</strong> AI model providers for workout generation (data anonymized)</li>
              <li><strong>Vercel:</strong> Hosting and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Data</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Primary Purposes</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Workout generation:</strong> AI uses your profile, history, and limitations to create personalized workouts</li>
              <li><strong>Exercise recommendations:</strong> Selecting exercises based on equipment, experience, and preferences</li>
              <li><strong>Progression tracking:</strong> Calculating appropriate weight/rep progressions based on performance</li>
              <li><strong>Insight extraction:</strong> AI analyzes workout notes to detect patterns, preferences, and potential issues</li>
              <li><strong>Safety features:</strong> Avoiding exercises that caused pain or injury</li>
              <li><strong>Volume management:</strong> Tracking weekly volume to prevent overtraining</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Service Improvement</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Improving AI algorithms and recommendation accuracy</li>
              <li>Debugging errors and fixing bugs</li>
              <li>Understanding user behavior to enhance UX</li>
              <li>Developing new features based on usage patterns</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Communication</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Sending authentication emails (magic links)</li>
              <li>Service updates and security notifications</li>
              <li>Responding to support requests</li>
              <li>Marketing communications (only with your explicit consent)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.4 Legal Obligations</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Complying with legal requirements (e.g., tax, law enforcement)</li>
              <li>Protecting our rights and property</li>
              <li>Preventing fraud and abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Legal Basis for Processing (GDPR)</h2>
            <p className="mb-4">We process your data based on:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Explicit consent (Article 9):</strong> For health data collection and AI processing</li>
              <li><strong>Contract performance:</strong> To provide the Service you signed up for</li>
              <li><strong>Legitimate interests:</strong> Service improvement, fraud prevention, security</li>
              <li><strong>Legal obligations:</strong> Compliance with laws and regulations</li>
            </ul>
            <p className="mb-4 font-semibold">
              You can withdraw your consent at any time by contacting us or deleting your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Where We Store Data</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Primary database:</strong> Supabase (PostgreSQL) hosted in EU data centers</li>
              <li><strong>Client-side storage:</strong> localStorage (workouts in progress, drafts)</li>
              <li><strong>Backups:</strong> Encrypted backups stored in EU</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Security Measures</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Encryption at rest for sensitive data</li>
              <li>Row-level security (RLS) in database</li>
              <li>Access controls and authentication</li>
              <li>Regular security audits</li>
              <li>Anonymization of data sent to AI providers</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Data Retention</h3>
            <p className="mb-4">We retain your data:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Active accounts:</strong> As long as your account exists</li>
              <li><strong>Deleted accounts:</strong> 30 days (to allow recovery), then permanently deleted</li>
              <li><strong>Backups:</strong> Up to 90 days in encrypted backups</li>
              <li><strong>Anonymized analytics:</strong> Indefinitely (cannot be linked back to you)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Third Parties</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.1 We DO NOT Sell Your Data</h3>
            <p className="mb-4 font-semibold text-green-600 dark:text-green-400">
              We do not sell, rent, or trade your personal data to third parties for marketing purposes.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Service Providers</h3>
            <p className="mb-4">We share data with trusted service providers who help us operate:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Supabase:</strong> Database and authentication (GDPR-compliant, EU-hosted)</li>
              <li><strong>Anthropic/OpenAI:</strong> AI models (data anonymized, no PII sent)</li>
              <li><strong>Vercel:</strong> Hosting and CDN (GDPR-compliant)</li>
            </ul>
            <p className="mb-4">
              All service providers are bound by data processing agreements (DPAs) and comply with GDPR.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.3 AI Model Processing</h3>
            <p className="mb-4 font-semibold">
              When generating workouts, we send anonymized data to AI providers (Anthropic, OpenAI). This data:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Does NOT include your name, email, or other identifying information</li>
              <li>Includes only workout-relevant data (exercise history, preferences, limitations)</li>
              <li>Is not used to train AI models (per provider agreements)</li>
              <li>Is not stored by AI providers beyond processing time</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.4 Legal Requirements</h3>
            <p className="mb-4">We may disclose your data if required by:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Law enforcement or government authorities</li>
              <li>Court orders or legal processes</li>
              <li>Protection of our rights, safety, or property</li>
              <li>Prevention of fraud or illegal activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights (GDPR)</h2>
            <p className="mb-4">You have the right to:</p>

            <ul className="list-disc pl-6 mb-4 space-y-3">
              <li>
                <strong>Access:</strong> Request a copy of all personal data we hold about you
              </li>
              <li>
                <strong>Rectification:</strong> Correct inaccurate or incomplete data
              </li>
              <li>
                <strong>Erasure ("Right to be forgotten"):</strong> Request deletion of your data
              </li>
              <li>
                <strong>Data portability:</strong> Receive your data in a structured, machine-readable format
              </li>
              <li>
                <strong>Restriction:</strong> Limit how we process your data
              </li>
              <li>
                <strong>Objection:</strong> Object to processing based on legitimate interests
              </li>
              <li>
                <strong>Withdraw consent:</strong> Revoke consent for health data processing at any time
              </li>
              <li>
                <strong>Lodge a complaint:</strong> File a complaint with a data protection authority
              </li>
            </ul>

            <p className="mb-4 font-semibold">
              To exercise these rights, contact us at privacy@aetha.inc or use the settings page when available.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
            <p className="mb-4">We use minimal cookies and tracking:</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.1 Essential Cookies</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Authentication tokens (to keep you logged in)</li>
              <li>Session management</li>
              <li>Security and fraud prevention</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.2 Analytics Cookies (Optional)</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Vercel Analytics (anonymized usage statistics)</li>
              <li>Error tracking (to fix bugs)</li>
            </ul>
            <p className="mb-4">
              You can disable analytics cookies through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="mb-4">
              Arvo is intended for users aged 14 and older. Users under 18 should use the Service under parental supervision.
            </p>
            <p className="mb-4">
              We do not knowingly collect data from children under 14. If you believe we have collected such data, please contact us immediately, and we will delete it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="mb-4">
              Your data is primarily stored and processed within the European Union. If data is transferred outside the EU (e.g., to AI providers in the US), we ensure adequate safeguards such as:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Standard Contractual Clauses (SCCs)</li>
              <li>Data anonymization</li>
              <li>GDPR-compliant data processing agreements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Notify you of material changes via email or in-app notification</li>
              <li>Update the "Last updated" date at the top</li>
              <li>Obtain your consent if required by law</li>
            </ul>
            <p className="mb-4">
              Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="mb-4">
              For privacy-related questions, data access requests, or to exercise your rights:
            </p>
            <p className="mb-4">
              <strong>Data Protection Contact:</strong><br />
              Email: privacy@aetha.inc<br />
              Website: <a href="https://aetha.inc" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">https://aetha.inc</a>
            </p>
            <p className="mb-4">
              <strong>EU Representative (if applicable):</strong><br />
              [To be determined if needed based on your business structure]
            </p>
          </section>

          <section className="mb-8 p-6 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Summary (Not Legally Binding)</h3>
            <p className="mb-2">
              In simple terms:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We collect health data to personalize your workouts (with your consent)</li>
              <li>We DO NOT sell your data</li>
              <li>Data is stored securely in EU data centers</li>
              <li>AI providers receive anonymized data only</li>
              <li>You can access, export, or delete your data anytime</li>
              <li>We comply with GDPR and take privacy seriously</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
