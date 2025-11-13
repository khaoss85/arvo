import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useTranslations('landing.footer');

  return (
    <footer className="bg-muted/30 border-t border-border py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size="sm" showTagline={false} animated={false} />
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('brand.tagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('product.title')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('product.login')}
                </Link>
              </li>
              <li>
                <Link href="#ai-showcase" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('product.features')}
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/anthropics/arvo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">{t('legal.title')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('legal.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('legal.terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p>
              {t('copyright', { year: currentYear })}
            </p>
            <p className="text-xs">
              {t('developer.text')}{" "}
              <a
                href="https://aetha.inc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                aetha.inc
              </a>
            </p>
          </div>
          <p className="text-xs">
            {t('powered')}
          </p>
        </div>
      </div>
    </footer>
  );
}
