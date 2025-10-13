-- Add student login columns to players table
-- Run this in your Supabase SQL editor

-- Add the missing columns to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS player_id VARCHAR UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR,
ADD COLUMN IF NOT EXISTS gender VARCHAR CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS team_level VARCHAR CHECK (team_level IN ('varsity', 'jv', 'freshman')),
ADD COLUMN IF NOT EXISTS utr_rating DECIMAL(3,1) CHECK (utr_rating >= 1 AND utr_rating <= 16);

-- Create a function to generate student ID
CREATE OR REPLACE FUNCTION generate_student_id(player_name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    name_parts VARCHAR[];
    first_name VARCHAR;
    last_name VARCHAR;
    first_two VARCHAR;
    last_two VARCHAR;
    random_digits INTEGER;
    student_id VARCHAR;
BEGIN
    -- Split name into parts
    name_parts := string_to_array(trim(player_name), ' ');
    first_name := name_parts[1];
    last_name := name_parts[array_length(name_parts, 1)];
    
    -- Get first 2 characters of first and last name
    first_two := upper(substring(first_name from 1 for 2));
    last_two := upper(substring(last_name from 1 for 2));
    
    -- Generate random 3-digit number
    random_digits := floor(100 + random() * 900);
    
    -- Combine to create student ID
    student_id := first_two || last_two || random_digits;
    
    RETURN student_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate random password
CREATE OR REPLACE FUNCTION generate_random_password()
RETURNS VARCHAR AS $$
DECLARE
    chars VARCHAR := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    password VARCHAR := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        password := password || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    RETURN password;
END;
$$ LANGUAGE plpgsql;

-- Update existing players with auto-generated student login credentials
UPDATE players 
SET 
    player_id = generate_student_id(name),
    password_hash = generate_random_password()
WHERE player_id IS NULL OR password_hash IS NULL;

-- Clean up functions (optional)
DROP FUNCTION IF EXISTS generate_student_id(VARCHAR);
DROP FUNCTION IF EXISTS generate_random_password();
