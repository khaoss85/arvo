# Production Environment Variables Setup

## Issue: Email Links Point to Localhost

When sending approval emails (or any email with magic links), the CTA links must point to the production domain (`https://arvo.guru`) instead of `localhost`.

## Root Cause

The magic link generation in `app/api/admin/waitlist/approve/route.ts:88` uses:

```typescript
redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
```

This environment variable is set to `http://localhost:3000` in `.env.local` (for local development), but needs to be set to `https://arvo.guru` in production.

## Solution: Configure Vercel Environment Variables

### Step 1: Access Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the ARVO project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add/Update Production Variables

Add or update the following environment variable:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://arvo.guru` | Production, Preview |

### Step 3: Redeploy

After updating environment variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click the **⋯** menu → **Redeploy**
4. Confirm the redeployment

## Verification

After redeployment, when you send an approval email, the magic link should look like:

```
https://pttyfxgmmhuhzgwmwser.supabase.co/auth/v1/verify?token=...&redirect_to=https://arvo.guru/auth/callback
```

**Before (incorrect):**
```
redirect_to=http://localhost:3000/auth/callback
```

**After (correct):**
```
redirect_to=https://arvo.guru/auth/callback
```

## Complete List of Production Environment Variables

Make sure these are all configured in Vercel Production:

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pttyfxgmmhuhzgwmwser.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# App Configuration
NEXT_PUBLIC_APP_URL=https://arvo.guru

# Waitlist
NEXT_PUBLIC_WAITLIST_ENABLED=true

# Email (Resend)
RESEND_API_KEY=[your-resend-key]
ADMIN_EMAIL=[your-admin-email]
EMAIL_FROM_DOMAIN=arvo.guru

# OpenAI
OPENAI_API_KEY=[your-openai-key]
OPENAI_MODEL=gpt-5.1

# MuscleWiki (Exercise Animations)
NEXT_PUBLIC_MUSCLEWIKI_API_KEY=[your-musclewiki-rapidapi-key]

# Inngest (Background Jobs)
INNGEST_EVENT_KEY=[your-inngest-event-key]
INNGEST_SIGNING_KEY=[your-inngest-signing-key]
```

### Security Notes

- ⚠️ Never commit `.env.local` to git (it contains secrets)
- ✅ All variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- ⚠️ Keep service role keys and API keys secret (server-side only)

## Testing

1. Deploy to production with updated env vars
2. Send a test approval email from the admin panel
3. Check the email HTML source to verify the link
4. Click the link and verify it redirects to `https://arvo.guru`

## Affected Features

These features rely on `NEXT_PUBLIC_APP_URL` being set correctly:

- ✉️ **Approval emails** (`app/api/admin/waitlist/approve/route.ts:88`)
- ✉️ **Magic link authentication** (redirect after login)
- 🔗 **Email templates** (other emails using `appUrl` parameter)
- 🔗 **Referral links** (if implemented)

## Local Development

Keep `.env.local` with `NEXT_PUBLIC_APP_URL=http://localhost:3000` for local development.

Production env vars are managed separately on Vercel and don't affect local development.
