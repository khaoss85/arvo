import { Resend } from 'resend';

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
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const adminEmail = process.env.ADMIN_EMAIL;

      if (!adminEmail) {
        console.warn('ADMIN_EMAIL not set, skipping admin notification');
        return;
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
        console.error('Error sending admin notification:', error);
      } else {
        console.log('Admin notification sent:', data?.id);
      }
    } catch (error) {
      console.error('Error in sendAdminNotification:', error);
    }
  }

  /**
   * Send welcome email to user who joined waitlist
   */
  static async sendWaitlistWelcome(entry: WaitlistEntry) {
    try {
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
        console.error('Error sending waitlist welcome:', error);
      } else {
        console.log('Waitlist welcome sent to:', entry.email, data?.id);
      }
    } catch (error) {
      console.error('Error in sendWaitlistWelcome:', error);
    }
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
}
