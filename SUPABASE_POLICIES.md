# Supabase RLS Policies for one_touch_sessions

Since we're using the service role key in API routes, RLS should be bypassed automatically. However, if you're still seeing errors, you have two options:

## Option 1: Disable RLS (Recommended for service role usage)

If you're using service role key exclusively in API routes, you can disable RLS on the `one_touch_sessions` table:

1. Go to Supabase Dashboard → Table Editor → `one_touch_sessions`
2. Click "Disable RLS" button

## Option 2: Create proper policies for service_role

If you want to keep RLS enabled, ensure you have these policies:

### INSERT Policy
- **Name**: `service_role_insert`
- **Command**: `INSERT`
- **Applied to**: `service_role`
- **Policy**: Allow all (no conditions needed)

### SELECT Policy
- **Name**: `service_role_select`
- **Command**: `SELECT`
- **Applied to**: `service_role`
- **Policy**: Allow all (no conditions needed)

### UPDATE Policy (Required!)
- **Name**: `service_role_update`
- **Command**: `UPDATE`
- **Applied to**: `service_role`
- **Policy**: Allow all (no conditions needed)

### DELETE Policy (Optional, for cleanup)
- **Name**: `service_role_delete`
- **Command**: `DELETE`
- **Applied to**: `service_role`
- **Policy**: Allow all (no conditions needed)

## Current Issue

Based on your screenshot, you have INSERT and SELECT policies, but you're missing the UPDATE policy which is needed for the `/api/one-touch/claim` endpoint.



