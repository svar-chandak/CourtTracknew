-- Remove email and phone fields from players table
-- Run this in Supabase SQL Editor

-- Remove email and phone columns from players table
ALTER TABLE players 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone;

-- Note: This will permanently delete all email and phone data for existing players
-- Make sure to backup any important contact information before running this
