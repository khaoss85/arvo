import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");

  return {
    title: `${t("title")} | Arvo`,
    description: t("metaDescription"),
  };
}

export default function PrivacyPolicyPage() {
  const t = useTranslations("legal.privacy");

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
          <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("lastUpdated")}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-8 p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">{t("intro.title")}</h3>
            <p className="mb-2">
              {t("intro.paragraph1")}
            </p>
            <p className="mb-0">
              {t("intro.paragraph2")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.informationCollect.title")}</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.informationCollect.account.title")}</h3>
            <p className="mb-4">{t("sections.informationCollect.account.intro")}</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.informationCollect.account.items.email")}</li>
              <li>{t("sections.informationCollect.account.items.timestamp")}</li>
              <li>{t("sections.informationCollect.account.items.activity")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.informationCollect.health.title")}</h3>
            <p className="mb-4 font-semibold text-orange-600 dark:text-orange-400">
              {t("sections.informationCollect.health.important")}
            </p>
            <p className="mb-4">{t("sections.informationCollect.health.intro")}</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>{t("sections.informationCollect.health.items.measurements.label")}</strong> {t("sections.informationCollect.health.items.measurements.value")}</li>
              <li><strong>{t("sections.informationCollect.health.items.fitness.label")}</strong> {t("sections.informationCollect.health.items.fitness.value")}</li>
              <li><strong>{t("sections.informationCollect.health.items.performance.label")}</strong> {t("sections.informationCollect.health.items.performance.value")}</li>
              <li><strong>{t("sections.informationCollect.health.items.pain.label")}</strong> {t("sections.informationCollect.health.items.pain.value")}</li>
              <li><strong>{t("sections.informationCollect.health.items.notes.label")}</strong> {t("sections.informationCollect.health.items.notes.value")}</li>
              <li><strong>{t("sections.informationCollect.health.items.readiness.label")}</strong> {t("sections.informationCollect.health.items.readiness.value")}</li>
              <li><strong>{t("sections.informationCollect.health.items.composition.label")}</strong> {t("sections.informationCollect.health.items.composition.value")}</li>
              <li><strong>{t("sections.informationCollect.health.items.caloric.label")}</strong> {t("sections.informationCollect.health.items.caloric.value")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.informationCollect.usage.title")}</h3>
            <p className="mb-4">{t("sections.informationCollect.usage.intro")}</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.informationCollect.usage.items.device")}</li>
              <li>{t("sections.informationCollect.usage.items.ip")}</li>
              <li>{t("sections.informationCollect.usage.items.pages")}</li>
              <li>{t("sections.informationCollect.usage.items.errors")}</li>
              <li>{t("sections.informationCollect.usage.items.ai")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.informationCollect.thirdParty.title")}</h3>
            <p className="mb-4">{t("sections.informationCollect.thirdParty.intro")}</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Supabase:</strong> {t("sections.informationCollect.thirdParty.items.supabase")}</li>
              <li><strong>Anthropic/OpenAI:</strong> {t("sections.informationCollect.thirdParty.items.ai")}</li>
              <li><strong>Vercel:</strong> {t("sections.informationCollect.thirdParty.items.vercel")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.howWeUse.title")}</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.howWeUse.primary.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>{t("sections.howWeUse.primary.items.workout.label")}</strong> {t("sections.howWeUse.primary.items.workout.value")}</li>
              <li><strong>{t("sections.howWeUse.primary.items.exercise.label")}</strong> {t("sections.howWeUse.primary.items.exercise.value")}</li>
              <li><strong>{t("sections.howWeUse.primary.items.progression.label")}</strong> {t("sections.howWeUse.primary.items.progression.value")}</li>
              <li><strong>{t("sections.howWeUse.primary.items.insights.label")}</strong> {t("sections.howWeUse.primary.items.insights.value")}</li>
              <li><strong>{t("sections.howWeUse.primary.items.safety.label")}</strong> {t("sections.howWeUse.primary.items.safety.value")}</li>
              <li><strong>{t("sections.howWeUse.primary.items.volume.label")}</strong> {t("sections.howWeUse.primary.items.volume.value")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.howWeUse.improvement.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.howWeUse.improvement.items.algorithms")}</li>
              <li>{t("sections.howWeUse.improvement.items.debugging")}</li>
              <li>{t("sections.howWeUse.improvement.items.behavior")}</li>
              <li>{t("sections.howWeUse.improvement.items.features")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.howWeUse.communication.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.howWeUse.communication.items.auth")}</li>
              <li>{t("sections.howWeUse.communication.items.updates")}</li>
              <li>{t("sections.howWeUse.communication.items.support")}</li>
              <li>{t("sections.howWeUse.communication.items.marketing")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.howWeUse.legal.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.howWeUse.legal.items.compliance")}</li>
              <li>{t("sections.howWeUse.legal.items.rights")}</li>
              <li>{t("sections.howWeUse.legal.items.fraud")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.legalBasis.title")}</h2>
            <p className="mb-4">{t("sections.legalBasis.intro")}</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>{t("sections.legalBasis.items.consent.label")}</strong> {t("sections.legalBasis.items.consent.value")}</li>
              <li><strong>{t("sections.legalBasis.items.contract.label")}</strong> {t("sections.legalBasis.items.contract.value")}</li>
              <li><strong>{t("sections.legalBasis.items.interests.label")}</strong> {t("sections.legalBasis.items.interests.value")}</li>
              <li><strong>{t("sections.legalBasis.items.obligations.label")}</strong> {t("sections.legalBasis.items.obligations.value")}</li>
            </ul>
            <p className="mb-4 font-semibold">
              {t("sections.legalBasis.withdrawal")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.storage.title")}</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.storage.where.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>{t("sections.storage.where.items.database.label")}</strong> {t("sections.storage.where.items.database.value")}</li>
              <li><strong>{t("sections.storage.where.items.client.label")}</strong> {t("sections.storage.where.items.client.value")}</li>
              <li><strong>{t("sections.storage.where.items.backups.label")}</strong> {t("sections.storage.where.items.backups.value")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.storage.security.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.storage.security.items.transit")}</li>
              <li>{t("sections.storage.security.items.rest")}</li>
              <li>{t("sections.storage.security.items.rls")}</li>
              <li>{t("sections.storage.security.items.access")}</li>
              <li>{t("sections.storage.security.items.audits")}</li>
              <li>{t("sections.storage.security.items.anonymization")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.storage.retention.title")}</h3>
            <p className="mb-4">{t("sections.storage.retention.intro")}</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>{t("sections.storage.retention.items.active.label")}</strong> {t("sections.storage.retention.items.active.value")}</li>
              <li><strong>{t("sections.storage.retention.items.deleted.label")}</strong> {t("sections.storage.retention.items.deleted.value")}</li>
              <li><strong>{t("sections.storage.retention.items.backups.label")}</strong> {t("sections.storage.retention.items.backups.value")}</li>
              <li><strong>{t("sections.storage.retention.items.analytics.label")}</strong> {t("sections.storage.retention.items.analytics.value")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.sharing.title")}</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.sharing.noSell.title")}</h3>
            <p className="mb-4 font-semibold text-green-600 dark:text-green-400">
              {t("sections.sharing.noSell.text")}
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.sharing.providers.title")}</h3>
            <p className="mb-4">{t("sections.sharing.providers.intro")}</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Supabase:</strong> {t("sections.sharing.providers.items.supabase")}</li>
              <li><strong>Anthropic/OpenAI:</strong> {t("sections.sharing.providers.items.ai")}</li>
              <li><strong>Vercel:</strong> {t("sections.sharing.providers.items.vercel")}</li>
            </ul>
            <p className="mb-4">
              {t("sections.sharing.providers.compliance")}
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.sharing.aiProcessing.title")}</h3>
            <p className="mb-4 font-semibold">
              {t("sections.sharing.aiProcessing.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.sharing.aiProcessing.items.noPii")}</li>
              <li>{t("sections.sharing.aiProcessing.items.workoutOnly")}</li>
              <li>{t("sections.sharing.aiProcessing.items.noTraining")}</li>
              <li>{t("sections.sharing.aiProcessing.items.noStorage")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.sharing.legalRequirements.title")}</h3>
            <p className="mb-4">{t("sections.sharing.legalRequirements.intro")}</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.sharing.legalRequirements.items.enforcement")}</li>
              <li>{t("sections.sharing.legalRequirements.items.court")}</li>
              <li>{t("sections.sharing.legalRequirements.items.protection")}</li>
              <li>{t("sections.sharing.legalRequirements.items.prevention")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.rights.title")}</h2>
            <p className="mb-4">{t("sections.rights.intro")}</p>

            <ul className="list-disc pl-6 mb-4 space-y-3">
              <li>
                <strong>{t("sections.rights.items.access.label")}</strong> {t("sections.rights.items.access.value")}
              </li>
              <li>
                <strong>{t("sections.rights.items.rectification.label")}</strong> {t("sections.rights.items.rectification.value")}
              </li>
              <li>
                <strong>{t("sections.rights.items.erasure.label")}</strong> {t("sections.rights.items.erasure.value")}
              </li>
              <li>
                <strong>{t("sections.rights.items.portability.label")}</strong> {t("sections.rights.items.portability.value")}
              </li>
              <li>
                <strong>{t("sections.rights.items.restriction.label")}</strong> {t("sections.rights.items.restriction.value")}
              </li>
              <li>
                <strong>{t("sections.rights.items.objection.label")}</strong> {t("sections.rights.items.objection.value")}
              </li>
              <li>
                <strong>{t("sections.rights.items.withdraw.label")}</strong> {t("sections.rights.items.withdraw.value")}
              </li>
              <li>
                <strong>{t("sections.rights.items.complaint.label")}</strong> {t("sections.rights.items.complaint.value")}
              </li>
            </ul>

            <p className="mb-4 font-semibold">
              {t("sections.rights.contact")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.cookies.title")}</h2>
            <p className="mb-4">{t("sections.cookies.intro")}</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.cookies.essential.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.cookies.essential.items.auth")}</li>
              <li>{t("sections.cookies.essential.items.session")}</li>
              <li>{t("sections.cookies.essential.items.security")}</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">{t("sections.cookies.analytics.title")}</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.cookies.analytics.items.vercel")}</li>
              <li>{t("sections.cookies.analytics.items.errors")}</li>
            </ul>
            <p className="mb-4">
              {t("sections.cookies.analytics.disable")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.children.title")}</h2>
            <p className="mb-4">
              {t("sections.children.paragraph1")}
            </p>
            <p className="mb-4">
              {t("sections.children.paragraph2")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.international.title")}</h2>
            <p className="mb-4">
              {t("sections.international.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.international.items.scc")}</li>
              <li>{t("sections.international.items.anonymization")}</li>
              <li>{t("sections.international.items.agreements")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.changes.title")}</h2>
            <p className="mb-4">
              {t("sections.changes.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.changes.items.notify")}</li>
              <li>{t("sections.changes.items.update")}</li>
              <li>{t("sections.changes.items.consent")}</li>
            </ul>
            <p className="mb-4">
              {t("sections.changes.continued")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.contact.title")}</h2>
            <p className="mb-4">
              {t("sections.contact.intro")}
            </p>
            <p className="mb-4">
              <strong>{t("sections.contact.dataProtection")}</strong><br />
              {t("sections.contact.email")} privacy@aetha.inc<br />
              {t("sections.contact.website")} <a href="https://aetha.inc" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">https://aetha.inc</a>
            </p>
            <p className="mb-4">
              <strong>{t("sections.contact.euRep")}</strong><br />
              {t("sections.contact.euRepInfo")}
            </p>
          </section>

          <section className="mb-8 p-6 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">{t("summary.title")}</h3>
            <p className="mb-2">
              {t("summary.intro")}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("summary.points.healthData")}</li>
              <li>{t("summary.points.noSell")}</li>
              <li>{t("summary.points.secure")}</li>
              <li>{t("summary.points.anonymized")}</li>
              <li>{t("summary.points.access")}</li>
              <li>{t("summary.points.gdpr")}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
