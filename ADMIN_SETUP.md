# Admin Dashboard Setup Guide

## Overview
This guide explains how to set up and use the admin dashboard for managing the waitlist system.

## Features

### Admin Dashboard (`/admin/waitlist`)
- **View all waitlist entries** with pagination (50 entries per page)
- **Filter by status**: Pending, Approved, Converted
- **Search by email**
- **Stats overview**: Total signups, pending, approved, conversion rate
- **Approve entries**: Send magic link to approved users
- **Remove entries**: Delete from waitlist

### API Endpoints
- `GET /api/admin/waitlist/entries` - List all entries (with filters, search, pagination)
- `GET /api/admin/waitlist/stats` - Aggregate statistics
- `POST /api/admin/waitlist/approve` - Approve entry and send magic link
- `DELETE /api/admin/waitlist/remove` - Remove entry from waitlist

---

## Setup Instructions

### 1. Set Your First Admin

After deploying the app, you need to manually set yourself as admin in the database.

**Option A: Via Supabase Dashboard**
1. Go to Supabase Dashboard → Table Editor
2. Select `users` table
3. Find your user (by email)
4. Edit the row and set `role` = `'admin'`
5. Save

**Option B: Via SQL Editor**
1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace with your email):
   ```sql
   UPDATE public.users
   SET role = 'admin'
   WHERE email = 'your-email@example.com';
   ```

### 2. Access Admin Dashboard

Once you're set as admin:
1. Log in to the app
2. Navigate to `/admin/waitlist`
3. You'll see the admin dashboard with all waitlist entries

---

## Usage Workflow

### Typical Waitlist Management Flow

1. **Users sign up to waitlist**
   - Via landing page form (when `NEXT_PUBLIC_WAITLIST_ENABLED=true`)
   - Via referral links (`/join/CODE123`)
   - Status: `pending`

2. **Admin reviews entries**
   - Go to `/admin/waitlist`
   - See all pending entries sorted by queue position
   - Check:
     - Queue position (auto-calculated based on invited_count)
     - Number of referrals
     - Training goal

3. **Admin approves users**
   - Click "Approve" button
   - System automatically:
     - Updates status: `pending` → `approved`
     - Generates magic link via Supabase Auth
     - Sends email to user with login link

4. **User receives email and signs up**
   - User clicks magic link in email
   - Redirected to `/auth/callback`
   - Creates account
   - System automatically:
     - Updates status: `approved` → `converted`
     - Sets `converted_user_id`
     - Tracks conversion for stats

5. **Track conversion metrics**
   - See conversion rate in stats cards
   - Monitor top referrers
   - Track recent signups

---

## Environment Variables

### Required
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For admin operations
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### Optional
```bash
# Enable waitlist mode on landing page
NEXT_PUBLIC_WAITLIST_ENABLED=true  # or false for normal signup
```

---

## Security

### Access Control
- Admin dashboard routes (`/admin/*`) are protected by `requireAdmin()` helper
- Redirects to `/login` if not authenticated
- Redirects to `/dashboard` if authenticated but not admin
- All admin API routes check `isAdmin()` before proceeding (403 if not admin)

### RLS (Row Level Security)
- `waitlist_entries` table has RLS enabled
- Users can only see their own entry
- Admin operations use service role key to bypass RLS

### Role Management
- Roles stored in `users.role` column
- Only two roles: `'user'` (default) and `'admin'`
- Database constraint prevents invalid roles
- Admin role must be set manually (no self-promotion)

---

## Troubleshooting

### "Forbidden - Admin access required"
- Check if your user has `role = 'admin'` in database
- Log out and log back in after setting admin role
- Clear browser cache/cookies

### Magic link not sending
- Check Supabase Auth email templates are configured
- Verify `NEXT_PUBLIC_APP_URL` is correct
- Check Supabase logs for email sending errors
- Ensure user email is valid

### Conversion not tracked
- User must use the magic link sent by admin approval
- Email in waitlist must match email used for signup
- Check browser console for errors
- Verify `/auth/callback` is processing correctly

---

## Data Model

### Waitlist Entry Statuses

- **`pending`**: Waiting for admin approval
- **`approved`**: Admin approved, magic link sent, waiting for user signup
- **`converted`**: User successfully created account

### Queue Position Logic

- Auto-calculated based on `invited_count` and `created_at`
- **5+ invites**: Instant access (`queue_position = null`)
- **3+ invites**: Top 50 (`queue_position <= 50`)
- **< 3 invites**: Chronological order after top 50

### Referral Tracking

- Each entry has unique `referral_code` (6-char alphanumeric)
- `referrer_id` tracks who invited them
- `invited_count` auto-increments when someone joins via their code
- Queue position auto-updates when `invited_count` changes

---

## Advanced: Bulk Operations

### Approve All in Top 50
Run in SQL Editor:
```sql
-- Get IDs of top 50 pending entries
WITH top_50 AS (
  SELECT id
  FROM waitlist_entries
  WHERE status = 'pending'
  ORDER BY queue_position ASC NULLS FIRST
  LIMIT 50
)
UPDATE waitlist_entries
SET status = 'approved', updated_at = now()
WHERE id IN (SELECT id FROM top_50);
```

### Export Emails for Marketing
Run in SQL Editor:
```sql
SELECT email, first_name, training_goal, status
FROM waitlist_entries
WHERE status = 'approved'
ORDER BY created_at DESC;
```

---

## Support

For issues or questions:
1. Check Supabase logs
2. Check browser console for errors
3. Verify environment variables
4. Check database constraints and RLS policies
