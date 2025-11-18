# Email Internationalization (i18n) - Complete Setup Guide

## Overview

ARVO's email system now supports **Italian (IT)** and **English (EN)** with automatic language detection based on user preferences. This guide covers the complete implementation and setup process.

## What Was Implemented

### 1. Email Templates (`lib/services/email-templates.ts`)

All 8 email templates now support both IT and EN:

1. **Welcome Email** - Sent after user registration
2. **Onboarding Complete** - Sent after user completes onboarding
3. **First Workout Reminder** - Sent 24h after onboarding if first workout not started
4. **First Workout Complete** - Celebration email after first workout
5. **Weekly Progress** - Weekly summary of workouts and progress
6. **Cycle Complete** - Milestone email after completing a training cycle
7. **Re-engagement** - Sent to inactive users (7+ days)
8. **Settings Update** - Confirmation when user changes important settings

Each template uses this structure:

```typescript
export type SupportedLanguage = 'it' | 'en';

export const emailTemplates = {
  welcome(data: WelcomeEmailData, appUrl: string, lang: SupportedLanguage = 'en') {
    const content = {
      it: {
        subject: 'Benvenuto in ARVO',
        greeting: `Ciao ${data.firstName}!`,
        // ... all Italian strings
      },
      en: {
        subject: 'Welcome to ARVO',
        greeting: `Hi ${data.firstName}!`,
        // ... all English strings
      },
    };
    const t = content[lang];
    return { subject: t.subject, html: `...${t.greeting}...` };
  },
  // ... 7 more templates
};
```

### 2. Email Service (`lib/services/email.service.ts`)

**getUserLanguage() Helper:**

```typescript
private static async getUserLanguage(userId: string): Promise<SupportedLanguage> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('preferred_language')
    .eq('user_id', userId)
    .single();

  const lang = profile?.preferred_language;
  if (lang === 'it' || lang === 'en') {
    return lang as SupportedLanguage;
  }
  return 'en'; // Default to English
}
```

**All 8 email methods updated:**
- Detect user's preferred language
- Pass language to template
- Log language in console
- Track language in email_events metadata

### 3. Database Schema

**Migration:** `20251118000004_create_email_scheduler_helpers.sql`

**New Tables:**
- `email_events` - Tracks all sent emails with metadata
- Database helper functions for email scheduler

**New Fields in `user_profiles`:**
- `preferred_language` (VARCHAR(5)) - 'it' or 'en'
- `email_notifications_enabled` (BOOLEAN)
- `email_frequency` (VARCHAR(20))

### 4. Edge Function (`supabase/functions/email-scheduler`)

Hourly Edge Function that calls three API endpoints:
- `/api/email/first-workout-reminder`
- `/api/email/weekly-progress`
- `/api/email/reengagement`

**Secrets configured:**
- `RESEND_API_KEY` - Resend API key for sending emails
- `APP_URL` - Production URL (https://arvo.guru)

## Setup Instructions

### 1. Database Setup

All migrations have been applied remotely. Verify with:

```sql
SELECT version, name, created_at
FROM supabase_migrations.schema_migrations
ORDER BY created_at DESC
LIMIT 5;
```

You should see migration `20251118000004`.

### 2. Edge Function Deployment

Already deployed to production:

```bash
# To redeploy if needed:
npx supabase functions deploy email-scheduler --no-verify-jwt
```

### 3. Secrets Configuration

Already configured:

```bash
# To verify:
npx supabase secrets list

# To update if needed:
npx supabase secrets set RESEND_API_KEY=your_key_here
npx supabase secrets set APP_URL=https://arvo.guru
```

### 4. Cron Job Setup

**IMPORTANT:** The cron job must be set up manually via SQL.

Run the SQL commands in `CRON_SETUP.sql`:

```bash
# Connect to your database
psql postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Or use Supabase SQL Editor and paste contents of CRON_SETUP.sql
```

**Verify cron job is running:**

```sql
-- Check job exists
SELECT jobname, schedule, active, database
FROM cron.job
WHERE jobname = 'email-scheduler-hourly';

-- Check recent runs
SELECT jobid, status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'email-scheduler-hourly')
ORDER BY start_time DESC
LIMIT 10;
```

## How Language Detection Works

1. **User Registration:** User selects language during onboarding → stored in `user_profiles.preferred_language`
2. **Email Trigger:** When email is sent, `EmailService.getUserLanguage(userId)` queries the database
3. **Template Selection:** Language is passed to template: `emailTemplates.welcome(data, appUrl, lang)`
4. **Fallback:** If language not set or invalid, defaults to English ('en')
5. **Tracking:** Language is logged and stored in `email_events.metadata`

## Adding New Languages

To add support for additional languages (e.g., Spanish 'es'):

1. **Update type definition** in `lib/services/email-templates.ts`:
   ```typescript
   export type SupportedLanguage = 'it' | 'en' | 'es';
   ```

2. **Add translations** to each template:
   ```typescript
   const content = {
     it: { /* Italian */ },
     en: { /* English */ },
     es: { /* Spanish */ },
   };
   ```

3. **Update getUserLanguage()** validation in `lib/services/email.service.ts`:
   ```typescript
   if (lang === 'it' || lang === 'en' || lang === 'es') {
     return lang as SupportedLanguage;
   }
   ```

4. **Update database constraint** (if using enum):
   ```sql
   ALTER TABLE user_profiles
   DROP CONSTRAINT IF EXISTS preferred_language_check;

   ALTER TABLE user_profiles
   ADD CONSTRAINT preferred_language_check
   CHECK (preferred_language IN ('it', 'en', 'es'));
   ```

## Adding New Email Templates

To add a new email template (e.g., "Workout Milestone"):

1. **Define data interface** in `lib/services/email-templates.ts`:
   ```typescript
   export interface WorkoutMilestoneEmailData {
     firstName: string;
     milestoneType: string;
     achievement: string;
   }
   ```

2. **Add template function**:
   ```typescript
   export const emailTemplates = {
     // ... existing templates
     workoutMilestone(data: WorkoutMilestoneEmailData, appUrl: string, lang: SupportedLanguage = 'en') {
       const content = {
         it: {
           subject: `🏆 Milestone Raggiunto: ${data.achievement}`,
           // ... Italian content
         },
         en: {
           subject: `🏆 Milestone Reached: ${data.achievement}`,
           // ... English content
         },
       };
       const t = content[lang];
       return { subject: t.subject, html: `...` };
     },
   };
   ```

3. **Add service method** in `lib/services/email.service.ts`:
   ```typescript
   static async sendWorkoutMilestoneEmail(userId: string, email: string, milestoneType: string) {
     try {
       if (!(await this.shouldSendEmail(userId, 'workout_milestone'))) {
         return false;
       }

       const lang = await this.getUserLanguage(userId);
       const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

       const data: WorkoutMilestoneEmailData = {
         firstName: '...', // fetch from database
         milestoneType,
         achievement: '...',
       };

       const { subject, html } = emailTemplates.workoutMilestone(data, appUrl, lang);

       const resend = this.getResendClient();
       const { data: emailData, error } = await resend.emails.send({
         from: this.getFromAddress('ARVO'),
         to: [email],
         subject,
         html,
       });

       if (error) {
         console.error('Error sending workout milestone email:', error);
         return false;
       }

       await this.trackEmailEvent(userId, 'workout_milestone', subject, 'workout_milestone', { ...data, lang });
       console.log(`Workout milestone email sent to: ${email} (${lang.toUpperCase()})`, emailData?.id);
       return true;
     } catch (error) {
       console.error('Error in sendWorkoutMilestoneEmail:', error);
       return false;
     }
   }
   ```

## Testing

### 1. TypeScript Build

```bash
npm run type-check
# or
npx tsc --noEmit
```

Should complete without errors.

### 2. Test Email Locally

```typescript
// In a test file or API route
import { EmailService } from '@/lib/services/email.service';

// Test Italian email
await EmailService.sendWelcomeEmail(
  'user-id-here',
  'test@example.com',
  'Marco'
);

// Check console log should show: "Welcome email sent to: test@example.com (IT)"
```

### 3. Test Edge Function

```bash
# Invoke the Edge Function manually
curl -X POST \
  https://pttyfxgmmhuhzgwmwser.supabase.co/functions/v1/email-scheduler \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Check logs
npx supabase functions logs email-scheduler --tail
```

### 4. Monitor Email Events

```sql
-- View recently sent emails
SELECT
  event_type,
  email_subject,
  metadata->>'lang' as language,
  sent_at
FROM email_events
ORDER BY sent_at DESC
LIMIT 20;

-- Count emails by language
SELECT
  metadata->>'lang' as language,
  COUNT(*) as count
FROM email_events
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY metadata->>'lang';
```

## Monitoring & Analytics

### Email Delivery Stats

```sql
-- Emails sent in last 24 hours by type
SELECT
  event_type,
  COUNT(*) as count,
  MAX(sent_at) as last_sent
FROM email_events
WHERE sent_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY last_sent DESC;

-- Email language distribution
SELECT
  metadata->>'lang' as language,
  event_type,
  COUNT(*) as count
FROM email_events
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY metadata->>'lang', event_type
ORDER BY count DESC;
```

### Cron Job Health

```sql
-- Check cron job status
SELECT * FROM cron.job WHERE jobname LIKE '%email%';

-- Check for failed runs
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC
LIMIT 20;
```

## Troubleshooting

### Emails Not Sending

1. **Check user preferences:**
   ```sql
   SELECT
     user_id,
     email_notifications_enabled,
     preferred_language,
     email_frequency
   FROM user_profiles
   WHERE user_id = 'user-id-here';
   ```

2. **Check email_events for duplicates:**
   ```sql
   SELECT * FROM email_events
   WHERE user_id = 'user-id-here'
   AND event_type = 'welcome'
   AND sent_at > NOW() - INTERVAL '24 hours';
   ```

3. **Verify Resend API key:**
   ```bash
   npx supabase secrets list
   ```

### Wrong Language Sent

1. **Check user's preferred_language:**
   ```sql
   SELECT preferred_language FROM user_profiles WHERE user_id = 'user-id-here';
   ```

2. **Check email_events metadata:**
   ```sql
   SELECT metadata FROM email_events WHERE id = 'event-id-here';
   ```

3. **Verify getUserLanguage() logic** in `email.service.ts:284-304`

### Cron Job Not Running

1. **Check if pg_cron extension is enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. **Verify job schedule:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'email-scheduler-hourly';
   ```

3. **Check Edge Function logs:**
   ```bash
   npx supabase functions logs email-scheduler --tail
   ```

### TypeScript Errors

1. **Regenerate database types:**
   ```bash
   npx supabase gen types typescript --local > lib/types/database.types.ts
   ```

2. **Check email-templates.ts exports:**
   - All data interfaces must be exported
   - SupportedLanguage type must be exported
   - All template functions must have lang parameter

## Files Modified

- ✅ `lib/services/email-templates.ts` (1110 lines) - Complete rewrite with IT/EN support
- ✅ `lib/services/email.service.ts` (811 lines) - Added getUserLanguage() + updated 8 methods
- ✅ `supabase/migrations/20251118000004_create_email_scheduler_helpers.sql` - Database schema
- ✅ `supabase/functions/email-scheduler/index.ts` - Deployed to production
- ✅ `CRON_SETUP.sql` - Manual cron job setup commands
- ✅ `supabase/config.toml` - Updated db.major_version to 17

## Next Steps

1. ✅ **Complete email.service.ts updates** - DONE
2. ✅ **Deploy Edge Function** - DONE
3. ✅ **Set Secrets** - DONE
4. ⏳ **Run TypeScript build test**
5. ⏳ **Test Edge Function end-to-end**
6. 🔧 **Set up cron job** - MANUAL STEP REQUIRED
7. 📊 **Monitor email delivery for 24h**

## Production Checklist

Before going live:

- [ ] Verify all secrets are set correctly
- [ ] Test each email template in both languages
- [ ] Set up cron job via SQL
- [ ] Monitor cron job runs for errors
- [ ] Check Resend dashboard for delivery rates
- [ ] Verify email_events table is being populated
- [ ] Test with real user accounts (IT and EN)
- [ ] Set up alerts for failed email deliveries

## Support

For issues or questions:
- Check Edge Function logs: `npx supabase functions logs email-scheduler`
- Check database logs: `npx supabase db logs`
- Review email_events table for tracking data
- Verify Resend dashboard: https://resend.com/emails

---

**Last Updated:** 2025-11-18
**Version:** 1.0.0
**Status:** ✅ Implementation Complete - Testing Pending
