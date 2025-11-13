import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Medical Disclaimer | Arvo",
  description: "Important medical disclaimer for Arvo - AI workout programming is not medical advice",
};

export default function MedicalDisclaimerPage() {
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
          <div className="flex items-start gap-4 mb-4">
            <AlertTriangle className="w-12 h-12 text-orange-600 dark:text-orange-400 shrink-0" />
            <div>
              <h1 className="text-4xl font-bold mb-2">Medical Disclaimer</h1>
              <p className="text-muted-foreground text-lg">
                Important safety information - Please read carefully
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Last updated: November 12, 2024
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-8 p-6 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              Critical Notice
            </h3>
            <p className="mb-3 font-semibold text-lg">
              Arvo is NOT a medical device, healthcare provider, or substitute for professional medical advice.
            </p>
            <p className="mb-0">
              Always consult with a qualified healthcare professional before starting any exercise program, especially if you have pre-existing health conditions or concerns.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Not Medical Advice</h2>
            <p className="mb-4">
              The information, recommendations, and AI-generated workout programs provided by Arvo are for <strong>informational and educational purposes only</strong>. They do NOT constitute:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Medical advice, diagnosis, or treatment</li>
              <li>Physical therapy or rehabilitation guidance</li>
              <li>Nutritional or dietary counseling</li>
              <li>Professional coaching or personal training</li>
              <li>Healthcare services of any kind</li>
            </ul>
            <p className="mb-4 font-semibold text-orange-600 dark:text-orange-400">
              Arvo cannot and does not replace the expertise of qualified healthcare professionals, physical therapists, or certified personal trainers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. AI Limitations</h2>
            <p className="mb-4">
              Arvo uses artificial intelligence (AI) to generate workout recommendations. You must understand that:
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">AI Cannot:</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Assess your medical condition:</strong> AI cannot diagnose injuries, illnesses, or health problems</li>
              <li><strong>Detect contraindications:</strong> AI may not know about medications, conditions, or risk factors that make exercise dangerous for you</li>
              <li><strong>Replace clinical judgment:</strong> AI lacks the nuanced understanding of a medical professional</li>
              <li><strong>Monitor you in real-time:</strong> AI cannot observe your form, fatigue, or distress during exercise</li>
              <li><strong>Account for unreported conditions:</strong> AI only knows what you explicitly tell it</li>
              <li><strong>Guarantee safety:</strong> AI recommendations may be inappropriate or dangerous for your specific situation</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">AI Can Make Mistakes:</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Suggest exercises that are unsafe for you</li>
              <li>Recommend inappropriate weights or volumes</li>
              <li>Misinterpret your feedback or pain reports</li>
              <li>Generate workouts that cause injury or overtraining</li>
              <li>Provide incorrect technical cues or form instructions</li>
            </ul>

            <p className="mb-4 font-semibold">
              YOU are responsible for critically evaluating all AI recommendations and using your own judgment.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. When to Consult a Healthcare Professional</h2>
            <p className="mb-4 font-semibold">
              You MUST consult a qualified healthcare professional BEFORE using Arvo if you:
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Have Any of These Conditions:</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Heart disease, cardiovascular conditions, or high blood pressure</li>
              <li>Respiratory problems (asthma, COPD, etc.)</li>
              <li>Diabetes or blood sugar regulation issues</li>
              <li>Joint problems, arthritis, or orthopedic conditions</li>
              <li>Chronic pain or previous injuries</li>
              <li>Neurological disorders</li>
              <li>Pregnancy or recent childbirth</li>
              <li>Obesity or severe deconditioning</li>
              <li>Recent surgery or hospitalization</li>
              <li>Any other chronic or acute medical condition</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Are Taking Medications That May Affect Exercise:</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Blood thinners or anticoagulants</li>
              <li>Beta-blockers or blood pressure medications</li>
              <li>Insulin or diabetes medications</li>
              <li>Corticosteroids or anti-inflammatory drugs</li>
              <li>Any medication that affects heart rate, blood pressure, or physical performance</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Are Over 40 and Sedentary:</h3>
            <p className="mb-4">
              If you are over 40 years old and have been inactive for several months, get medical clearance before starting intense exercise.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Have Family History Of:</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Heart disease or sudden cardiac death</li>
              <li>Stroke or aneurysm</li>
              <li>Inherited conditions affecting exercise safety</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Stop Exercise and Seek Medical Help If You Experience:</h2>
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900 rounded-lg mb-4">
              <p className="mb-3 font-semibold text-red-700 dark:text-red-300">
                STOP IMMEDIATELY and seek emergency medical care if you experience:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-red-700 dark:text-red-300">
                <li>Chest pain, pressure, or tightness</li>
                <li>Severe shortness of breath</li>
                <li>Dizziness, lightheadedness, or fainting</li>
                <li>Irregular or rapid heartbeat</li>
                <li>Severe nausea or vomiting</li>
                <li>Blurred vision or loss of consciousness</li>
                <li>Numbness or tingling in extremities</li>
              </ul>
            </div>

            <p className="mb-4">
              Also consult a healthcare professional for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Joint pain that persists beyond normal muscle soreness</li>
              <li>Sharp or stabbing pain during or after exercise</li>
              <li>Swelling, bruising, or visible deformity</li>
              <li>Persistent numbness or weakness</li>
              <li>Pain that worsens over time or doesn't improve with rest</li>
              <li>Any symptom that concerns you</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Pain and Injury Tracking Limitations</h2>
            <p className="mb-4 font-semibold text-orange-600 dark:text-orange-400">
              Arvo's pain and injury tracking features are NOT diagnostic tools.
            </p>
            <p className="mb-4">
              When you report pain or limitations:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>AI will attempt to avoid exercises that caused pain</li>
              <li>AI may suggest alternative exercises</li>
              <li>AI CANNOT diagnose the cause of your pain</li>
              <li>AI CANNOT determine if exercise is safe for you</li>
              <li>AI CANNOT provide medical treatment recommendations</li>
            </ul>
            <p className="mb-4 font-semibold">
              If you experience pain, consult a qualified healthcare professional (doctor, physical therapist, sports medicine specialist) for proper diagnosis and treatment.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Exercise Risks</h2>
            <p className="mb-4">
              Exercise and physical training carry inherent risks, including but not limited to:
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Common Risks:</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Muscle strains, pulls, and tears</li>
              <li>Ligament and tendon injuries</li>
              <li>Joint sprains and dislocations</li>
              <li>Bruising and contusions</li>
              <li>Delayed onset muscle soreness (DOMS)</li>
              <li>Fatigue and overtraining</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Serious Risks:</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Fractures and broken bones</li>
              <li>Herniated discs or spinal injuries</li>
              <li>Rhabdomyolysis (severe muscle breakdown)</li>
              <li>Heat exhaustion or heat stroke</li>
              <li>Cardiovascular events (heart attack, stroke)</li>
              <li>Severe injury requiring surgery</li>
              <li>Permanent disability or death</li>
            </ul>

            <p className="mb-4 font-semibold">
              By using Arvo, you acknowledge these risks and voluntarily assume them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Responsibilities</h2>
            <p className="mb-4">
              You are solely responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Medical clearance:</strong> Obtaining approval from your doctor before exercising</li>
              <li><strong>Honest disclosure:</strong> Providing accurate information about your health, limitations, and injuries</li>
              <li><strong>Exercise judgment:</strong> Evaluating whether AI recommendations are appropriate for you</li>
              <li><strong>Proper technique:</strong> Learning and using correct form (consider hiring a qualified coach)</li>
              <li><strong>Safe environment:</strong> Training in a safe space with proper equipment</li>
              <li><strong>Progressive overload:</strong> Increasing intensity gradually and listening to your body</li>
              <li><strong>Rest and recovery:</strong> Taking adequate rest days and addressing fatigue</li>
              <li><strong>Seeking help:</strong> Consulting professionals when needed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. No Professional Relationship</h2>
            <p className="mb-4">
              Use of Arvo does NOT create a doctor-patient, therapist-client, or coach-athlete relationship. We do not have a duty of care toward you.
            </p>
            <p className="mb-4">
              You should not rely on Arvo as your sole source of fitness guidance. Consider working with:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>A certified personal trainer (for technique and programming)</li>
              <li>A sports medicine doctor (for injury prevention and management)</li>
              <li>A physical therapist (for rehabilitation)</li>
              <li>A registered dietitian (for nutrition)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
            <p className="mb-4 font-semibold">
              ARVO IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            </p>
            <p className="mb-4">
              We do not warrant that:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>The Service will meet your fitness goals</li>
              <li>AI recommendations are accurate, complete, or suitable for you</li>
              <li>Use of the Service will prevent injuries</li>
              <li>The Service is error-free or uninterrupted</li>
              <li>Defects will be corrected</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="mb-4 font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR ANY INJURIES, ILLNESSES, OR DAMAGES RESULTING FROM YOUR USE OF ARVO.
            </p>
            <p className="mb-4">
              This includes but is not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Injuries sustained while following AI-generated workouts</li>
              <li>Overtraining, burnout, or performance decline</li>
              <li>Aggravation of pre-existing conditions</li>
              <li>Medical expenses or loss of income</li>
              <li>Any damages arising from AI errors or recommendations</li>
            </ul>
            <p className="mb-4">
              See our <Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</Link> for complete liability limitations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Use Common Sense</h2>
            <p className="mb-4">
              Exercise requires judgment and common sense:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>If something feels wrong, STOP</li>
              <li>If a weight feels too heavy, use less weight</li>
              <li>If you're unsure about form, learn proper technique first</li>
              <li>If you're sick, injured, or exhausted, REST</li>
              <li>If AI suggests something that seems dangerous, DON'T DO IT</li>
            </ul>
            <p className="mb-4 font-semibold">
              Your safety is YOUR responsibility. AI cannot keep you safe—only you can.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Acknowledgment</h2>
            <p className="mb-4">
              By using Arvo, you acknowledge that you have read, understood, and agree to this Medical Disclaimer. You accept full responsibility for your health and safety while using the Service.
            </p>
            <p className="mb-4">
              If you do not accept these terms, do not use Arvo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <p className="mb-4">
              For questions about this disclaimer:
            </p>
            <p className="mb-4">
              Email: legal@aetha.inc<br />
              Website: <a href="https://aetha.inc" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">https://aetha.inc</a>
            </p>
          </section>

          <section className="p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Summary</h3>
            <p className="mb-2 font-semibold">
              In the simplest terms:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Arvo is a tool, not a doctor or coach</li>
              <li>AI can make mistakes—use your judgment</li>
              <li>Get medical clearance before exercising</li>
              <li>Stop if you feel pain or distress</li>
              <li>You assume all risks of exercise</li>
              <li>We are not liable for injuries</li>
            </ul>
            <p className="mt-4 font-semibold text-blue-700 dark:text-blue-300">
              Exercise smart. Stay safe. Consult professionals when in doubt.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
