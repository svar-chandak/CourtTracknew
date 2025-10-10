-- Complete Tennis Coach Management App Database Schema
-- This schema supports both coach and student authentication
-- Run this in your Supabase SQL editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Coaches table
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    school_name VARCHAR NOT NULL,
    team_code VARCHAR(6) UNIQUE NOT NULL,
    phone VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams/Schools table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_code VARCHAR(6) UNIQUE NOT NULL,
    school_name VARCHAR NOT NULL,
    coach_id UUID REFERENCES coaches(id),
    team_level VARCHAR DEFAULT 'varsity' CHECK (team_level IN ('varsity', 'jv', 'freshman')),
    gender VARCHAR DEFAULT 'mixed' CHECK (gender IN ('boys', 'girls', 'mixed')),
    season_record_wins INTEGER DEFAULT 0,
    season_record_losses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Players table (with student login support)
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id VARCHAR UNIQUE NOT NULL, -- Student login ID
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE, -- Student login email
    password_hash VARCHAR, -- Student login password
    grade INTEGER CHECK (grade >= 9 AND grade <= 12),
    gender VARCHAR NOT NULL CHECK (gender IN ('male', 'female')),
    position_preference VARCHAR CHECK (position_preference IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles')),
    team_level VARCHAR CHECK (team_level IN ('varsity', 'jv', 'freshman')),
    utr_rating DECIMAL(3,1) CHECK (utr_rating >= 1.0 AND utr_rating <= 16.0),
    phone VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    match_date DATE NOT NULL,
    match_time TIME,
    location VARCHAR,
    match_type VARCHAR DEFAULT 'team_match' CHECK (match_type IN ('team_match', 'individual')),
    status VARCHAR DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Team Match Divisions (for detailed match results)
CREATE TABLE team_match_divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    division VARCHAR NOT NULL CHECK (division IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles')),
    position_number INTEGER NOT NULL, -- 1st, 2nd, 3rd, etc.
    home_player_ids UUID[],
    away_player_ids UUID[],
    home_sets_won INTEGER DEFAULT 0,
    away_sets_won INTEGER DEFAULT 0,
    winner VARCHAR CHECK (winner IN ('home', 'away')),
    score_details JSONB, -- For detailed set scores
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Individual Match Results (Singles/Doubles) - Legacy table for backward compatibility
CREATE TABLE match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    position VARCHAR NOT NULL,
    home_player_names VARCHAR[],
    away_player_names VARCHAR[],
    home_sets_won INTEGER DEFAULT 0,
    away_sets_won INTEGER DEFAULT 0,
    score_details JSONB,
    winner VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    tournament_code VARCHAR(8) UNIQUE NOT NULL,
    creator_id UUID REFERENCES coaches(id),
    tournament_type VARCHAR NOT NULL CHECK (tournament_type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'dual_match')),
    max_teams INTEGER DEFAULT 8,
    status VARCHAR DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed')),
    start_date DATE,
    location VARCHAR,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tournament Participants
CREATE TABLE tournament_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    seed_number INTEGER,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

-- Tournament Matches
CREATE TABLE tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    team1_id UUID REFERENCES teams(id),
    team2_id UUID REFERENCES teams(id),
    winner_team_id UUID REFERENCES teams(id),
    match_date DATE,
    match_time TIME,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    score_summary VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Challenge Matches (for lineup determination)
CREATE TABLE challenge_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    challenger_player_id UUID REFERENCES players(id),
    challenged_player_id UUID REFERENCES players(id),
    match_date DATE NOT NULL,
    winner_player_id UUID REFERENCES players(id),
    score VARCHAR,
    approved_by UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Team Lineups
CREATE TABLE lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    match_id UUID REFERENCES matches(id),
    division VARCHAR NOT NULL CHECK (division IN ('boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles')),
    position_number INTEGER NOT NULL, -- 1st, 2nd, 3rd, etc.
    player_ids UUID[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    coach_id UUID REFERENCES coaches(id),
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    announcement_type VARCHAR DEFAULT 'general' CHECK (announcement_type IN ('general', 'match_reminder', 'practice_change', 'emergency')),
    is_urgent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES players(id),
    event_type VARCHAR NOT NULL CHECK (event_type IN ('practice', 'match')),
    event_id UUID, -- Reference to practice session or match
    event_date DATE NOT NULL,
    status VARCHAR NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    recorded_by UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Practice Sessions
CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    practice_date DATE NOT NULL,
    practice_time TIME,
    location VARCHAR,
    description TEXT,
    coach_id UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id),
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_coaches_email ON coaches(email);
CREATE INDEX idx_coaches_team_code ON coaches(team_code);
CREATE INDEX idx_teams_coach_id ON teams(coach_id);
CREATE INDEX idx_teams_team_code ON teams(team_code);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_player_id ON players(player_id);
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_team_match_divisions_match_id ON team_match_divisions(match_id);
CREATE INDEX idx_match_results_match_id ON match_results(match_id);
CREATE INDEX idx_tournaments_code ON tournaments(tournament_code);
CREATE INDEX idx_tournament_teams_tournament ON tournament_teams(tournament_id);
CREATE INDEX idx_tournament_teams_team ON tournament_teams(team_id);
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_challenge_matches_team ON challenge_matches(team_id);
CREATE INDEX idx_lineups_team ON lineups(team_id);
CREATE INDEX idx_lineups_match ON lineups(match_id);
CREATE INDEX idx_announcements_team ON announcements(team_id);
CREATE INDEX idx_attendance_team ON attendance(team_id);
CREATE INDEX idx_attendance_player ON attendance(player_id);
CREATE INDEX idx_practice_sessions_team ON practice_sessions(team_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_match_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Coaches can only see and modify their own data
CREATE POLICY "Coaches can view own profile" ON coaches
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Coaches can update own profile" ON coaches
    FOR UPDATE USING (auth.uid() = id);

-- Teams policies
CREATE POLICY "Coaches can view own team" ON teams
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own team" ON teams
    FOR UPDATE USING (auth.uid() = coach_id);

-- Players policies - coaches can manage their team's players
CREATE POLICY "Team coaches can view players" ON players
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = players.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage players" ON players
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = players.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Players can view their own data
CREATE POLICY "Players can view own profile" ON players
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Players can update own profile" ON players
    FOR UPDATE USING (auth.uid() = id);

-- Matches policies
CREATE POLICY "Coaches can view relevant matches" ON matches
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can create matches" ON matches
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Coaches can update relevant matches" ON matches
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
            AND teams.coach_id = auth.uid()
        )
    );

-- Players can view matches for their team
CREATE POLICY "Players can view team matches" ON matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM players 
            JOIN teams ON teams.id = players.team_id
            WHERE players.id = auth.uid()
            AND (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
        )
    );

-- Team match divisions policies
CREATE POLICY "Coaches can view team match divisions" ON team_match_divisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = team_match_divisions.match_id
            AND (
                matches.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM teams 
                    WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
                    AND teams.coach_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Coaches can manage team match divisions" ON team_match_divisions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = team_match_divisions.match_id
            AND (
                matches.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM teams 
                    WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
                    AND teams.coach_id = auth.uid()
                )
            )
        )
    );

-- Players can view team match divisions for their team
CREATE POLICY "Players can view team match divisions" ON team_match_divisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches 
            JOIN players ON players.team_id = matches.home_team_id OR players.team_id = matches.away_team_id
            WHERE matches.id = team_match_divisions.match_id
            AND players.id = auth.uid()
        )
    );

-- Match results policies
CREATE POLICY "Coaches can view match results" ON match_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = match_results.match_id
            AND (
                matches.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM teams 
                    WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
                    AND teams.coach_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Coaches can manage match results" ON match_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = match_results.match_id
            AND (
                matches.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM teams 
                    WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
                    AND teams.coach_id = auth.uid()
                )
            )
        )
    );

-- Players can view match results for their team
CREATE POLICY "Players can view team match results" ON match_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches 
            JOIN players ON players.team_id = matches.home_team_id OR players.team_id = matches.away_team_id
            WHERE matches.id = match_results.match_id
            AND players.id = auth.uid()
        )
    );

-- Tournaments policies
CREATE POLICY "Anyone can view tournaments" ON tournaments
    FOR SELECT USING (true);

CREATE POLICY "Coaches can create tournaments" ON tournaments
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Tournament creators can update tournaments" ON tournaments
    FOR UPDATE USING (creator_id = auth.uid());

-- Tournament teams policies
CREATE POLICY "Anyone can view tournament teams" ON tournament_teams
    FOR SELECT USING (true);

CREATE POLICY "Team coaches can join tournaments" ON tournament_teams
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = tournament_teams.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can leave tournaments" ON tournament_teams
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = tournament_teams.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Tournament matches policies
CREATE POLICY "Anyone can view tournament matches" ON tournament_matches
    FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage matches" ON tournament_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tournaments 
            WHERE tournaments.id = tournament_matches.tournament_id 
            AND tournaments.creator_id = auth.uid()
        )
    );

-- Challenge matches policies
CREATE POLICY "Team coaches can view challenge matches" ON challenge_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = challenge_matches.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage challenge matches" ON challenge_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = challenge_matches.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Lineups policies
CREATE POLICY "Team coaches can view lineups" ON lineups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = lineups.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage lineups" ON lineups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = lineups.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Players can view lineups for their team
CREATE POLICY "Players can view team lineups" ON lineups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.team_id = lineups.team_id
            AND players.id = auth.uid()
        )
    );

-- Announcements policies
CREATE POLICY "Team coaches can view announcements" ON announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = announcements.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage announcements" ON announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = announcements.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Players can view team announcements
CREATE POLICY "Players can view team announcements" ON announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.team_id = announcements.team_id
            AND players.id = auth.uid()
        )
    );

-- Attendance policies
CREATE POLICY "Team coaches can view attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = attendance.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = attendance.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Players can view their own attendance
CREATE POLICY "Players can view own attendance" ON attendance
    FOR SELECT USING (player_id = auth.uid());

-- Practice sessions policies
CREATE POLICY "Team coaches can view practice sessions" ON practice_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = practice_sessions.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage practice sessions" ON practice_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = practice_sessions.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Players can view team practice sessions
CREATE POLICY "Players can view team practice sessions" ON practice_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.team_id = practice_sessions.team_id
            AND players.id = auth.uid()
        )
    );

-- Notification preferences policies
CREATE POLICY "Players can view own notification preferences" ON notification_preferences
    FOR SELECT USING (player_id = auth.uid());

CREATE POLICY "Players can manage own notification preferences" ON notification_preferences
    FOR ALL USING (player_id = auth.uid());

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for coaches table
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for notification_preferences table
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique player ID
CREATE OR REPLACE FUNCTION generate_player_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generate a 6-character alphanumeric ID
        new_id := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if it already exists
        SELECT COUNT(*) INTO exists_count FROM players WHERE player_id = new_id;
        
        -- If it doesn't exist, we can use it
        IF exists_count = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create player with auto-generated player_id
CREATE OR REPLACE FUNCTION create_player_with_id(
    p_team_id UUID,
    p_name VARCHAR,
    p_email VARCHAR,
    p_password_hash VARCHAR,
    p_grade INTEGER DEFAULT NULL,
    p_gender VARCHAR,
    p_position_preference VARCHAR DEFAULT NULL,
    p_team_level VARCHAR DEFAULT NULL,
    p_utr_rating DECIMAL DEFAULT NULL,
    p_phone VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_player_id UUID;
    generated_player_id VARCHAR;
BEGIN
    -- Generate unique player ID
    generated_player_id := generate_player_id();
    
    -- Insert the player
    INSERT INTO players (
        team_id, player_id, name, email, password_hash, grade, gender,
        position_preference, team_level, utr_rating, phone
    ) VALUES (
        p_team_id, generated_player_id, p_name, p_email, p_password_hash, p_grade, p_gender,
        p_position_preference, p_team_level, p_utr_rating, p_phone
    ) RETURNING id INTO new_player_id;
    
    RETURN new_player_id;
END;
$$ LANGUAGE plpgsql;

