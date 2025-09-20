-- Complete Schema Fix for Tennis Coach App
-- Run this in your Supabase SQL Editor to fix all missing columns

-- 1. Fix matches table - add match_type column
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT 'team_match' CHECK (match_type IN ('team_match', 'individual'));

-- Update existing records
UPDATE matches 
SET match_type = 'team_match' 
WHERE match_type IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_matches_match_type ON matches(match_type);

-- 2. Fix players table - add missing columns and remove old ones
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS team_level VARCHAR(20) CHECK (team_level IN ('varsity', 'jv', 'freshman')),
ADD COLUMN IF NOT EXISTS utr_rating DECIMAL(3,1) CHECK (utr_rating >= 1 AND utr_rating <= 16);

-- Remove old columns if they exist
ALTER TABLE players 
DROP COLUMN IF EXISTS skill_level,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone;

-- Create indexes for players
CREATE INDEX IF NOT EXISTS idx_players_gender ON players(gender);
CREATE INDEX IF NOT EXISTS idx_players_team_level ON players(team_level);
CREATE INDEX IF NOT EXISTS idx_players_utr_rating ON players(utr_rating);

-- Set default values for existing players
UPDATE players 
SET gender = 'male' 
WHERE gender IS NULL;

-- 3. Fix teams table - add gender column if missing
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS team_gender VARCHAR(10) CHECK (team_gender IN ('boys', 'girls', 'mixed'));

-- 4. Fix match_results table - add division column if missing
ALTER TABLE match_results 
ADD COLUMN IF NOT EXISTS division VARCHAR(20) CHECK (division IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles'));

-- 5. Fix lineups table - add division column if missing
ALTER TABLE lineups 
ADD COLUMN IF NOT EXISTS division VARCHAR(20) CHECK (division IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles'));

-- 6. Verify all tables have the correct structure
SELECT 'matches' as table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'matches' 
UNION ALL
SELECT 'players' as table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'players'
UNION ALL
SELECT 'teams' as table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'teams'
UNION ALL
SELECT 'match_results' as table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'match_results'
UNION ALL
SELECT 'lineups' as table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'lineups'
ORDER BY table_name, column_name;
