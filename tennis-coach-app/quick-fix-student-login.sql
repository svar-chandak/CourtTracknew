-- Quick fix for student login - run this in Supabase SQL editor

-- Add missing columns to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS player_id VARCHAR UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR,
ADD COLUMN IF NOT EXISTS gender VARCHAR CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS team_level VARCHAR CHECK (team_level IN ('varsity', 'jv', 'freshman')),
ADD COLUMN IF NOT EXISTS utr_rating DECIMAL(3,1) CHECK (utr_rating >= 1 AND utr_rating <= 16);

-- Update existing players with student login credentials
-- This will generate student IDs and passwords for all existing players
UPDATE players 
SET 
    player_id = upper(substring(split_part(name, ' ', 1) from 1 for 2)) || 
                upper(substring(split_part(name, ' ', array_length(string_to_array(name, ' '), 1)) from 1 for 2)) || 
                floor(100 + random() * 900)::text,
    password_hash = array_to_string(
        ARRAY(
            SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 
                         floor(random() * 62 + 1)::integer, 1)
            FROM generate_series(1, 8)
        ), ''
    )
WHERE player_id IS NULL OR password_hash IS NULL;
