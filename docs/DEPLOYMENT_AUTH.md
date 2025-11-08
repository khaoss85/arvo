# Authentication Deployment Configuration

This guide explains how to properly configure authentication for production deployment to fix the "about:blank" issue when users click magic links.

## Problem Description

When users click the magic link in their email, they briefly see an `about:blank` page before being redirected to the dashboard. This happens due to missing redirect URL configuration in Supabase.

## Solution Overview

The fix involves three components:
1. ✅ Code changes (already implemented)
2. 🔧 Supabase Dashboard configuration (manual steps below)
3. 🚀 Vercel environment variables (for production)

---

## 1. Code Changes (✅ Already Done)

### Updated `lib/services/auth.service.ts`

The authentication service now uses the `NEXT_PUBLIC_APP_URL` environment variable:

```typescript
// Use environment variable for redirect URL to ensure consistency across environments
const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

const { data, error } = await supabase.auth.signInWithOtp({
  email: validated.email,
  options: {
    emailRedirectTo: `${appUrl}/auth/callback`,
  },
});
```

### Environment Variable in `.env.local`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. Supabase Dashboard Configuration (🔧 Manual Steps Required)

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **pttyfxgmmhuhzgwmwser** (arvo project)
3. Navigate to **Authentication** → **URL Configuration**

### Step 2: Configure Redirect URLs

Add the following URLs to the **Redirect URLs** whitelist:

#### For Local Development:
```
http://localhost:3000/auth/callback
http://localhost:3000/**
```

#### For Production (Vercel):
```
https://arvo-five.vercel.app/auth/callback
https://arvo-five.vercel.app/**
```

#### If Using Custom Domain:
```
https://your-custom-domain.com/auth/callback
https://your-custom-domain.com/**
```

### Step 3: Configure Site URL

Set the **Site URL** to your primary domain:

- **Development**: `http://localhost:3000`
- **Production**: `https://arvo-five.vercel.app` (or your custom domain)

### Step 4: Save Changes

Click **Save** to apply the configuration.

---

## 3. Vercel Deployment Configuration (🚀 Production)

### Step 1: Add Environment Variable in Vercel

1. Go to your Vercel project: [arvo-five.vercel.app](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://arvo-five.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://arvo-five.vercel.app` | Preview |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Development |

**Important**: If you're using a custom domain, use that URL instead.

### Step 2: Redeploy

After adding the environment variable:
1. Go to **Deployments**
2. Click **...** on the latest deployment
3. Select **Redeploy**

Or simply push a new commit to trigger automatic redeployment.

---

## 4. Testing the Configuration

### Local Testing (Development)

1. Start the dev server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Enter your email and request a magic link
4. Check your email and click the magic link
5. **Expected behavior**:
   - ❌ No `about:blank` page
   - ✅ Direct redirect to `/auth/callback`
   - ✅ Immediate redirect to `/dashboard`

### Production Testing (Vercel)

1. Go to `https://arvo-five.vercel.app/login`
2. Enter your email and request a magic link
3. Check your email and click the magic link
4. **Expected behavior**:
   - ❌ No `about:blank` page
   - ✅ Direct redirect to `/auth/callback`
   - ✅ Immediate redirect to `/dashboard`

---

## 5. Troubleshooting

### Still Seeing about:blank?

**Check Supabase Redirect URLs:**
1. Verify all URLs are added to whitelist
2. Ensure there are no typos (especially trailing slashes)
3. Make sure you saved the configuration

**Check Vercel Environment Variables:**
1. Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. Ensure it's set for the correct environment (Production)
3. Redeploy after adding/changing variables

**Check Email Link:**
Look at the URL in the magic link email. It should look like:
```
https://pttyfxgmmhuhzgwmwser.supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=https://arvo-five.vercel.app/auth/callback
```

The `redirect_to` parameter should match your domain exactly.

### Common Issues

**Issue**: Email contains `http://localhost:3000` in production
- **Solution**: Set `NEXT_PUBLIC_APP_URL` in Vercel and redeploy

**Issue**: "Invalid redirect URL" error
- **Solution**: Add the URL to Supabase redirect whitelist

**Issue**: Redirect works but user isn't authenticated
- **Solution**: Check middleware configuration and session handling

---

## 6. Expected Authentication Flow

After proper configuration, the authentication flow should be:

```
1. User enters email on /login page
   ↓
2. Supabase sends magic link email
   ↓
3. User clicks link in email
   ↓
4. Supabase verifies token
   ↓ (instant redirect, no blank page)
5. Browser navigates to /auth/callback
   ↓
6. Callback route exchanges code for session
   ↓ (< 1 second)
7. User lands on /dashboard (authenticated)
```

**Total time**: 1-2 seconds from click to dashboard
**Blank pages**: None ✅

---

## 7. Security Considerations

### Redirect URL Security

The redirect URL whitelist prevents open redirect vulnerabilities. Only add trusted domains:

✅ **Safe to add:**
- Your own domains (localhost, vercel.app, custom domain)
- Wildcard patterns on your own domains (`https://your-domain.com/**`)

❌ **Never add:**
- Third-party domains
- Generic wildcards (`https://**`)
- HTTP URLs in production (use HTTPS only)

### Environment Variables

- `NEXT_PUBLIC_APP_URL` is exposed to the browser (safe for URLs)
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-side only
- Never commit `.env.local` to git (already in `.gitignore`)

---

## 8. Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Summary

✅ **Code changes**: Already implemented (uses `NEXT_PUBLIC_APP_URL`)
🔧 **Manual configuration required**:
  1. Add redirect URLs in Supabase Dashboard
  2. Add environment variable in Vercel
  3. Redeploy

After completing these steps, the `about:blank` issue will be resolved and users will experience smooth, instant redirects from magic links to your dashboard.
