-- Fix Players Table - Add Missing Columns
-- Run this in Supabase SQL Editor

-- Add the missing columns to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS team_level VARCHAR(20) CHECK (team_level IN ('varsity', 'jv', 'freshman')),
ADD COLUMN IF NOT EXISTS utr_rating DECIMAL(3,1) CHECK (utr_rating >= 1 AND utr_rating <= 16);

-- Remove old columns if they exist
ALTER TABLE players 
DROP COLUMN IF EXISTS skill_level,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_gender ON players(gender);
CREATE INDEX IF NOT EXISTS idx_players_team_level ON players(team_level);
CREATE INDEX IF NOT EXISTS idx_players_utr_rating ON players(utr_rating);

-- Update existing players with default values if needed
UPDATE players 
SET gender = 'male' 
WHERE gender IS NULL;

-- Note: You may want to manually update the gender values for existing players
-- based on their actual gender after running this migration
