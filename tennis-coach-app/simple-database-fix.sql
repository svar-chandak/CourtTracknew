-- Simple database fix - run this in Supabase SQL Editor

-- Step 1: Add the missing columns
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS player_id VARCHAR,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR;

-- Step 2: Update all existing players with student credentials
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

-- Step 3: Check the results
SELECT name, player_id, password_hash FROM players LIMIT 5;
