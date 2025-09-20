# Debug Player Addition Issue

## Most Likely Cause
The database doesn't have the new columns (`gender`, `team_level`, `utr_rating`) that we added to the app.

## Quick Fix
Run this SQL in your Supabase SQL Editor:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name IN ('gender', 'team_level', 'utr_rating', 'skill_level', 'email', 'phone');
```

## If columns are missing, run this:
```sql
-- Add missing columns
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS team_level VARCHAR(20) CHECK (team_level IN ('varsity', 'jv', 'freshman')),
ADD COLUMN IF NOT EXISTS utr_rating DECIMAL(3,1) CHECK (utr_rating >= 1 AND utr_rating <= 16);

-- Remove old columns if they exist
ALTER TABLE players 
DROP COLUMN IF EXISTS skill_level,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone;
```

## Alternative: Temporary Fix
If you want to test immediately, temporarily remove the new fields from the add player dialog by commenting out lines 62, 65, and 66 in the add-player-dialog.tsx file.

## Check Browser Console
1. Open browser dev tools (F12)
2. Try to add a player
3. Look for any error messages in the console
4. Share the error message if you see one
