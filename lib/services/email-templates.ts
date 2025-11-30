/**
 * Email templates for ARVO onboarding and engagement campaigns
 * Supports Italian (IT) and English (EN) languages
 * Uses inline CSS for email client compatibility
 */

// Supported language types
export type SupportedLanguage = 'it' | 'en';

// Email data interfaces
export interface WelcomeEmailData {
  firstName: string;
  email: string;
}

export interface OnboardingCompleteEmailData {
  firstName: string;
  approachName: string;
  splitType: string;
  weeklyFrequency: number;
  weakPoints: string[];
  firstWorkoutId: string;
}

export interface FirstWorkoutReminderEmailData {
  firstName: string;
  workoutName: string;
  workoutType: string;
  targetMuscles: string[];
  estimatedDuration: number;
  workoutId: string;
}

export interface FirstWorkoutCompleteEmailData {
  firstName: string;
  totalVolume: number;
  duration: number;
  totalSets: number;
  exercisesCompleted: number;
}

export interface WeeklyProgressEmailData {
  firstName: string;
  weekNumber: number;
  workoutsCompleted: number;
  totalVolume: number;
  muscleGroupsTrained: string[];
  currentCycleDay: number;
  cycleTotalDays: number;
}

export interface CycleCompleteEmailData {
  firstName: string;
  cycleNumber: number;
  totalVolume: number;
  workoutsCompleted: number;
  totalDuration: number;
  avgMentalReadiness: number;
  volumeByMuscleGroup: Record<string, number>;
}

export interface ReengagementEmailData {
  firstName: string;
  lastWorkoutType: string;
  daysSinceLastWorkout: number;
  currentCycleDay: number;
  nextWorkoutName: string;
}

export interface SettingsUpdateEmailData {
  firstName: string;
  settingChanged: string;
  oldValue: string;
  newValue: string;
  impact: string;
}

// New engagement email interfaces
export interface PRDigestEmailData {
  firstName: string;
  prs: Array<{
    exerciseName: string;
    weight: number;
    reps: number;
    e1rm: number;
    previousE1rm: number;
    improvementPercent: number;
  }>;
  date: string;
}

export interface MilestoneEmailData {
  firstName: string;
  milestoneType: 'workout_count' | 'time_based';
  value: number;
  unit: 'workouts' | 'months';
  totalVolume?: number;
  favoriteExercise?: string;
  totalWorkouts?: number;
}

export interface PlateauEmailData {
  firstName: string;
  exerciseName: string;
  currentE1rm: number;
  weeksStuck: number;
}

// Helper function to get localized split type names
const getSplitTypeName = (splitType: string, lang: SupportedLanguage): string => {
  const names: Record<string, Record<SupportedLanguage, string>> = {
    push_pull_legs: { it: 'Push/Pull/Legs', en: 'Push/Pull/Legs' },
    upper_lower: { it: 'Upper/Lower', en: 'Upper/Lower' },
    full_body: { it: 'Full Body', en: 'Full Body' },
    bro_split: { it: 'Bro Split', en: 'Bro Split' },
    weak_point_focus: { it: 'Focus Punti Deboli', en: 'Weak Point Focus' },
    custom: { it: 'Personalizzato', en: 'Custom' },
  };
  return names[splitType]?.[lang] || splitType;
};

// Email templates class
export const emailTemplates = {
  /**
   * Email 1: Welcome & Onboarding Start
   */
  welcome(data: WelcomeEmailData, appUrl: string, lang: SupportedLanguage = 'en'): { subject: string; html: string } {
    const content = {
      it: {
        subject: '🎉 Benvenuto in ARVO - Il Tuo AI Personal Trainer',
        greeting: `Benvenuto in ARVO, ${data.firstName}!`,
        intro: 'Sei pronto a trasformare il tuo allenamento con l\'intelligenza artificiale?',
        p1: 'ARVO non è solo un\'app di allenamento - è il tuo personal trainer AI che si adatta al tuo corpo, ai tuoi obiettivi e al tuo stile di vita.',
        whatNext: 'Cosa Succede Ora',
        step1Title: '📝 Completa il tuo profilo',
        step1Desc: 'Raccontaci i tuoi obiettivi, esperienza e preferenze di allenamento.',
        step2Title: '🎯 Scegli il tuo approccio',
        step2Desc: 'Seleziona tra metodologie comprovate come Kuba Method, Renaissance Periodization, e altro.',
        step3Title: '💪 Inizia ad allenarti',
        step3Desc: 'Ricevi workout personalizzati che evolvono con i tuoi progressi.',
        whyArvo: 'Perché ARVO è Diverso',
        feature1Title: 'Coaching AI in Tempo Reale',
        feature1Desc: 'Consigli durante l\'allenamento basati sulla tua performance.',
        feature2Title: 'Periodizzazione Intelligente',
        feature2Desc: 'Cicli di allenamento che si adattano al tuo recupero e energia.',
        feature3Title: 'Progressione Basata sui Dati',
        feature3Desc: 'Ogni set è ottimizzato per i tuoi guadagni di forza e muscolo.',
        ctaButton: 'Inizia il Tuo Viaggio',
        footerText: 'Sei pronto a vedere cosa può fare l\'AI per il tuo fisico?',
        teamSignature: 'A presto,<br><strong>Team ARVO</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
      en: {
        subject: '🎉 Welcome to ARVO - Your AI Personal Trainer',
        greeting: `Welcome to ARVO, ${data.firstName}!`,
        intro: 'Ready to transform your training with artificial intelligence?',
        p1: 'ARVO isn\'t just a workout app - it\'s your AI personal trainer that adapts to your body, goals, and lifestyle.',
        whatNext: 'What Happens Next',
        step1Title: '📝 Complete your profile',
        step1Desc: 'Tell us about your goals, experience, and training preferences.',
        step2Title: '🎯 Choose your approach',
        step2Desc: 'Select from proven methodologies like Kuba Method, Renaissance Periodization, and more.',
        step3Title: '💪 Start training',
        step3Desc: 'Get personalized workouts that evolve with your progress.',
        whyArvo: 'Why ARVO is Different',
        feature1Title: 'Real-Time AI Coaching',
        feature1Desc: 'In-workout guidance based on your performance.',
        feature2Title: 'Intelligent Periodization',
        feature2Desc: 'Training cycles that adapt to your recovery and energy.',
        feature3Title: 'Data-Driven Progression',
        feature3Desc: 'Every set optimized for your strength and muscle gains.',
        ctaButton: 'Start Your Journey',
        footerText: 'Ready to see what AI can do for your physique?',
        teamSignature: 'See you soon,<br><strong>ARVO Team</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
    };

    const t = content[lang];

    return {
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">ARVO</h1>
                      <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">AI Personal Trainer</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">${t.greeting}</h2>
                      <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">${t.intro}</p>
                      <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">${t.p1}</p>

                      <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px;">${t.whatNext}</h3>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea;">
                            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 16px; font-weight: bold;">${t.step1Title}</p>
                            <p style="margin: 0; color: #4a4a4a; font-size: 14px;">${t.step1Desc}</p>
                          </td>
                        </tr>
                        <tr><td style="height: 15px;"></td></tr>
                        <tr>
                          <td style="padding: 20px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea;">
                            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 16px; font-weight: bold;">${t.step2Title}</p>
                            <p style="margin: 0; color: #4a4a4a; font-size: 14px;">${t.step2Desc}</p>
                          </td>
                        </tr>
                        <tr><td style="height: 15px;"></td></tr>
                        <tr>
                          <td style="padding: 20px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea;">
                            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 16px; font-weight: bold;">${t.step3Title}</p>
                            <p style="margin: 0; color: #4a4a4a; font-size: 14px;">${t.step3Desc}</p>
                          </td>
                        </tr>
                      </table>

                      <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px;">${t.whyArvo}</h3>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                        <tr>
                          <td width="50%" style="padding-right: 10px; vertical-align: top;">
                            <p style="margin: 0 0 8px 0; color: #667eea; font-size: 16px; font-weight: bold;">${t.feature1Title}</p>
                            <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.5;">${t.feature1Desc}</p>
                          </td>
                          <td width="50%" style="padding-left: 10px; vertical-align: top;">
                            <p style="margin: 0 0 8px 0; color: #667eea; font-size: 16px; font-weight: bold;">${t.feature2Title}</p>
                            <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.5;">${t.feature2Desc}</p>
                          </td>
                        </tr>
                        <tr><td colspan="2" style="height: 20px;"></td></tr>
                        <tr>
                          <td colspan="2" style="padding: 0;">
                            <p style="margin: 0 0 8px 0; color: #667eea; font-size: 16px; font-weight: bold;">${t.feature3Title}</p>
                            <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.5;">${t.feature3Desc}</p>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${appUrl}/onboarding" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; margin: 20px 0;">${t.ctaButton}</a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 16px; line-height: 1.6; text-align: center;">${t.footerText}</p>
                      <p style="margin: 20px 0 0 0; color: #4a4a4a; font-size: 16px; text-align: center;">${t.teamSignature}</p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">${t.tagline}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  },

  /**
   * Email 2: Onboarding Completion Celebration
   */
  onboardingComplete(
    data: OnboardingCompleteEmailData,
    appUrl: string,
    lang: SupportedLanguage = 'en'
  ): { subject: string; html: string } {
    const content = {
      it: {
        subject: '🎯 Il Tuo Piano ARVO è Pronto!',
        greeting: `Ottimo lavoro, ${data.firstName}!`,
        intro: 'Hai completato il setup. Il tuo piano di allenamento personalizzato è pronto!',
        planSummary: 'Riepilogo del Tuo Piano',
        approach: 'Approccio',
        splitType: 'Tipo di Split',
        frequency: 'Frequenza Settimanale',
        weakPoints: 'Focus Punti Deboli',
        workoutsPerWeek: 'workout/settimana',
        firstWorkout: 'Il Tuo Primo Workout',
        readyToStart: 'Sei pronto a iniziare il tuo primo allenamento.',
        ctaButton: 'Inizia il Primo Workout',
        whatToExpect: 'Cosa Aspettarsi',
        expect1: 'Coaching AI in tempo reale durante ogni set',
        expect2: 'Progressione automatica basata sulla tua performance',
        expect3: 'Adattamento intelligente al tuo recupero',
        protip: 'Pro Tip',
        protipText: 'Tieni il telefono vicino durante l\'allenamento per ricevere consigli vocali AI tra i set!',
        teamSignature: 'Let\'s go! 💪<br><strong>Team ARVO</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
      en: {
        subject: '🎯 Your ARVO Plan is Ready!',
        greeting: `Great work, ${data.firstName}!`,
        intro: 'You\'ve completed setup. Your personalized training plan is ready!',
        planSummary: 'Your Plan Summary',
        approach: 'Approach',
        splitType: 'Split Type',
        frequency: 'Weekly Frequency',
        weakPoints: 'Weak Point Focus',
        workoutsPerWeek: 'workouts/week',
        firstWorkout: 'Your First Workout',
        readyToStart: 'You\'re ready to start your first training session.',
        ctaButton: 'Start First Workout',
        whatToExpect: 'What to Expect',
        expect1: 'Real-time AI coaching during every set',
        expect2: 'Automatic progression based on your performance',
        expect3: 'Intelligent adaptation to your recovery',
        protip: 'Pro Tip',
        protipText: 'Keep your phone nearby during workouts to receive AI voice guidance between sets!',
        teamSignature: 'Let\'s go! 💪<br><strong>ARVO Team</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
    };

    const t = content[lang];
    const splitTypeName = getSplitTypeName(data.splitType, lang);
    const weakPointsList = data.weakPoints.length > 0 ? data.weakPoints.join(', ') : (lang === 'it' ? 'Nessuno' : 'None');

    return {
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">ARVO</h1>
                      <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">AI Personal Trainer</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">${t.greeting}</h2>
                      <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">${t.intro}</p>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0; background-color: #f8f9fa; border-radius: 8px; padding: 25px;">
                        <tr>
                          <td>
                            <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px;">${t.planSummary}</h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 10px 0;">
                                  <span style="color: #667eea; font-weight: bold;">${t.approach}:</span>
                                  <span style="color: #1a1a1a; margin-left: 10px;">${data.approachName}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0;">
                                  <span style="color: #667eea; font-weight: bold;">${t.splitType}:</span>
                                  <span style="color: #1a1a1a; margin-left: 10px;">${splitTypeName}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0;">
                                  <span style="color: #667eea; font-weight: bold;">${t.frequency}:</span>
                                  <span style="color: #1a1a1a; margin-left: 10px;">${data.weeklyFrequency} ${t.workoutsPerWeek}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0;">
                                  <span style="color: #667eea; font-weight: bold;">${t.weakPoints}:</span>
                                  <span style="color: #1a1a1a; margin-left: 10px;">${weakPointsList}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 20px;">${t.firstWorkout}</h3>
                      <p style="margin: 0 0 25px 0; color: #4a4a4a; font-size: 16px;">${t.readyToStart}</p>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${appUrl}/workout/${data.firstWorkoutId}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; margin: 20px 0;">${t.ctaButton}</a>
                          </td>
                        </tr>
                      </table>

                      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">${t.whatToExpect}</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                        <li>${t.expect1}</li>
                        <li>${t.expect2}</li>
                        <li>${t.expect3}</li>
                      </ul>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0; background-color: #fff3cd; border-radius: 6px; padding: 20px; border-left: 4px solid #ffc107;">
                        <tr>
                          <td>
                            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-weight: bold;">💡 ${t.protip}</p>
                            <p style="margin: 0; color: #4a4a4a; font-size: 14px;">${t.protipText}</p>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 16px; text-align: center;">${t.teamSignature}</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">${t.tagline}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  },

  // Continue with remaining 6 templates...
  // (Due to response length limits, I'll create the file in multiple parts)

  /**
   * Email 3: First Workout Reminder
   */
  firstWorkoutReminder(
    data: FirstWorkoutReminderEmailData,
    appUrl: string,
    lang: SupportedLanguage = 'en'
  ): { subject: string; html: string } {
    const content = {
      it: {
        subject: '⏰ Il Tuo Primo Workout Ti Aspetta!',
        greeting: `Ciao ${data.firstName},`,
        intro: 'Hai creato il tuo piano di allenamento 24 ore fa, ma non hai ancora iniziato il tuo primo workout.',
        motivation: 'Il primo passo è sempre il più difficile, ma è anche il più importante. Il tuo corpo è pronto - andiamo! 💪',
        workoutReady: 'Il Tuo Workout è Pronto',
        workoutName: 'Nome Workout',
        workoutType: 'Tipo',
        targetMuscles: 'Muscoli Target',
        duration: 'Durata Stimata',
        minutes: 'minuti',
        ctaButton: 'Inizia Ora',
        whyStart: 'Perché Iniziare Oggi',
        reason1: 'Il momento migliore per iniziare è adesso',
        reason2: 'Ogni giorno che aspetti è un giorno di progressi persi',
        reason3: 'L\'AI ARVO si adatta meglio quando hai dati di allenamento',
        teamSignature: 'Ti aspettiamo in palestra! 💪<br><strong>Team ARVO</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
      en: {
        subject: '⏰ Your First Workout is Waiting!',
        greeting: `Hey ${data.firstName},`,
        intro: 'You created your training plan 24 hours ago, but haven\'t started your first workout yet.',
        motivation: 'The first step is always the hardest, but it\'s also the most important. Your body is ready - let\'s go! 💪',
        workoutReady: 'Your Workout is Ready',
        workoutName: 'Workout Name',
        workoutType: 'Type',
        targetMuscles: 'Target Muscles',
        duration: 'Estimated Duration',
        minutes: 'minutes',
        ctaButton: 'Start Now',
        whyStart: 'Why Start Today',
        reason1: 'The best time to start is now',
        reason2: 'Every day you wait is a day of progress lost',
        reason3: 'ARVO AI adapts better when you have training data',
        teamSignature: 'See you in the gym! 💪<br><strong>ARVO Team</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
    };

    const t = content[lang];
    const muscleList = data.targetMuscles.join(', ');

    return {
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">ARVO</h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">${t.greeting}</h2>
                      <p style="margin: 0 0 15px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">${t.intro}</p>
                      <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">${t.motivation}</p>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0; background-color: #f8f9fa; border-radius: 8px; padding: 25px;">
                        <tr>
                          <td>
                            <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px;">${t.workoutReady}</h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 10px 0;">
                                  <span style="color: #667eea; font-weight: bold;">${t.workoutName}:</span>
                                  <span style="color: #1a1a1a; margin-left: 10px;">${data.workoutName}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0;">
                                  <span style="color: #667eea; font-weight: bold;">${t.workoutType}:</span>
                                  <span style="color: #1a1a1a; margin-left: 10px;">${data.workoutType}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0;">
                                  <span style="color: #667eea; font-weight: bold;">${t.targetMuscles}:</span>
                                  <span style="color: #1a1a1a; margin-left: 10px;">${muscleList}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0;">
                                  <span style="color: #667eea; font-weight: bold;">${t.duration}:</span>
                                  <span style="color: #1a1a1a; margin-left: 10px;">${data.estimatedDuration} ${t.minutes}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${appUrl}/workout/${data.workoutId}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; margin: 20px 0;">${t.ctaButton}</a>
                          </td>
                        </tr>
                      </table>

                      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">${t.whyStart}</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                        <li>${t.reason1}</li>
                        <li>${t.reason2}</li>
                        <li>${t.reason3}</li>
                      </ul>

                      <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 16px; text-align: center;">${t.teamSignature}</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">${t.tagline}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  },

  /**
   * Email 4: First Workout Complete Celebration
   */
  firstWorkoutComplete(
    data: FirstWorkoutCompleteEmailData,
    appUrl: string,
    lang: SupportedLanguage = 'en'
  ): { subject: string; html: string } {
    const content = {
      it: {
        subject: '🎉 Primo Workout Completato!',
        greeting: `Incredibile, ${data.firstName}!`,
        intro: 'Hai completato il tuo primo workout ARVO. Questo è solo l\'inizio!',
        stats: 'Le Tue Statistiche',
        volume: 'Volume Totale',
        duration: 'Durata',
        sets: 'Set Completati',
        exercises: 'Esercizi',
        minutes: 'minuti',
        kg: 'kg',
        whatNext: 'Cosa Succede Ora',
        adapt: 'L\'AI ARVO analizzerà la tua performance per adattare i prossimi workout',
        progress: 'Continua ad allenarti regolarmente per vedere progressi costanti',
        data: 'Più dati raccogli, più intelligente diventa il tuo piano',
        ctaButton: 'Vedi il Prossimo Workout',
        teamSignature: 'Ottimo lavoro! 💪<br><strong>Team ARVO</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
      en: {
        subject: '🎉 First Workout Complete!',
        greeting: `Incredible, ${data.firstName}!`,
        intro: 'You\'ve completed your first ARVO workout. This is just the beginning!',
        stats: 'Your Stats',
        volume: 'Total Volume',
        duration: 'Duration',
        sets: 'Sets Completed',
        exercises: 'Exercises',
        minutes: 'minutes',
        kg: 'kg',
        whatNext: 'What Happens Next',
        adapt: 'ARVO AI will analyze your performance to adapt future workouts',
        progress: 'Keep training regularly to see consistent progress',
        data: 'The more data you collect, the smarter your plan becomes',
        ctaButton: 'See Next Workout',
        teamSignature: 'Great work! 💪<br><strong>ARVO Team</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
    };

    const t = content[lang];
    const durationMin = Math.round(data.duration / 60);

    return {
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px;">ARVO</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">${t.greeting}</h2>
                      <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px;">${t.intro}</p>
                      <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px;">${t.stats}</h3>
                      <table width="100%" style="background-color: #f8f9fa; border-radius: 8px; padding: 25px;">
                        <tr>
                          <td width="50%"><span style="color: #667eea; font-weight: bold;">${t.volume}:</span> ${data.totalVolume} ${t.kg}</td>
                          <td width="50%"><span style="color: #667eea; font-weight: bold;">${t.duration}:</span> ${durationMin} ${t.minutes}</td>
                        </tr>
                        <tr><td colspan="2" style="height: 15px;"></td></tr>
                        <tr>
                          <td width="50%"><span style="color: #667eea; font-weight: bold;">${t.sets}:</span> ${data.totalSets}</td>
                          <td width="50%"><span style="color: #667eea; font-weight: bold;">${t.exercises}:</span> ${data.exercisesCompleted}</td>
                        </tr>
                      </table>
                      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">${t.whatNext}</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                        <li>${t.adapt}</li>
                        <li>${t.progress}</li>
                        <li>${t.data}</li>
                      </ul>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${appUrl}/workouts" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; margin: 20px 0;">${t.ctaButton}</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 16px; text-align: center;">${t.teamSignature}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">${t.tagline}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  },

  /**
   * Email 5: Weekly Progress Update
   */
  weeklyProgress(
    data: WeeklyProgressEmailData,
    appUrl: string,
    lang: SupportedLanguage = 'en'
  ): { subject: string; html: string } {
    const content = {
      it: {
        subject: `📊 Settimana ${data.weekNumber} - Il Tuo Progresso ARVO`,
        greeting: `Ottimo lavoro questa settimana, ${data.firstName}!`,
        intro: 'Ecco un riepilogo del tuo progresso degli ultimi 7 giorni.',
        weekStats: 'Statistiche Settimanali',
        workouts: 'Workout Completati',
        volume: 'Volume Totale',
        muscles: 'Gruppi Muscolari Allenati',
        cycleProgress: 'Progresso del Ciclo',
        currentDay: 'Giorno Corrente',
        of: 'di',
        keepGoing: 'Continua Così!',
        consistency: 'La costanza è la chiave per risultati duraturi',
        ctaButton: 'Vedi Dashboard Progressi',
        teamSignature: 'Continua a spaccare! 💪<br><strong>Team ARVO</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
      en: {
        subject: `📊 Week ${data.weekNumber} - Your ARVO Progress`,
        greeting: `Great work this week, ${data.firstName}!`,
        intro: 'Here\'s a summary of your progress over the last 7 days.',
        weekStats: 'Weekly Stats',
        workouts: 'Workouts Completed',
        volume: 'Total Volume',
        muscles: 'Muscle Groups Trained',
        cycleProgress: 'Cycle Progress',
        currentDay: 'Current Day',
        of: 'of',
        keepGoing: 'Keep Going!',
        consistency: 'Consistency is the key to lasting results',
        ctaButton: 'View Progress Dashboard',
        teamSignature: 'Keep crushing it! 💪<br><strong>ARVO Team</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
    };

    const t = content[lang];

    return {
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px;">ARVO</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">${t.greeting}</h2>
                      <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px;">${t.intro}</p>
                      <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px;">${t.weekStats}</h3>
                      <table width="100%" style="background-color: #f8f9fa; border-radius: 8px; padding: 25px;">
                        <tr>
                          <td><span style="color: #667eea; font-weight: bold;">${t.workouts}:</span> ${data.workoutsCompleted}</td>
                        </tr>
                        <tr><td style="height: 15px;"></td></tr>
                        <tr>
                          <td><span style="color: #667eea; font-weight: bold;">${t.volume}:</span> ${data.totalVolume} kg</td>
                        </tr>
                        <tr><td style="height: 15px;"></td></tr>
                        <tr>
                          <td><span style="color: #667eea; font-weight: bold;">${t.muscles}:</span> ${data.muscleGroupsTrained.join(', ')}</td>
                        </tr>
                      </table>
                      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">${t.cycleProgress}</h3>
                      <p style="color: #4a4a4a;"><span style="color: #667eea; font-weight: bold;">${t.currentDay}:</span> ${data.currentCycleDay} ${t.of} ${data.cycleTotalDays}</p>
                      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">${t.keepGoing}</h3>
                      <p style="color: #4a4a4a; font-size: 15px;">${t.consistency}</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${appUrl}/progress" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; margin: 20px 0;">${t.ctaButton}</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 16px; text-align: center;">${t.teamSignature}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">${t.tagline}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  },

  /**
   * Email 6: First Cycle Completion Milestone
   */
  cycleComplete(
    data: CycleCompleteEmailData,
    appUrl: string,
    lang: SupportedLanguage = 'en'
  ): { subject: string; html: string } {
    const content = {
      it: {
        subject: `🏆 Ciclo ${data.cycleNumber} Completato!`,
        greeting: `Incredibile, ${data.firstName}!`,
        intro: `Hai completato il Ciclo ${data.cycleNumber}. Questo è un traguardo importante!`,
        cycleStats: 'Statistiche del Ciclo',
        workouts: 'Workout Completati',
        volume: 'Volume Totale',
        duration: 'Tempo Totale',
        readiness: 'Mental Readiness Media',
        volumeByMuscle: 'Volume per Gruppo Muscolare',
        whatNext: 'Prossimi Passi',
        deload: 'Il prossimo ciclo potrebbe includere una settimana di deload per il recupero',
        progression: 'L\'AI ARVO aggiornerà i tuoi carichi in base ai progressi',
        ctaButton: 'Inizia il Prossimo Ciclo',
        teamSignature: 'Risultati straordinari! 🏆<br><strong>Team ARVO</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
      en: {
        subject: `🏆 Cycle ${data.cycleNumber} Complete!`,
        greeting: `Incredible, ${data.firstName}!`,
        intro: `You\'ve completed Cycle ${data.cycleNumber}. This is a major milestone!`,
        cycleStats: 'Cycle Stats',
        workouts: 'Workouts Completed',
        volume: 'Total Volume',
        duration: 'Total Time',
        readiness: 'Avg Mental Readiness',
        volumeByMuscle: 'Volume by Muscle Group',
        whatNext: 'Next Steps',
        deload: 'Your next cycle may include a deload week for recovery',
        progression: 'ARVO AI will update your loads based on progress',
        ctaButton: 'Start Next Cycle',
        teamSignature: 'Amazing results! 🏆<br><strong>ARVO Team</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
    };

    const t = content[lang];
    const durationHours = Math.round(data.totalDuration / 3600);

    return {
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px;">ARVO</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">${t.greeting}</h2>
                      <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px;">${t.intro}</p>
                      <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px;">${t.cycleStats}</h3>
                      <table width="100%" style="background-color: #f8f9fa; border-radius: 8px; padding: 25px;">
                        <tr>
                          <td width="50%"><span style="color: #667eea; font-weight: bold;">${t.workouts}:</span> ${data.workoutsCompleted}</td>
                          <td width="50%"><span style="color: #667eea; font-weight: bold;">${t.volume}:</span> ${data.totalVolume} kg</td>
                        </tr>
                        <tr><td colspan="2" style="height: 15px;"></td></tr>
                        <tr>
                          <td width="50%"><span style="color: #667eea; font-weight: bold;">${t.duration}:</span> ${durationHours}h</td>
                          <td width="50%"><span style="color: #667eea; font-weight: bold;">${t.readiness}:</span> ${data.avgMentalReadiness}/5</td>
                        </tr>
                      </table>
                      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">${t.whatNext}</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                        <li>${t.deload}</li>
                        <li>${t.progression}</li>
                      </ul>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${appUrl}/workouts" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; margin: 20px 0;">${t.ctaButton}</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 16px; text-align: center;">${t.teamSignature}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">${t.tagline}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  },

  /**
   * Email 7: Re-engagement (inactive for 7+ days)
   */
  reengagement(
    data: ReengagementEmailData,
    appUrl: string,
    lang: SupportedLanguage = 'en'
  ): { subject: string; html: string } {
    const content = {
      it: {
        subject: `💪 Il tuo prossimo workout ti aspetta, ${data.firstName}`,
        greeting: `Ciao ${data.firstName},`,
        intro: `Sono passati ${data.daysSinceLastWorkout} giorni dal tuo ultimo allenamento. La vita è impegnata — lo capiamo.`,
        goodNews: 'La buona notizia? Il tuo piano di allenamento è esattamente dove l\'hai lasciato.',
        nextWorkout: 'Il tuo prossimo workout',
        ctaButton: 'Riprendi da dove eri',
        noPressure: 'Nessuna pressione. Quando sei pronto, saremo qui.',
        signature: '<strong>Daniele</strong><br><span style="color: #666;">Founder, Arvo</span>',
        tagline: 'Arvo - AI Personal Trainer for Serious Lifters',
      },
      en: {
        subject: `💪 Your next workout is ready, ${data.firstName}`,
        greeting: `Hey ${data.firstName},`,
        intro: `It's been ${data.daysSinceLastWorkout} days since your last session. Life gets busy — we get it.`,
        goodNews: 'The good news? Your training plan is exactly where you left it.',
        nextWorkout: 'Your next workout',
        ctaButton: 'Jump Back In',
        noPressure: 'No pressure. Whenever you\'re ready, we\'ll be here.',
        signature: '<strong>Daniele</strong><br><span style="color: #666;">Founder, Arvo</span>',
        tagline: 'Arvo - AI Personal Trainer for Serious Lifters',
      },
    };

    const t = content[lang];

    return {
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">${t.greeting}</p>

                      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">${t.intro}</p>

                      <p style="margin: 0 0 30px 0; color: #333; font-size: 16px; line-height: 1.6;">${t.goodNews}</p>

                      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; font-weight: 600;">${t.nextWorkout}:</p>
                        <p style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">${data.nextWorkoutName}</p>
                      </div>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">${t.ctaButton}</a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0 0; color: #666; font-size: 15px; text-align: center; font-style: italic;">${t.noPressure}</p>

                      <p style="margin: 30px 0 0 0; color: #333; font-size: 16px; line-height: 1.6;">${t.signature}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; border-top: 1px solid #eee; text-align: center;">
                      <p style="margin: 0; color: #999; font-size: 12px;">${t.tagline}<br><a href="https://arvo.guru" style="color: #999;">arvo.guru</a></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  },

  /**
   * Email 8: Settings Update Confirmation
   */
  settingsUpdate(
    data: SettingsUpdateEmailData,
    appUrl: string,
    lang: SupportedLanguage = 'en'
  ): { subject: string; html: string } {
    const content = {
      it: {
        subject: '⚙️ Impostazioni ARVO Aggiornate',
        greeting: `Ciao ${data.firstName},`,
        intro: 'Le tue impostazioni ARVO sono state aggiornate con successo.',
        changeDetails: 'Dettagli della Modifica',
        setting: 'Impostazione',
        oldValue: 'Valore Precedente',
        newValue: 'Nuovo Valore',
        impact: 'Impatto',
        notYou: 'Non sei stato tu?',
        security: 'Se non hai effettuato questa modifica, aggiorna immediatamente la tua password.',
        ctaButton: 'Vedi Impostazioni',
        teamSignature: 'Buon allenamento! 💪<br><strong>Team ARVO</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
      en: {
        subject: '⚙️ ARVO Settings Updated',
        greeting: `Hey ${data.firstName},`,
        intro: 'Your ARVO settings have been updated successfully.',
        changeDetails: 'Change Details',
        setting: 'Setting',
        oldValue: 'Previous Value',
        newValue: 'New Value',
        impact: 'Impact',
        notYou: 'Wasn\'t you?',
        security: 'If you didn\'t make this change, update your password immediately.',
        ctaButton: 'View Settings',
        teamSignature: 'Happy training! 💪<br><strong>ARVO Team</strong>',
        tagline: 'ARVO - AI Personal Trainer for Serious Lifters',
      },
    };

    const t = content[lang];

    return {
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px;">ARVO</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">${t.greeting}</h2>
                      <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px;">${t.intro}</p>
                      <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px;">${t.changeDetails}</h3>
                      <table width="100%" style="background-color: #f8f9fa; border-radius: 8px; padding: 25px;">
                        <tr>
                          <td><span style="color: #667eea; font-weight: bold;">${t.setting}:</span> ${data.settingChanged}</td>
                        </tr>
                        <tr><td style="height: 15px;"></td></tr>
                        <tr>
                          <td><span style="color: #667eea; font-weight: bold;">${t.oldValue}:</span> ${data.oldValue}</td>
                        </tr>
                        <tr><td style="height: 15px;"></td></tr>
                        <tr>
                          <td><span style="color: #667eea; font-weight: bold;">${t.newValue}:</span> ${data.newValue}</td>
                        </tr>
                        <tr><td style="height: 15px;"></td></tr>
                        <tr>
                          <td><span style="color: #667eea; font-weight: bold;">${t.impact}:</span> ${data.impact}</td>
                        </tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0; background-color: #fff3cd; border-radius: 6px; padding: 20px; border-left: 4px solid #ffc107;">
                        <tr>
                          <td>
                            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-weight: bold;">⚠️ ${t.notYou}</p>
                            <p style="margin: 0; color: #4a4a4a; font-size: 14px;">${t.security}</p>
                          </td>
                        </tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${appUrl}/settings" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; margin: 20px 0;">${t.ctaButton}</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 16px; text-align: center;">${t.teamSignature}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">${t.tagline}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  },

  /**
   * Email 9: PR Celebration (Daily Digest)
   */
  prCelebration(
    data: PRDigestEmailData,
    appUrl: string,
    lang: SupportedLanguage = 'en'
  ): { subject: string; html: string } {
    const content = {
      it: {
        subject: `🏆 Oggi ti sei superato, ${data.firstName}!`,
        greeting: `Ciao ${data.firstName},`,
        intro: `Hai battuto ${data.prs.length} record personale${data.prs.length > 1 ? 'i' : ''} oggi! Ecco cosa hai raggiunto:`,
        prLabel: 'Nuovo E1RM',
        improvement: 'miglioramento',
        outro: 'Continua così — ogni rep conta.',
        signature: '<strong>Daniele</strong><br><span style="color: #666;">Founder, Arvo</span>',
        tagline: 'Arvo - AI Personal Trainer for Serious Lifters',
      },
      en: {
        subject: `🏆 You crushed it today, ${data.firstName}!`,
        greeting: `Hey ${data.firstName},`,
        intro: `You hit ${data.prs.length} personal record${data.prs.length > 1 ? 's' : ''} today! Here's what you achieved:`,
        prLabel: 'New E1RM',
        improvement: 'improvement',
        outro: 'Keep pushing — every rep counts.',
        signature: '<strong>Daniele</strong><br><span style="color: #666;">Founder, Arvo</span>',
        tagline: 'Arvo - AI Personal Trainer for Serious Lifters',
      },
    };

    const t = content[lang];

    const prsHtml = data.prs.map(pr => `
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #22c55e;">
        <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">✅ ${pr.exerciseName}</p>
        <p style="margin: 0; color: #333; font-size: 14px;">${pr.weight}kg × ${pr.reps} reps</p>
        <p style="margin: 4px 0 0 0; color: #16a34a; font-size: 14px; font-weight: 500;">→ ${t.prLabel}: ${pr.e1rm}kg (+${pr.improvementPercent}% ${t.improvement})</p>
      </div>
    `).join('');

    return {
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">${t.greeting}</p>
                      <p style="margin: 0 0 24px 0; color: #333; font-size: 16px; line-height: 1.6;">${t.intro}</p>

                      ${prsHtml}

                      <p style="margin: 24px 0 0 0; color: #333; font-size: 16px; line-height: 1.6;">${t.outro}</p>
                      <p style="margin: 24px 0 0 0; color: #333; font-size: 16px; line-height: 1.6;">${t.signature}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; border-top: 1px solid #eee; text-align: center;">
                      <p style="margin: 0; color: #999; font-size: 12px;">${t.tagline}<br><a href="https://arvo.guru" style="color: #999;">arvo.guru</a></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  },

  /**
   * Email 10: Milestone Celebration
   */
  milestone(
    data: MilestoneEmailData,
    appUrl: string,
    lang: SupportedLanguage = 'en'
  ): { subject: string; html: string } {
    // Workout count milestone content
    const workoutMilestones: Record<number, Record<SupportedLanguage, { subject: string; emoji: string; message: string; extra: string }>> = {
      10: {
        it: { subject: '🎯 10 workout completati', emoji: '🎯', message: 'Hai completato il tuo 10° workout! Questo è vero impegno.', extra: 'I primi 10 sono i più difficili. Ora hai costruito l\'abitudine.' },
        en: { subject: '🎯 10 workouts done', emoji: '🎯', message: 'You just completed your 10th workout! That\'s real commitment.', extra: 'The first 10 are the hardest. Now you\'ve built the habit.' },
      },
      25: {
        it: { subject: '💪 25 workout completati', emoji: '💪', message: 'Hai raggiunto 25 workout! Stai diventando una forza della natura.', extra: 'Un quarto di cento. La costanza paga sempre.' },
        en: { subject: '💪 25 workouts done', emoji: '💪', message: 'You\'ve hit 25 workouts! You\'re becoming a force of nature.', extra: 'A quarter of a hundred. Consistency always pays off.' },
      },
      50: {
        it: { subject: '🔥 50 workout completati', emoji: '🔥', message: '50 workout! Sei a metà strada verso i 100.', extra: 'Questo non è più un hobby — è uno stile di vita.' },
        en: { subject: '🔥 50 workouts done', emoji: '🔥', message: '50 workouts! You\'re halfway to 100.', extra: 'This isn\'t a hobby anymore — it\'s a lifestyle.' },
      },
      100: {
        it: { subject: '🏆 100 workout completati', emoji: '🏆', message: 'CENTO WORKOUT! Sei entrato nel Century Club.', extra: 'Questo traguardo appartiene solo ai più dedicati. Sei una leggenda.' },
        en: { subject: '🏆 100 workouts done', emoji: '🏆', message: 'ONE HUNDRED WORKOUTS! You\'ve entered the Century Club.', extra: 'This milestone belongs only to the most dedicated. You\'re a legend.' },
      },
    };

    // Time-based milestone content
    const timeMilestones: Record<number, Record<SupportedLanguage, { subject: string; emoji: string; message: string; extra: string }>> = {
      1: {
        it: { subject: '📅 1 mese con Arvo', emoji: '📅', message: 'Un mese insieme! Il primo mese è sempre il più importante.', extra: 'Hai gettato le fondamenta. Ora costruiamo sopra.' },
        en: { subject: '📅 1 month with Arvo', emoji: '📅', message: 'One month together! The first month is always the most important.', extra: 'You\'ve laid the foundation. Now let\'s build on it.' },
      },
      3: {
        it: { subject: '⭐ 3 mesi di allenamento', emoji: '⭐', message: 'Tre mesi di dedizione! Questo non è più una streak — è un cambiamento di vita.', extra: 'Il tuo corpo sta cambiando. Continua così.' },
        en: { subject: '⭐ 3 months strong', emoji: '⭐', message: 'Three months of dedication! This isn\'t a streak anymore — it\'s a lifestyle change.', extra: 'Your body is changing. Keep going.' },
      },
      6: {
        it: { subject: '🌟 6 mesi di progressi', emoji: '🌟', message: 'Sei mesi! Mezzo anno di lavoro duro e risultati.', extra: 'Guarda indietro a dove eri 6 mesi fa. Incredibile, vero?' },
        en: { subject: '🌟 6 months of progress', emoji: '🌟', message: 'Six months! Half a year of hard work and results.', extra: 'Look back at where you were 6 months ago. Incredible, right?' },
      },
      12: {
        it: { subject: '👑 1 anno con Arvo', emoji: '👑', message: 'UN ANNO INTERO! 365 giorni di dedizione al tuo corpo.', extra: 'Sei tra il top 1% delle persone che si allenano. Rispetto totale.' },
        en: { subject: '👑 1 year with Arvo', emoji: '👑', message: 'ONE FULL YEAR! 365 days of dedication to your body.', extra: 'You\'re in the top 1% of people who train. Total respect.' },
      },
    };

    const isWorkoutMilestone = data.milestoneType === 'workout_count';
    const milestoneData = isWorkoutMilestone
      ? workoutMilestones[data.value]?.[lang]
      : timeMilestones[data.value]?.[lang];

    if (!milestoneData) {
      return { subject: 'Milestone', html: '' };
    }

    const statsHtml = isWorkoutMilestone && data.totalVolume ? `
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">📊 ${lang === 'it' ? 'Le tue statistiche' : 'Your stats'}:</p>
        <p style="margin: 0; color: #333; font-size: 14px;">
          ${lang === 'it' ? 'Volume totale sollevato' : 'Total volume lifted'}: <strong>${Math.round(data.totalVolume / 1000)}t</strong>
          ${data.favoriteExercise ? `<br>${lang === 'it' ? 'Esercizio preferito' : 'Favorite exercise'}: <strong>${data.favoriteExercise}</strong>` : ''}
        </p>
      </div>
    ` : '';

    const content = {
      it: {
        greeting: `Ciao ${data.firstName},`,
        signature: '<strong>Daniele</strong><br><span style="color: #666;">Founder, Arvo</span>',
        tagline: 'Arvo - AI Personal Trainer for Serious Lifters',
      },
      en: {
        greeting: `Hey ${data.firstName},`,
        signature: '<strong>Daniele</strong><br><span style="color: #666;">Founder, Arvo</span>',
        tagline: 'Arvo - AI Personal Trainer for Serious Lifters',
      },
    };

    const t = content[lang];

    return {
      subject: `${milestoneData.emoji} ${milestoneData.subject}, ${data.firstName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0; font-size: 48px; text-align: center;">${milestoneData.emoji}</p>
                      <p style="margin: 20px 0; color: #333; font-size: 16px; line-height: 1.6;">${t.greeting}</p>
                      <p style="margin: 0 0 16px 0; color: #333; font-size: 18px; line-height: 1.6; font-weight: 600;">${milestoneData.message}</p>

                      ${statsHtml}

                      <p style="margin: 20px 0 0 0; color: #333; font-size: 16px; line-height: 1.6;">${milestoneData.extra}</p>
                      <p style="margin: 24px 0 0 0; color: #333; font-size: 16px; line-height: 1.6;">${t.signature}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; border-top: 1px solid #eee; text-align: center;">
                      <p style="margin: 0; color: #999; font-size: 12px;">${t.tagline}<br><a href="https://arvo.guru" style="color: #999;">arvo.guru</a></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  },

  /**
   * Email 11: Plateau Detection
   */
  plateauDetection(
    data: PlateauEmailData,
    appUrl: string,
    lang: SupportedLanguage = 'en'
  ): { subject: string; html: string } {
    const content = {
      it: {
        subject: `📊 Superiamo questo plateau, ${data.firstName}`,
        greeting: `Ciao ${data.firstName},`,
        intro: `Il tuo <strong>${data.exerciseName}</strong> è fermo a <strong>${data.currentE1rm}kg</strong> da ${data.weeksStuck} settimane.`,
        explanation: 'I plateau sono normali — significano che il corpo si è adattato. Ecco come superarlo:',
        tip1Title: 'Settimana di scarico',
        tip1Desc: 'Riduci il peso del 40%, concentrati sulla tecnica',
        tip2Title: 'Aggiungi variazione',
        tip2Desc: 'Pause rep, tempo work, presa diversa',
        tip3Title: 'Controlla il recupero',
        tip3Desc: 'Sonno, alimentazione, stress',
        outro: 'A volte un piccolo cambiamento fa una grande differenza.',
        signature: '<strong>Daniele</strong><br><span style="color: #666;">Founder, Arvo</span>',
        tagline: 'Arvo - AI Personal Trainer for Serious Lifters',
      },
      en: {
        subject: `📊 Let's break through that plateau, ${data.firstName}`,
        greeting: `Hey ${data.firstName},`,
        intro: `Your <strong>${data.exerciseName}</strong> has been steady at <strong>${data.currentE1rm}kg</strong> for ${data.weeksStuck} weeks.`,
        explanation: 'Plateaus are normal — they mean your body has adapted. Here\'s how to break through:',
        tip1Title: 'Deload week',
        tip1Desc: 'Reduce weight 40%, focus on form',
        tip2Title: 'Add variation',
        tip2Desc: 'Pause reps, tempo work, different grip',
        tip3Title: 'Check recovery',
        tip3Desc: 'Sleep, nutrition, stress',
        outro: 'Sometimes a small change makes a big difference.',
        signature: '<strong>Daniele</strong><br><span style="color: #666;">Founder, Arvo</span>',
        tagline: 'Arvo - AI Personal Trainer for Serious Lifters',
      },
    };

    const t = content[lang];

    return {
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">${t.greeting}</p>
                      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">${t.intro}</p>
                      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">${t.explanation}</p>

                      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <div style="margin-bottom: 16px;">
                          <p style="margin: 0 0 4px 0; color: #4F46E5; font-size: 14px; font-weight: 600;">• ${t.tip1Title}</p>
                          <p style="margin: 0; color: #666; font-size: 14px;">${t.tip1Desc}</p>
                        </div>
                        <div style="margin-bottom: 16px;">
                          <p style="margin: 0 0 4px 0; color: #4F46E5; font-size: 14px; font-weight: 600;">• ${t.tip2Title}</p>
                          <p style="margin: 0; color: #666; font-size: 14px;">${t.tip2Desc}</p>
                        </div>
                        <div>
                          <p style="margin: 0 0 4px 0; color: #4F46E5; font-size: 14px; font-weight: 600;">• ${t.tip3Title}</p>
                          <p style="margin: 0; color: #666; font-size: 14px;">${t.tip3Desc}</p>
                        </div>
                      </div>

                      <p style="margin: 20px 0 0 0; color: #333; font-size: 16px; line-height: 1.6; font-style: italic;">${t.outro}</p>
                      <p style="margin: 24px 0 0 0; color: #333; font-size: 16px; line-height: 1.6;">${t.signature}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; border-top: 1px solid #eee; text-align: center;">
                      <p style="margin: 0; color: #999; font-size: 12px;">${t.tagline}<br><a href="https://arvo.guru" style="color: #999;">arvo.guru</a></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  },
};
