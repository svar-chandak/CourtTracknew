-- Complete fix for student login - run this in Supabase SQL editor

-- First, add the missing columns if they don't exist
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS player_id VARCHAR,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR,
ADD COLUMN IF NOT EXISTS gender VARCHAR CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS team_level VARCHAR CHECK (team_level IN ('varsity', 'jv', 'freshman')),
ADD COLUMN IF NOT EXISTS utr_rating DECIMAL(3,1) CHECK (utr_rating >= 1 AND utr_rating <= 16);

-- Add unique constraint to player_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_player_id_key') THEN
        ALTER TABLE players ADD CONSTRAINT players_player_id_key UNIQUE (player_id);
    END IF;
END $$;

-- Update ALL existing players with student login credentials
-- This will generate student IDs and passwords for every player
UPDATE players 
SET 
    player_id = CASE 
        WHEN player_id IS NULL OR player_id = '' THEN
            upper(substring(split_part(name, ' ', 1) from 1 for 2)) || 
            upper(substring(split_part(name, ' ', array_length(string_to_array(name, ' '), 1)) from 1 for 2)) || 
            floor(100 + random() * 900)::text
        ELSE player_id
    END,
    password_hash = CASE 
        WHEN password_hash IS NULL OR password_hash = '' THEN
            array_to_string(
                ARRAY(
                    SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 
                                 floor(random() * 62 + 1)::integer, 1)
                    FROM generate_series(1, 8)
                ), ''
            )
        ELSE password_hash
    END
WHERE player_id IS NULL OR password_hash IS NULL OR player_id = '' OR password_hash = '';

-- Show the results
SELECT 
    name, 
    player_id, 
    password_hash,
    gender,
    team_level
FROM players 
ORDER BY name;
