/**
 * Test Script - Email IT
 * Invia tutti gli 8 template email in italiano a daniele.pelleri@gmail.com
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
  FirstWorkoutReminderEmailData,
  FirstWorkoutCompleteEmailData,
  WeeklyProgressEmailData,
  CycleCompleteEmailData,
  ReengagementEmailData,
  SettingsUpdateEmailData,
} from '../lib/services/email-templates';

const TEST_EMAIL = 'daniele.pelleri@gmail.com';
const TEST_USER_ID = 'test-user-12345';
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

async function testAllEmails() {
  log(colors.bright + colors.cyan, '\n🧪 TEST EMAIL ITALIANO - Tutti gli 8 template\n');
  log(colors.blue, `📧 Email di destinazione: ${TEST_EMAIL}`);
  log(colors.blue, `🇮🇹 Lingua: Italiano\n`);

  const results: { template: string; success: boolean; error?: string }[] = [];

  try {
    // ==========================================
    // 1. WELCOME EMAIL
    // ==========================================
    log(colors.yellow, '▶ 1/8 Invio Welcome Email...');
    try {
      const data: WelcomeEmailData = {
        firstName: 'Daniele',
        email: TEST_EMAIL,
      };
      const { subject, html } = emailTemplates.welcome(data, APP_URL, 'it');
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [TEST_EMAIL],
        subject,
        html,
      });
      results.push({ template: 'Welcome', success: true });
      log(colors.green, '✓ Welcome Email inviata\n');
    } catch (error: any) {
      results.push({ template: 'Welcome', success: false, error: error.message });
      log(colors.red, `✗ Errore Welcome: ${error.message}\n`);
    }
    await delay(2000);

    // ==========================================
    // 2. ONBOARDING COMPLETE EMAIL
    // ==========================================
    log(colors.yellow, '▶ 2/8 Invio Onboarding Complete Email...');
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
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [TEST_EMAIL],
        subject,
        html,
      });
      results.push({ template: 'Onboarding Complete', success: true });
      log(colors.green, '✓ Onboarding Complete Email inviata\n');
    } catch (error: any) {
      results.push({ template: 'Onboarding Complete', success: false, error: error.message });
      log(colors.red, `✗ Errore Onboarding Complete: ${error.message}\n`);
    }
    await delay(2000);

    // ==========================================
    // 3. FIRST WORKOUT REMINDER EMAIL
    // ==========================================
    log(colors.yellow, '▶ 3/8 Invio First Workout Reminder Email...');
    try {
      const data: FirstWorkoutReminderEmailData = {
        firstName: 'Daniele',
        workoutName: 'Push Day A',
        workoutType: 'Push',
        targetMuscles: ['Petto', 'Deltoidi', 'Tricipiti'],
        estimatedDuration: 60,
        workoutId: 'workout-test-123',
      };
      const { subject, html } = emailTemplates.firstWorkoutReminder(data, APP_URL, 'it');
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [TEST_EMAIL],
        subject,
        html,
      });
      results.push({ template: 'First Workout Reminder', success: true });
      log(colors.green, '✓ First Workout Reminder Email inviata\n');
    } catch (error: any) {
      results.push({ template: 'First Workout Reminder', success: false, error: error.message });
      log(colors.red, `✗ Errore First Workout Reminder: ${error.message}\n`);
    }
    await delay(2000);

    // ==========================================
    // 4. FIRST WORKOUT COMPLETE EMAIL
    // ==========================================
    log(colors.yellow, '▶ 4/8 Invio First Workout Complete Email...');
    try {
      const data: FirstWorkoutCompleteEmailData = {
        firstName: 'Daniele',
        totalVolume: 4250,
        duration: 3600,
        totalSets: 18,
        exercisesCompleted: 6,
      };
      const { subject, html } = emailTemplates.firstWorkoutComplete(data, APP_URL, 'it');
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [TEST_EMAIL],
        subject,
        html,
      });
      results.push({ template: 'First Workout Complete', success: true });
      log(colors.green, '✓ First Workout Complete Email inviata\n');
    } catch (error: any) {
      results.push({ template: 'First Workout Complete', success: false, error: error.message });
      log(colors.red, `✗ Errore First Workout Complete: ${error.message}\n`);
    }
    await delay(2000);

    // ==========================================
    // 5. WEEKLY PROGRESS EMAIL
    // ==========================================
    log(colors.yellow, '▶ 5/8 Invio Weekly Progress Email...');
    try {
      const data: WeeklyProgressEmailData = {
        firstName: 'Daniele',
        weekNumber: 3,
        workoutsCompleted: 5,
        totalVolume: 21250,
        muscleGroupsTrained: ['Petto', 'Dorso', 'Gambe', 'Deltoidi', 'Braccia'],
        currentCycleDay: 4,
        cycleTotalDays: 8,
      };
      const { subject, html } = emailTemplates.weeklyProgress(data, APP_URL, 'it');
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [TEST_EMAIL],
        subject,
        html,
      });
      results.push({ template: 'Weekly Progress', success: true });
      log(colors.green, '✓ Weekly Progress Email inviata\n');
    } catch (error: any) {
      results.push({ template: 'Weekly Progress', success: false, error: error.message });
      log(colors.red, `✗ Errore Weekly Progress: ${error.message}\n`);
    }
    await delay(2000);

    // ==========================================
    // 6. CYCLE COMPLETE EMAIL
    // ==========================================
    log(colors.yellow, '▶ 6/8 Invio Cycle Complete Email...');
    try {
      const data: CycleCompleteEmailData = {
        firstName: 'Daniele',
        cycleNumber: 1,
        totalVolume: 42500,
        workoutsCompleted: 10,
        totalDuration: 36000,
        avgMentalReadiness: 4.2,
        volumeByMuscleGroup: {
          'Petto': 8500,
          'Dorso': 9200,
          'Gambe': 10800,
          'Deltoidi': 7200,
          'Braccia': 6800,
        },
      };
      const { subject, html } = emailTemplates.cycleComplete(data, APP_URL, 'it');
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [TEST_EMAIL],
        subject,
        html,
      });
      results.push({ template: 'Cycle Complete', success: true });
      log(colors.green, '✓ Cycle Complete Email inviata\n');
    } catch (error: any) {
      results.push({ template: 'Cycle Complete', success: false, error: error.message });
      log(colors.red, `✗ Errore Cycle Complete: ${error.message}\n`);
    }
    await delay(2000);

    // ==========================================
    // 7. RE-ENGAGEMENT EMAIL
    // ==========================================
    log(colors.yellow, '▶ 7/8 Invio Re-engagement Email...');
    try {
      const data: ReengagementEmailData = {
        firstName: 'Daniele',
        lastWorkoutType: 'Pull',
        daysSinceLastWorkout: 10,
        currentCycleDay: 6,
        nextWorkoutName: 'Legs Day A',
      };
      const { subject, html } = emailTemplates.reengagement(data, APP_URL, 'it');
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [TEST_EMAIL],
        subject,
        html,
      });
      results.push({ template: 'Re-engagement', success: true });
      log(colors.green, '✓ Re-engagement Email inviata\n');
    } catch (error: any) {
      results.push({ template: 'Re-engagement', success: false, error: error.message });
      log(colors.red, `✗ Errore Re-engagement: ${error.message}\n`);
    }
    await delay(2000);

    // ==========================================
    // 8. SETTINGS UPDATE EMAIL
    // ==========================================
    log(colors.yellow, '▶ 8/8 Invio Settings Update Email...');
    try {
      const data: SettingsUpdateEmailData = {
        firstName: 'Daniele',
        settingChanged: 'Split Type',
        oldValue: 'Push/Pull/Legs',
        newValue: 'Upper/Lower',
        impact: 'I tuoi workout verranno rigenerati con il nuovo split in 2 giorni',
      };
      const { subject, html } = emailTemplates.settingsUpdate(data, APP_URL, 'it');
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [TEST_EMAIL],
        subject,
        html,
      });
      results.push({ template: 'Settings Update', success: true });
      log(colors.green, '✓ Settings Update Email inviata\n');
    } catch (error: any) {
      results.push({ template: 'Settings Update', success: false, error: error.message });
      log(colors.red, `✗ Errore Settings Update: ${error.message}\n`);
    }

    // ==========================================
    // RIEPILOGO
    // ==========================================
    log(colors.bright + colors.cyan, '\n📊 RIEPILOGO TEST\n');
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    log(colors.green, `✓ Email inviate con successo: ${successful}/8`);
    if (failed > 0) {
      log(colors.red, `✗ Email fallite: ${failed}/8`);
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          log(colors.red, `  - ${r.template}: ${r.error}`);
        });
    }

    log(colors.bright + colors.blue, `\n📬 Controlla la inbox di ${TEST_EMAIL}\n`);

    if (successful === 8) {
      log(colors.bright + colors.green, '🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!\n');
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
testAllEmails()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log(colors.bright + colors.red, `\n❌ ERRORE FATALE: ${error.message}\n`);
    console.error(error);
    process.exit(1);
  });
