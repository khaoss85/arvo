import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.terms");

  return {
    title: `${t("title")} | Arvo`,
    description: t("sections.description.intro"),
  };
}

export default function TermsOfServicePage() {
  const t = useTranslations("legal.terms");

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
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.acceptance.title")}</h2>
            <p className="mb-4">
              {t("sections.acceptance.paragraph1")}
            </p>
            <p className="mb-4">
              {t("sections.acceptance.paragraph2")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.description.title")}</h2>
            <p className="mb-4">
              {t("sections.description.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.description.features.personalized")}</li>
              <li>{t("sections.description.features.exercise")}</li>
              <li>{t("sections.description.features.tracking")}</li>
              <li>{t("sections.description.features.methodology")}</li>
              <li>{t("sections.description.features.insights")}</li>
              <li>{t("sections.description.features.substitution")}</li>
            </ul>
            <p className="mb-4 font-semibold text-orange-600 dark:text-orange-400">
              {t("sections.description.important")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.medical.title")}</h2>
            <p className="mb-4 font-semibold">
              {t("sections.medical.warning")}
            </p>
            <p className="mb-4">
              {t("sections.medical.aiLimitations")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.medical.limitations.medical")}</li>
              <li>{t("sections.medical.limitations.assess")}</li>
              <li>{t("sections.medical.limitations.detect")}</li>
              <li>{t("sections.medical.limitations.account")}</li>
            </ul>
            <p className="mb-4">
              {t("sections.medical.consultIf")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.medical.symptoms.pain")}</li>
              <li>{t("sections.medical.symptoms.cardiovascular")}</li>
              <li>{t("sections.medical.symptoms.injury")}</li>
              <li>{t("sections.medical.symptoms.doubt")}</li>
            </ul>
            <p className="mb-4">
              {t("sections.medical.fullDisclaimer")} <Link href="/medical-disclaimer" className="text-primary-600 dark:text-primary-400 hover:underline">/medical-disclaimer</Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.risk.title")}</h2>
            <p className="mb-4">
              {t("sections.risk.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.risk.risks.strains")}</li>
              <li>{t("sections.risk.risks.joint")}</li>
              <li>{t("sections.risk.risks.cardiovascular")}</li>
              <li>{t("sections.risk.risks.equipment")}</li>
              <li>{t("sections.risk.risks.serious")}</li>
            </ul>
            <p className="mb-4 font-semibold">
              {t("sections.risk.acknowledgment")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.risk.responsibilities.fitness")}</li>
              <li>{t("sections.risk.responsibilities.form")}</li>
              <li>{t("sections.risk.responsibilities.weights")}</li>
              <li>{t("sections.risk.responsibilities.environment")}</li>
              <li>{t("sections.risk.responsibilities.stopping")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.ai.title")}</h2>
            <p className="mb-4">
              {t("sections.ai.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.ai.limitations.algorithmic")}</li>
              <li>{t("sections.ai.limitations.errors")}</li>
              <li>{t("sections.ai.limitations.context")}</li>
              <li>{t("sections.ai.limitations.evaluation")}</li>
              <li>{t("sections.ai.limitations.validation")}</li>
            </ul>
            <p className="mb-4">
              {t("sections.ai.disclaimer")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.userResponsibilities.title")}</h2>
            <p className="mb-4">{t("sections.userResponsibilities.intro")}</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.userResponsibilities.items.accurate")}</li>
              <li>{t("sections.userResponsibilities.items.update")}</li>
              <li>{t("sections.userResponsibilities.items.comply")}</li>
              <li>{t("sections.userResponsibilities.items.noMisuse")}</li>
              <li>{t("sections.userResponsibilities.items.noShare")}</li>
              <li>{t("sections.userResponsibilities.items.laws")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.privacy.title")}</h2>
            <p className="mb-4">
              {t("sections.privacy.intro")} <Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">{t("sections.privacy.privacyPolicy")}</Link>.
            </p>
            <p className="mb-4">
              {t("sections.privacy.dataCollected")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.privacy.types.measurements")}</li>
              <li>{t("sections.privacy.types.performance")}</li>
              <li>{t("sections.privacy.types.pain")}</li>
              <li>{t("sections.privacy.types.notes")}</li>
              <li>{t("sections.privacy.types.preferences")}</li>
            </ul>
            <p className="mb-4">
              {t("sections.privacy.usage")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.liability.title")}</h2>
            <p className="mb-4 font-semibold">
              {t("sections.liability.warning")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.liability.items.injuries")}</li>
              <li>{t("sections.liability.items.indirect")}</li>
              <li>{t("sections.liability.items.loss")}</li>
              <li>{t("sections.liability.items.aiErrors")}</li>
              <li>{t("sections.liability.items.reliance")}</li>
            </ul>
            <p className="mb-4">
              {t("sections.liability.cap")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.indemnification.title")}</h2>
            <p className="mb-4">
              {t("sections.indemnification.text")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.indemnification.items.use")}</li>
              <li>{t("sections.indemnification.items.violation")}</li>
              <li>{t("sections.indemnification.items.thirdParty")}</li>
              <li>{t("sections.indemnification.items.injuries")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.age.title")}</h2>
            <p className="mb-4">
              {t("sections.age.minimum")}
            </p>
            <p className="mb-4">
              {t("sections.age.guardian")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.intellectual.title")}</h2>
            <p className="mb-4">
              {t("sections.intellectual.ownership")}
            </p>
            <p className="mb-4">
              {t("sections.intellectual.restrictions")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.attribution.title")}</h2>
            <p className="mb-4">
              {t("sections.attribution.methodology")}
            </p>
            <p className="mb-4">
              {t("sections.attribution.acknowledgment")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.modifications.title")}</h2>
            <p className="mb-4">
              {t("sections.modifications.intro")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("sections.modifications.rights.modify")}</li>
              <li>{t("sections.modifications.rights.pricing")}</li>
              <li>{t("sections.modifications.rights.suspend")}</li>
              <li>{t("sections.modifications.rights.update")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.governing.title")}</h2>
            <p className="mb-4">
              {t("sections.governing.text")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t("sections.contact.title")}</h2>
            <p className="mb-4">
              {t("sections.contact.intro")}
            </p>
            <p className="mb-4">
              {t("sections.contact.email")} legal@aetha.inc<br />
              {t("sections.contact.website")} <a href="https://aetha.inc" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">https://aetha.inc</a>
            </p>
          </section>

          <section className="mb-8 p-6 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">{t("sections.summary.title")}</h3>
            <p className="mb-2">
              {t("sections.summary.intro")}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("sections.summary.points.tool")}</li>
              <li>{t("sections.summary.points.risks")}</li>
              <li>{t("sections.summary.points.ai")}</li>
              <li>{t("sections.summary.points.liability")}</li>
              <li>{t("sections.summary.points.age")}</li>
              <li>{t("sections.summary.points.privacy")}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
