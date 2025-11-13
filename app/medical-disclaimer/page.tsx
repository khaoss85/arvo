import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("medicalDisclaimer");

  return {
    title: `${t("title")} | Arvo`,
    description: t("metaDescription"),
  };
}

export default function MedicalDisclaimerPage() {
  const t = useTranslations("medicalDisclaimer");

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("backToHome")}
            </Button>
          </Link>
          <div className="flex items-start gap-4 mb-4">
            <AlertTriangle className="w-12 h-12 text-orange-600 dark:text-orange-400 shrink-0" />
            <div>
              <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
              <p className="text-muted-foreground text-lg">
                {t("page.subtitle")}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            {t("lastUpdated")}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-8 p-6 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              {t("page.criticalNotice.title")}
            </h3>
            <p className="mb-3 font-semibold text-lg">
              {t("page.criticalNotice.paragraph1")}
            </p>
            <p className="mb-0">
              {t("page.criticalNotice.paragraph2")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.notMedicalAdvice.title")}</h2>
            <p className="mb-4">
              {t.rich("page.notMedicalAdvice.intro", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.notMedicalAdvice.items.medical")}</li>
              <li>{t("page.notMedicalAdvice.items.physicalTherapy")}</li>
              <li>{t("page.notMedicalAdvice.items.nutritional")}</li>
              <li>{t("page.notMedicalAdvice.items.coaching")}</li>
              <li>{t("page.notMedicalAdvice.items.healthcare")}</li>
            </ul>
            <p className="mb-4 font-semibold text-orange-600 dark:text-orange-400">
              {t("page.notMedicalAdvice.warning")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.aiLimitations.title")}</h2>
            <p className="mb-4">
              {t("page.aiLimitations.intro")}
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("page.aiLimitations.aiCannot.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t.rich("page.aiLimitations.aiCannot.assessMedical", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.aiLimitations.aiCannot.detectContraindications", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.aiLimitations.aiCannot.replaceClinical", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.aiLimitations.aiCannot.monitorRealtime", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.aiLimitations.aiCannot.accountUnreported", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.aiLimitations.aiCannot.guaranteeSafety", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("page.aiLimitations.aiMistakes.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.aiLimitations.aiMistakes.unsafeExercises")}</li>
              <li>{t("page.aiLimitations.aiMistakes.inappropriateWeights")}</li>
              <li>{t("page.aiLimitations.aiMistakes.misinterpretPain")}</li>
              <li>{t("page.aiLimitations.aiMistakes.causeInjury")}</li>
              <li>{t("page.aiLimitations.aiMistakes.incorrectCues")}</li>
            </ul>

            <p className="mb-4 font-semibold">
              {t("page.aiLimitations.responsibility")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.whenConsult.title")}</h2>
            <p className="mb-4 font-semibold">
              {t("page.whenConsult.intro")}
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("page.whenConsult.conditions.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.whenConsult.conditions.heart")}</li>
              <li>{t("page.whenConsult.conditions.respiratory")}</li>
              <li>{t("page.whenConsult.conditions.diabetes")}</li>
              <li>{t("page.whenConsult.conditions.joint")}</li>
              <li>{t("page.whenConsult.conditions.chronicPain")}</li>
              <li>{t("page.whenConsult.conditions.neurological")}</li>
              <li>{t("page.whenConsult.conditions.pregnancy")}</li>
              <li>{t("page.whenConsult.conditions.obesity")}</li>
              <li>{t("page.whenConsult.conditions.surgery")}</li>
              <li>{t("page.whenConsult.conditions.other")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("page.whenConsult.medications.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.whenConsult.medications.bloodThinners")}</li>
              <li>{t("page.whenConsult.medications.betaBlockers")}</li>
              <li>{t("page.whenConsult.medications.insulin")}</li>
              <li>{t("page.whenConsult.medications.corticosteroids")}</li>
              <li>{t("page.whenConsult.medications.performance")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("page.whenConsult.over40.title")}</h3>
            <p className="mb-4">
              {t("page.whenConsult.over40.description")}
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("page.whenConsult.familyHistory.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.whenConsult.familyHistory.heartDisease")}</li>
              <li>{t("page.whenConsult.familyHistory.stroke")}</li>
              <li>{t("page.whenConsult.familyHistory.inherited")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.stopAndSeek.title")}</h2>
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900 rounded-lg mb-4">
              <p className="mb-3 font-semibold text-red-700 dark:text-red-300">
                {t("page.stopAndSeek.emergencyIntro")}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-red-700 dark:text-red-300">
                <li>{t("page.stopAndSeek.emergency.chestPain")}</li>
                <li>{t("page.stopAndSeek.emergency.breathShortness")}</li>
                <li>{t("page.stopAndSeek.emergency.dizziness")}</li>
                <li>{t("page.stopAndSeek.emergency.irregularHeart")}</li>
                <li>{t("page.stopAndSeek.emergency.nausea")}</li>
                <li>{t("page.stopAndSeek.emergency.blurredVision")}</li>
                <li>{t("page.stopAndSeek.emergency.numbness")}</li>
              </ul>
            </div>

            <p className="mb-4">
              {t("page.stopAndSeek.consultFor")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.stopAndSeek.warning.jointPain")}</li>
              <li>{t("page.stopAndSeek.warning.sharpPain")}</li>
              <li>{t("page.stopAndSeek.warning.swelling")}</li>
              <li>{t("page.stopAndSeek.warning.persistentNumbness")}</li>
              <li>{t("page.stopAndSeek.warning.worseningPain")}</li>
              <li>{t("page.stopAndSeek.warning.anyConcern")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.painTracking.title")}</h2>
            <p className="mb-4 font-semibold text-orange-600 dark:text-orange-400">
              {t("page.painTracking.warning")}
            </p>
            <p className="mb-4">
              {t("page.painTracking.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.painTracking.items.avoid")}</li>
              <li>{t("page.painTracking.items.suggest")}</li>
              <li>{t("page.painTracking.items.cannotDiagnose")}</li>
              <li>{t("page.painTracking.items.cannotDetermine")}</li>
              <li>{t("page.painTracking.items.cannotProvide")}</li>
            </ul>
            <p className="mb-4 font-semibold">
              {t("page.painTracking.conclusion")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.exerciseRisks.title")}</h2>
            <p className="mb-4">
              {t("page.exerciseRisks.intro")}
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("page.exerciseRisks.common.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.exerciseRisks.common.strains")}</li>
              <li>{t("page.exerciseRisks.common.ligament")}</li>
              <li>{t("page.exerciseRisks.common.sprains")}</li>
              <li>{t("page.exerciseRisks.common.bruising")}</li>
              <li>{t("page.exerciseRisks.common.doms")}</li>
              <li>{t("page.exerciseRisks.common.fatigue")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("page.exerciseRisks.serious.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.exerciseRisks.serious.fractures")}</li>
              <li>{t("page.exerciseRisks.serious.herniatedDiscs")}</li>
              <li>{t("page.exerciseRisks.serious.rhabdomyolysis")}</li>
              <li>{t("page.exerciseRisks.serious.heatStroke")}</li>
              <li>{t("page.exerciseRisks.serious.cardiovascular")}</li>
              <li>{t("page.exerciseRisks.serious.surgery")}</li>
              <li>{t("page.exerciseRisks.serious.death")}</li>
            </ul>

            <p className="mb-4 font-semibold">
              {t("page.exerciseRisks.acknowledgment")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.yourResponsibilities.title")}</h2>
            <p className="mb-4">
              {t("page.yourResponsibilities.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t.rich("page.yourResponsibilities.items.medicalClearance", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.yourResponsibilities.items.honestDisclosure", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.yourResponsibilities.items.exerciseJudgment", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.yourResponsibilities.items.properTechnique", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.yourResponsibilities.items.safeEnvironment", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.yourResponsibilities.items.progressiveOverload", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.yourResponsibilities.items.restRecovery", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
              <li>{t.rich("page.yourResponsibilities.items.seekingHelp", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.noProfessionalRelationship.title")}</h2>
            <p className="mb-4">
              {t("page.noProfessionalRelationship.paragraph1")}
            </p>
            <p className="mb-4">
              {t("page.noProfessionalRelationship.paragraph2")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.noProfessionalRelationship.professionals.trainer")}</li>
              <li>{t("page.noProfessionalRelationship.professionals.doctor")}</li>
              <li>{t("page.noProfessionalRelationship.professionals.therapist")}</li>
              <li>{t("page.noProfessionalRelationship.professionals.dietitian")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.disclaimerWarranties.title")}</h2>
            <p className="mb-4 font-semibold">
              {t("page.disclaimerWarranties.warning")}
            </p>
            <p className="mb-4">
              {t("page.disclaimerWarranties.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.disclaimerWarranties.items.goals")}</li>
              <li>{t("page.disclaimerWarranties.items.accurate")}</li>
              <li>{t("page.disclaimerWarranties.items.prevent")}</li>
              <li>{t("page.disclaimerWarranties.items.errorFree")}</li>
              <li>{t("page.disclaimerWarranties.items.corrected")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.limitationLiability.title")}</h2>
            <p className="mb-4 font-semibold">
              {t("page.limitationLiability.warning")}
            </p>
            <p className="mb-4">
              {t("page.limitationLiability.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.limitationLiability.items.injuries")}</li>
              <li>{t("page.limitationLiability.items.overtraining")}</li>
              <li>{t("page.limitationLiability.items.aggravation")}</li>
              <li>{t("page.limitationLiability.items.expenses")}</li>
              <li>{t("page.limitationLiability.items.aiErrors")}</li>
            </ul>
            <p className="mb-4">
              {t.rich("page.limitationLiability.seeTerms", {
                link: (chunks) => (
                  <Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.commonSense.title")}</h2>
            <p className="mb-4">
              {t("page.commonSense.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("page.commonSense.items.feelsWrong")}</li>
              <li>{t("page.commonSense.items.tooHeavy")}</li>
              <li>{t("page.commonSense.items.unsureForm")}</li>
              <li>{t("page.commonSense.items.sickInjured")}</li>
              <li>{t("page.commonSense.items.dangerous")}</li>
            </ul>
            <p className="mb-4 font-semibold">
              {t("page.commonSense.conclusion")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.acknowledgment.title")}</h2>
            <p className="mb-4">
              {t("page.acknowledgment.paragraph1")}
            </p>
            <p className="mb-4">
              {t("page.acknowledgment.paragraph2")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("page.contactInfo.title")}</h2>
            <p className="mb-4">
              {t("page.contactInfo.intro")}
            </p>
            <p className="mb-4">
              {t("page.contactInfo.email")}<br />
              {t.rich("page.contactInfo.website", {
                link: (chunks) => (
                  <a href="https://aetha.inc" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </section>

          <section className="p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">{t("page.summary.title")}</h3>
            <p className="mb-2 font-semibold">
              {t("page.summary.intro")}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("page.summary.items.tool")}</li>
              <li>{t("page.summary.items.mistakes")}</li>
              <li>{t("page.summary.items.clearance")}</li>
              <li>{t("page.summary.items.stop")}</li>
              <li>{t("page.summary.items.assume")}</li>
              <li>{t("page.summary.items.notLiable")}</li>
            </ul>
            <p className="mt-4 font-semibold text-blue-700 dark:text-blue-300">
              {t("page.summary.conclusion")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
