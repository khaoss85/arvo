import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  emailTemplates,
  type SupportedLanguage,
  type WelcomeEmailData,
  type OnboardingCompleteEmailData,
  type FirstWorkoutReminderEmailData,
  type FirstWorkoutCompleteEmailData,
  type WeeklyProgressEmailData,
  type CycleCompleteEmailData,
  type ReengagementEmailData,
  type SettingsUpdateEmailData,
} from './email-templates';
import type { Database } from '@/lib/types/database.types';

interface WaitlistEntry {
  id: string;
  email: string;
  first_name?: string | null;
  training_goal?: string | null;
  referral_code: string;
  queue_position: number | null;
  invited_count: number;
  status: string;
  referrer_id?: string | null;
}

export class EmailService {
  private static getResendClient(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    return new Resend(apiKey);
  }

  private static getFromAddress(name: string): string {
    const domain = process.env.EMAIL_FROM_DOMAIN || 'resend.dev';
    return `${name} <onboarding@${domain}>`;
  }

  /**
   * Send admin notification when someone joins waitlist
   */
  static async sendAdminNotification(entry: WaitlistEntry, referrerEmail?: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      const errorMsg = '⚠️ ADMIN_EMAIL environment variable is not set - cannot send admin notification';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const resend = this.getResendClient();
    const { data, error } = await resend.emails.send({
      from: this.getFromAddress('ARVO Waitlist'),
      to: [adminEmail],
      subject: `🎉 Nuova iscrizione waitlist - ${entry.first_name || 'Nuovo utente'}`,
      html: `
        <h2>Nuova Iscrizione Waitlist</h2>

        <p><strong>📧 Email:</strong> ${entry.email}</p>
        <p><strong>👤 Nome:</strong> ${entry.first_name || 'N/A'}</p>
        <p><strong>🎯 Obiettivo:</strong> ${entry.training_goal || 'N/A'}</p>
        <p><strong>📍 Queue Position:</strong> ${
          entry.queue_position === null ? '✨ Instant Access' : `#${entry.queue_position}`
        }</p>
        <p><strong>🔗 Referral Code:</strong> ${entry.referral_code}</p>
        <p><strong>👥 Invited Count:</strong> ${entry.invited_count}</p>

        ${
          referrerEmail
            ? `<p><strong>✨ Invitato da:</strong> ${referrerEmail}</p>`
            : '<p><strong>✨ Iscrizione organica</strong></p>'
        }

        <br>
        <a href="${appUrl}/admin/waitlist" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Vai al Dashboard Admin
        </a>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">ARVO Admin Dashboard</p>
      `,
    });

    if (error) {
      console.error('❌ Resend API error (admin notification):', JSON.stringify(error, null, 2));
      throw new Error(`Failed to send admin notification: ${error.message || 'Unknown error'}`);
    }

    console.log('✅ Admin notification sent successfully:', data?.id);
  }

  /**
   * Send welcome email to user who joined waitlist
   */
  static async sendWaitlistWelcome(entry: WaitlistEntry) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const referralUrl = `${appUrl}/join/${entry.referral_code}`;

    const resend = this.getResendClient();
    const { data, error } = await resend.emails.send({
      from: this.getFromAddress('ARVO'),
      to: [entry.email],
      subject: '✅ Benvenuto nella waitlist ARVO!',
      html: `
        <h2>Grazie per il tuo interesse in ARVO!</h2>

        <p>Ciao ${entry.first_name || 'là'},</p>

        <p>Sei stato aggiunto alla waitlist ARVO AI Training.</p>

        <h3>📍 La tua posizione in coda: ${
          entry.queue_position === null
            ? '✨ <strong>Accesso Immediato!</strong>'
            : `<strong>#${entry.queue_position}</strong>`
        }</h3>

        ${
          entry.queue_position !== null
            ? `
        <h3>🚀 Salta la fila!</h3>
        <p>Invita amici e scala la coda:</p>
        <ul>
          <li><strong>3 amici</strong> → Salta ai top 50</li>
          <li><strong>5 amici</strong> → Accesso immediato + Audio Coaching Premium</li>
        </ul>

        <p><strong>Il tuo link di invito:</strong></p>
        <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; word-break: break-all;">
          ${referralUrl}
        </p>

        <a href="${referralUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
          Condividi il tuo link
        </a>
        `
            : `
        <p>Hai ottenuto l'accesso immediato grazie ai tuoi ${entry.invited_count} inviti! 🎉</p>
        <p>Riceverai presto un'email con le istruzioni per accedere.</p>
        `
        }

        <br><br>
        <p>A presto,<br><strong>Team ARVO</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          ARVO - AI Personal Trainer for Serious Lifters
        </p>
      `,
    });

    if (error) {
      console.error('❌ Resend API error (user welcome):', JSON.stringify(error, null, 2));
      throw new Error(`Failed to send welcome email to ${entry.email}: ${error.message || 'Unknown error'}`);
    }

    console.log('✅ Welcome email sent successfully to:', entry.email, 'ID:', data?.id);
  }

  /**
   * Send approval email with magic link
   */
  static async sendApprovalEmail(entry: WaitlistEntry, magicLink: string) {
    try {
      const resend = this.getResendClient();
      const { data, error } = await resend.emails.send({
        from: this.getFromAddress('ARVO'),
        to: [entry.email],
        subject: '🎊 Sei stato approvato! Benvenuto in ARVO',
        html: `
          <h2>Congratulazioni! Hai accesso a ARVO</h2>

          <p>Ciao ${entry.first_name || 'là'},</p>

          <p>Sei stato approvato per l'accesso early a <strong>ARVO AI Training</strong>!</p>

          <p>Clicca il link qui sotto per creare il tuo account e iniziare subito:</p>

          <a href="${magicLink}" style="background-color: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold;">
            Accedi a ARVO
          </a>

          <p style="color: #666; font-size: 14px;">
            ⏰ Il link è valido per 24 ore.
          </p>

          <br>
          <p>Pronto a trasformare il tuo allenamento?</p>
          <p><strong>Team ARVO</strong></p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            ARVO - AI Personal Trainer for Serious Lifters
          </p>
        `,
      });

      if (error) {
        console.error('Error sending approval email:', error);
        return false;
      } else {
        console.log('Approval email sent to:', entry.email, data?.id);
        return true;
      }
    } catch (error) {
      console.error('Error in sendApprovalEmail:', error);
      return false;
    }
  }

  /**
   * Helper: Track email event in database
   */
  private static async trackEmailEvent(
    userId: string,
    eventType: string,
    emailSubject: string,
    emailTemplate: string,
    metadata: Record<string, any> = {}
  ) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('email_events').insert({
        user_id: userId,
        event_type: eventType,
        email_subject: emailSubject,
        email_template: emailTemplate,
        metadata,
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error tracking email event:', error);
    }
  }

  /**
   * Helper: Check if email should be sent based on user preferences
   */
  private static async shouldSendEmail(userId: string, eventType: string): Promise<boolean> {
    try {
      const supabase = getSupabaseAdmin();

      // Check if email was already sent recently
      const { data: alreadySent } = await supabase.rpc('check_email_already_sent', {
        p_user_id: userId,
        p_event_type: eventType,
        p_hours_ago: 24,
      });

      if (alreadySent) {
        console.log(`Email ${eventType} already sent to user ${userId} in last 24h`);
        return false;
      }

      // Check user email preferences
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email_notifications_enabled, email_frequency')
        .eq('user_id', userId)
        .single();

      if (!profile || !profile.email_notifications_enabled) {
        console.log(`User ${userId} has disabled email notifications`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking if should send email:', error);
      return false;
    }
  }

  /**
   * Helper: Get user's preferred language
   */
  private static async getUserLanguage(userId: string): Promise<SupportedLanguage> {
    try {
      const supabase = getSupabaseAdmin();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('preferred_language')
        .eq('user_id', userId)
        .single();

      // Default to 'en' if not set or invalid
      const lang = profile?.preferred_language;
      if (lang === 'it' || lang === 'en') {
        return lang as SupportedLanguage;
      }
      return 'en';
    } catch (error) {
      console.error('Error getting user language:', error);
      return 'en'; // Default to English on error
    }
  }

  /**
   * Email 1: Welcome & Onboarding Start
   */
  static async sendWelcomeEmail(userId: string, email: string, firstName: string) {
    try {
      if (!(await this.shouldSendEmail(userId, 'welcome'))) {
        return false;
      }

      const lang = await this.getUserLanguage(userId);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const data: WelcomeEmailData = { firstName, email };
      const { subject, html } = emailTemplates.welcome(data, appUrl, lang);

      const resend = this.getResendClient();
      const { data: emailData, error } = await resend.emails.send({
        from: this.getFromAddress('ARVO'),
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        return false;
      }

      await this.trackEmailEvent(userId, 'welcome', subject, 'welcome', { firstName, lang });
      console.log(`Welcome email sent to: ${email} (${lang.toUpperCase()})`, emailData?.id);
      return true;
    } catch (error) {
      console.error('Error in sendWelcomeEmail:', error);
      return false;
    }
  }

  /**
   * Email 2: Onboarding Completion Celebration
   */
  static async sendOnboardingCompleteEmail(userId: string, email: string) {
    try {
      if (!(await this.shouldSendEmail(userId, 'onboarding_complete'))) {
        return false;
      }

      const supabase = getSupabaseAdmin();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Get user stats
      const { data: stats } = await supabase.rpc('get_user_onboarding_stats', {
        p_user_id: userId,
      });

      if (!stats) {
        console.error('Could not fetch user stats for onboarding email');
        return false;
      }

      // Type cast from Json to expected shape
      const userStats = stats as unknown as {
        firstName?: string;
        approachName?: string;
        splitType?: string;
        weeklyFrequency?: number;
        weakPoints?: string[];
        firstWorkoutId?: string;
      };

      const lang = await this.getUserLanguage(userId);

      const data: OnboardingCompleteEmailData = {
        firstName: userStats.firstName || 'là',
        approachName: userStats.approachName || 'Kuba Method',
        splitType: userStats.splitType || 'push_pull_legs',
        weeklyFrequency: userStats.weeklyFrequency || 6,
        weakPoints: userStats.weakPoints || [],
        firstWorkoutId: userStats.firstWorkoutId || '',
      };

      const { subject, html } = emailTemplates.onboardingComplete(data, appUrl, lang);

      const resend = this.getResendClient();
      const { data: emailData, error } = await resend.emails.send({
        from: this.getFromAddress('ARVO'),
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('Error sending onboarding complete email:', error);
        return false;
      }

      await this.trackEmailEvent(userId, 'onboarding_complete', subject, 'onboarding_complete', { ...data, lang });
      console.log(`Onboarding complete email sent to: ${email} (${lang.toUpperCase()})`, emailData?.id);
      return true;
    } catch (error) {
      console.error('Error in sendOnboardingCompleteEmail:', error);
      return false;
    }
  }

  /**
   * Email 3: First Workout Reminder (24h after onboarding if not started)
   */
  static async sendFirstWorkoutReminderEmail(userId: string, email: string, workoutId: string) {
    try {
      if (!(await this.shouldSendEmail(userId, 'first_workout_reminder'))) {
        return false;
      }

      const supabase = getSupabaseAdmin();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Get workout details
      const { data: workout } = await supabase
        .from('workouts')
        .select('workout_name, workout_type, target_muscle_groups, exercises')
        .eq('id', workoutId)
        .single();

      if (!workout) {
        console.error('Workout not found for reminder email');
        return false;
      }

      // Get user first name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name')
        .eq('user_id', userId)
        .single();

      const lang = await this.getUserLanguage(userId);

      const data: FirstWorkoutReminderEmailData = {
        firstName: profile?.first_name || 'là',
        workoutName: workout.workout_name || 'Il tuo primo workout',
        workoutType: workout.workout_type || 'Push',
        targetMuscles: workout.target_muscle_groups || [],
        estimatedDuration: 60,
        workoutId,
      };

      const { subject, html } = emailTemplates.firstWorkoutReminder(data, appUrl, lang);

      const resend = this.getResendClient();
      const { data: emailData, error } = await resend.emails.send({
        from: this.getFromAddress('ARVO'),
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('Error sending first workout reminder:', error);
        return false;
      }

      await this.trackEmailEvent(userId, 'first_workout_reminder', subject, 'first_workout_reminder', { ...data, lang });
      console.log(`First workout reminder sent to: ${email} (${lang.toUpperCase()})`, emailData?.id);
      return true;
    } catch (error) {
      console.error('Error in sendFirstWorkoutReminderEmail:', error);
      return false;
    }
  }

  /**
   * Email 4: First Workout Complete Celebration
   */
  static async sendFirstWorkoutCompleteEmail(userId: string, email: string, workoutId: string) {
    try {
      if (!(await this.shouldSendEmail(userId, 'first_workout_complete'))) {
        return false;
      }

      const supabase = getSupabaseAdmin();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Get workout stats
      const { data: workout } = await supabase
        .from('workouts')
        .select('total_volume, duration_seconds, total_sets, exercises')
        .eq('id', workoutId)
        .single();

      if (!workout) {
        console.error('Workout not found for completion email');
        return false;
      }

      // Get user first name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name')
        .eq('user_id', userId)
        .single();

      const lang = await this.getUserLanguage(userId);

      const data: FirstWorkoutCompleteEmailData = {
        firstName: profile?.first_name || 'là',
        totalVolume: workout.total_volume || 0,
        duration: workout.duration_seconds || 0,
        totalSets: workout.total_sets || 0,
        exercisesCompleted: workout.exercises?.length || 0,
      };

      const { subject, html } = emailTemplates.firstWorkoutComplete(data, appUrl, lang);

      const resend = this.getResendClient();
      const { data: emailData, error } = await resend.emails.send({
        from: this.getFromAddress('ARVO'),
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('Error sending first workout complete email:', error);
        return false;
      }

      await this.trackEmailEvent(userId, 'first_workout_complete', subject, 'first_workout_complete', { ...data, lang });
      console.log(`First workout complete email sent to: ${email} (${lang.toUpperCase()})`, emailData?.id);
      return true;
    } catch (error) {
      console.error('Error in sendFirstWorkoutCompleteEmail:', error);
      return false;
    }
  }

  /**
   * Email 5: Weekly Progress Update
   */
  static async sendWeeklyProgressEmail(userId: string, email: string, weekNumber: number) {
    try {
      if (!(await this.shouldSendEmail(userId, 'weekly_progress'))) {
        return false;
      }

      const supabase = getSupabaseAdmin();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Get weekly stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: workouts } = await supabase
        .from('workouts')
        .select('total_volume, target_muscle_groups')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', oneWeekAgo.toISOString());

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, current_cycle_day')
        .eq('user_id', userId)
        .single();

      const lang = await this.getUserLanguage(userId);

      const totalVolume = workouts?.reduce((sum, w) => sum + (w.total_volume || 0), 0) || 0;
      const muscleGroups = new Set<string>();
      workouts?.forEach((w) => w.target_muscle_groups?.forEach((m: string) => muscleGroups.add(m)));

      const data: WeeklyProgressEmailData = {
        firstName: profile?.first_name || 'là',
        weekNumber,
        workoutsCompleted: workouts?.length || 0,
        totalVolume,
        muscleGroupsTrained: Array.from(muscleGroups),
        currentCycleDay: profile?.current_cycle_day || 1,
        cycleTotalDays: 8,
      };

      const { subject, html } = emailTemplates.weeklyProgress(data, appUrl, lang);

      const resend = this.getResendClient();
      const { data: emailData, error } = await resend.emails.send({
        from: this.getFromAddress('ARVO'),
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('Error sending weekly progress email:', error);
        return false;
      }

      await this.trackEmailEvent(userId, 'weekly_progress', subject, 'weekly_progress', { ...data, lang });
      console.log(`Weekly progress email sent to: ${email} (${lang.toUpperCase()})`, emailData?.id);
      return true;
    } catch (error) {
      console.error('Error in sendWeeklyProgressEmail:', error);
      return false;
    }
  }

  /**
   * Email 6: First Cycle Completion Milestone
   */
  static async sendCycleCompleteEmail(userId: string, email: string, cycleCompletionId: string) {
    try {
      if (!(await this.shouldSendEmail(userId, 'cycle_complete'))) {
        return false;
      }

      const supabase = getSupabaseAdmin();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Get cycle completion data
      const { data: cycle } = await supabase
        .from('cycle_completions')
        .select('*')
        .eq('id', cycleCompletionId)
        .single();

      type CycleCompletion = Database['public']['Tables']['cycle_completions']['Row'];
      const typedCycle = cycle as CycleCompletion | null;

      if (!typedCycle) {
        console.error('Cycle completion not found');
        return false;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name')
        .eq('user_id', userId)
        .single();

      const lang = await this.getUserLanguage(userId);

      const data: CycleCompleteEmailData = {
        firstName: profile?.first_name || 'là',
        cycleNumber: typedCycle.cycle_number as number,
        totalVolume: (typedCycle.total_volume as number) || 0,
        workoutsCompleted: (typedCycle.total_workouts_completed as number) || 0,
        totalDuration: (typedCycle.total_duration_seconds as number) || 0,
        avgMentalReadiness: (typedCycle.avg_mental_readiness as number) || 0,
        volumeByMuscleGroup: (typedCycle.volume_by_muscle_group as Record<string, number>) || {},
      };

      const { subject, html } = emailTemplates.cycleComplete(data, appUrl, lang);

      const resend = this.getResendClient();
      const { data: emailData, error } = await resend.emails.send({
        from: this.getFromAddress('ARVO'),
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('Error sending cycle complete email:', error);
        return false;
      }

      await this.trackEmailEvent(userId, 'cycle_complete', subject, 'cycle_complete', { ...data, lang });
      console.log(`Cycle complete email sent to: ${email} (${lang.toUpperCase()})`, emailData?.id);
      return true;
    } catch (error) {
      console.error('Error in sendCycleCompleteEmail:', error);
      return false;
    }
  }

  /**
   * Email 7: Re-engagement (inactive for 7+ days)
   */
  static async sendReengagementEmail(userId: string, email: string) {
    try {
      if (!(await this.shouldSendEmail(userId, 'reengagement'))) {
        return false;
      }

      const supabase = getSupabaseAdmin();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Get last workout
      const { data: lastWorkout } = await supabase
        .from('workouts')
        .select('workout_type, completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      // Get next workout
      const { data: nextWorkout } = await supabase
        .from('workouts')
        .select('workout_name, id')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('planned_at', { ascending: true })
        .limit(1)
        .single();

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, current_cycle_day')
        .eq('user_id', userId)
        .single();

      const lang = await this.getUserLanguage(userId);

      const daysSince = lastWorkout?.completed_at
        ? Math.floor((Date.now() - new Date(lastWorkout.completed_at).getTime()) / (1000 * 60 * 60 * 24))
        : 7;

      const data: ReengagementEmailData = {
        firstName: profile?.first_name || 'là',
        lastWorkoutType: lastWorkout?.workout_type || 'Push',
        daysSinceLastWorkout: daysSince,
        currentCycleDay: profile?.current_cycle_day || 1,
        nextWorkoutName: nextWorkout?.workout_name || 'Il tuo prossimo workout',
      };

      const { subject, html } = emailTemplates.reengagement(data, appUrl, lang);

      const resend = this.getResendClient();
      const { data: emailData, error } = await resend.emails.send({
        from: this.getFromAddress('ARVO'),
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('Error sending reengagement email:', error);
        return false;
      }

      await this.trackEmailEvent(userId, 'reengagement', subject, 'reengagement', { ...data, lang });
      console.log(`Reengagement email sent to: ${email} (${lang.toUpperCase()})`, emailData?.id);
      return true;
    } catch (error) {
      console.error('Error in sendReengagementEmail:', error);
      return false;
    }
  }

  /**
   * Email 8: Settings Update Confirmation
   */
  static async sendSettingsUpdateEmail(
    userId: string,
    email: string,
    settingChanged: string,
    oldValue: string,
    newValue: string,
    impact: string
  ) {
    try {
      if (!(await this.shouldSendEmail(userId, 'settings_update'))) {
        return false;
      }

      const supabase = getSupabaseAdmin();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name')
        .eq('user_id', userId)
        .single();

      const lang = await this.getUserLanguage(userId);

      const data: SettingsUpdateEmailData = {
        firstName: profile?.first_name || 'là',
        settingChanged,
        oldValue,
        newValue,
        impact,
      };

      const { subject, html } = emailTemplates.settingsUpdate(data, appUrl, lang);

      const resend = this.getResendClient();
      const { data: emailData, error } = await resend.emails.send({
        from: this.getFromAddress('ARVO'),
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('Error sending settings update email:', error);
        return false;
      }

      await this.trackEmailEvent(userId, 'settings_update', subject, 'settings_update', { ...data, lang });
      console.log(`Settings update email sent to: ${email} (${lang.toUpperCase()})`, emailData?.id);
      return true;
    } catch (error) {
      console.error('Error in sendSettingsUpdateEmail:', error);
      return false;
    }
  }
}
