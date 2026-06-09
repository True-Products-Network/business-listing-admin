# Ownership Transfer Fix

## Problem
The ownership transfer functionality in the admin panel was not working. When attempting to transfer ownership of a business listing to a new user:
1. The UI showed a success message
2. But the ownership was not actually transferred in the database
3. The listing still showed the old owner

## Root Cause
A database trigger `prevent_business_ownership_change` was added in migration `004_security_hardening.sql` to prevent unauthorized ownership changes. This trigger blocked ALL ownership changes, including legitimate admin transfers.

## Solution

### 1. Created Admin API Endpoint
Created `/src/app/api/admin/transfer-ownership/route.ts` - a server-side API endpoint that:
- Uses the Supabase service role key (bypasses RLS)
- Attempts to call a database function `admin_transfer_ownership` if it exists
- Falls back to direct database update
- Logs the ownership transfer in `admin_activity_log`

### 2. Updated Frontend Components
Updated both:
- `/src/app/admin/listings/page.tsx` - The "Change Owner" dialog
- `/src/app/admin/claims/page.tsx` - The claims approval process

Both now call the new API endpoint instead of direct Supabase updates.

### 3. Database Migration
Created `/supabase/migrations/005_fix_ownership_transfer.sql` which:
- Creates an `admin_transfer_ownership` function that bypasses the trigger
- Modifies the `prevent_ownership_change` trigger to allow service role bypass
- This allows the admin API to work while still protecting against unauthorized changes

## Deployment Steps

1. **Apply the database migration:**
   ```bash
   # Run this SQL in your Supabase SQL Editor
   # Or use Supabase CLI:
   supabase db push
   ```

2. **Deploy the code changes:**
   - The API endpoint and frontend changes are ready to deploy
   - No environment variable changes needed

3. **Verify the fix:**
   - Go to Admin → Listings
   - Click "Owner" on any listing
   - Enter a new owner's email (must have an account)
   - Verify ownership is transferred
   - Check the listing shows the new owner

## Security Considerations
- The API endpoint uses service role key (server-side only)
- The database trigger still blocks client-side ownership changes
- Only admins can transfer ownership through the admin panel
- All transfers are logged in `admin_activity_log`

## Files Changed
- `/src/app/api/admin/transfer-ownership/route.ts` (new)
- `/src/app/admin/listings/page.tsx` (updated)
- `/src/app/admin/claims/page.tsx` (updated)
- `/supabase/migrations/005_fix_ownership_transfer.sql` (new)