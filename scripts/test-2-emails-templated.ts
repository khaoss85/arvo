/**
 * Test Script - 2 Email Template IT
 * Invia 2 email template in italiano (rispettando rate limit Resend)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Carica variabili d'ambiente da .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { Resend } from 'resend';
import { emailTemplates } from '../lib/services/email-templates';
import type {
  WelcomeEmailData,
  OnboardingCompleteEmailData,
} from '../lib/services/email-templates';

const TEST_EMAIL = 'daniele.pelleri@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = `ARVO <onboarding@${process.env.EMAIL_FROM_DOMAIN || 'arvo.guru'}>`;

// Inizializza Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Colori per console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testTemplatedEmails() {
  log(colors.bright + colors.cyan, '\n📧 TEST EMAIL TEMPLATE ITALIANI\n');
  log(colors.blue, `📬 Email di destinazione: ${TEST_EMAIL}`);
  log(colors.blue, `🇮🇹 Lingua: Italiano\n`);

  const results: { template: string; success: boolean; emailId?: string; error?: string }[] = [];

  try {
    // ==========================================
    // 1. WELCOME EMAIL (Template completo)
    // ==========================================
    log(colors.yellow, '▶ 1/2 Invio Welcome Email con template...');
    try {
      const data: WelcomeEmailData = {
        firstName: 'Daniele',
        email: TEST_EMAIL,
      };
      const { subject, html } = emailTemplates.welcome(data, APP_URL, 'it');

      log(colors.blue, `  Subject: ${subject}`);

      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [TEST_EMAIL],
        subject,
        html,
      });

      if (result.data) {
        results.push({ template: 'Welcome', success: true, emailId: result.data.id });
        log(colors.green, `✓ Welcome Email inviata (ID: ${result.data.id})\n`);
      } else if (result.error) {
        results.push({ template: 'Welcome', success: false, error: JSON.stringify(result.error) });
        log(colors.red, `✗ Errore Welcome: ${JSON.stringify(result.error)}\n`);
      }
    } catch (error: any) {
      results.push({ template: 'Welcome', success: false, error: error.message });
      log(colors.red, `✗ Errore Welcome: ${error.message}\n`);
    }

    // Delay per rispettare rate limit
    log(colors.blue, '⏳ Attendo 3 secondi prima della prossima email...\n');
    await delay(3000);

    // ==========================================
    // 2. ONBOARDING COMPLETE EMAIL (Template completo)
    // ==========================================
    log(colors.yellow, '▶ 2/2 Invio Onboarding Complete Email con template...');
    try {
      const data: OnboardingCompleteEmailData = {
        firstName: 'Daniele',
        approachName: 'Kuba Method',
        splitType: 'push_pull_legs',
        weeklyFrequency: 6,
        weakPoints: ['Petto', 'Deltoidi'],
        firstWorkoutId: 'workout-test-123',
      };
      const { subject, html } = emailTemplates.onboardingComplete(data, APP_URL, 'it');

      log(colors.blue, `  Subject: ${subject}`);

      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [TEST_EMAIL],
        subject,
        html,
      });

      if (result.data) {
        results.push({ template: 'Onboarding Complete', success: true, emailId: result.data.id });
        log(colors.green, `✓ Onboarding Complete Email inviata (ID: ${result.data.id})\n`);
      } else if (result.error) {
        results.push({ template: 'Onboarding Complete', success: false, error: JSON.stringify(result.error) });
        log(colors.red, `✗ Errore Onboarding Complete: ${JSON.stringify(result.error)}\n`);
      }
    } catch (error: any) {
      results.push({ template: 'Onboarding Complete', success: false, error: error.message });
      log(colors.red, `✗ Errore Onboarding Complete: ${error.message}\n`);
    }

    // ==========================================
    // RIEPILOGO
    // ==========================================
    log(colors.bright + colors.cyan, '📊 RIEPILOGO TEST\n');
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    log(colors.green, `✓ Email inviate con successo: ${successful}/2`);

    results
      .filter((r) => r.success)
      .forEach((r) => {
        log(colors.green, `  - ${r.template}: ${r.emailId}`);
      });

    if (failed > 0) {
      log(colors.red, `\n✗ Email fallite: ${failed}/2`);
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          log(colors.red, `  - ${r.template}: ${r.error}`);
        });
    }

    log(colors.bright + colors.blue, `\n📬 Controlla la inbox di ${TEST_EMAIL}`);
    log(colors.blue, '📊 Dashboard Resend: https://resend.com/emails\n');

    if (successful === 2) {
      log(colors.bright + colors.green, '🎉 ENTRAMBI I TEST COMPLETATI CON SUCCESSO!\n');
      log(colors.yellow, '⚠️  NOTA: Piano Resend free consente solo 2-3 email/giorno');
      log(colors.yellow, '   Per testare tutti gli 8 template, considera upgrade del piano\n');
    } else {
      log(colors.bright + colors.yellow, '⚠️  ALCUNI TEST SONO FALLITI\n');
    }
  } catch (error: any) {
    log(colors.bright + colors.red, `\n❌ ERRORE GENERALE: ${error.message}\n`);
    console.error(error);
    process.exit(1);
  }
}

// Esegui test
testTemplatedEmails()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log(colors.bright + colors.red, `\n❌ ERRORE FATALE: ${error.message}\n`);
    console.error(error);
    process.exit(1);
  });
