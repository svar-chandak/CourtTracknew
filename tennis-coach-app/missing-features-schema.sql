-- Missing Features Database Schema
-- Run this in your Supabase SQL editor to add announcements and attendance tracking

-- Announcements table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES coaches(id),
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    announcement_type VARCHAR DEFAULT 'general', -- general, match_reminder, practice_change, emergency
    is_urgent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance tracking table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    event_type VARCHAR NOT NULL, -- practice, match
    event_id UUID, -- references matches.id or practice sessions
    event_date DATE NOT NULL,
    status VARCHAR NOT NULL, -- present, absent, late, excused
    notes TEXT,
    recorded_by UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Practice sessions table (for attendance tracking)
CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    practice_date DATE NOT NULL,
    practice_time TIME,
    location VARCHAR,
    description TEXT,
    coach_id UUID REFERENCES coaches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Player notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_announcements_team_id ON announcements(team_id);
CREATE INDEX idx_announcements_coach_id ON announcements(coach_id);
CREATE INDEX idx_announcements_sent_at ON announcements(sent_at);
CREATE INDEX idx_attendance_team_id ON attendance(team_id);
CREATE INDEX idx_attendance_player_id ON attendance(player_id);
CREATE INDEX idx_attendance_event_date ON attendance(event_date);
CREATE INDEX idx_practice_sessions_team_id ON practice_sessions(team_id);
CREATE INDEX idx_practice_sessions_date ON practice_sessions(practice_date);
CREATE INDEX idx_notification_preferences_player_id ON notification_preferences(player_id);

-- Enable RLS on new tables
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
CREATE POLICY "Team coaches can view team announcements" ON announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = announcements.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can create announcements" ON announcements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = announcements.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can update their announcements" ON announcements
    FOR UPDATE USING (
        coach_id = auth.uid()
    );

CREATE POLICY "Team coaches can delete their announcements" ON announcements
    FOR DELETE USING (
        coach_id = auth.uid()
    );

-- RLS Policies for attendance
CREATE POLICY "Team coaches can view team attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = attendance.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage team attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = attendance.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- RLS Policies for practice sessions
CREATE POLICY "Team coaches can view team practice sessions" ON practice_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = practice_sessions.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage team practice sessions" ON practice_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = practice_sessions.team_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- RLS Policies for notification preferences
CREATE POLICY "Team coaches can view player notification preferences" ON notification_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM players 
            JOIN teams ON teams.id = players.team_id
            WHERE players.id = notification_preferences.player_id 
            AND teams.coach_id = auth.uid()
        )
    );

CREATE POLICY "Team coaches can manage player notification preferences" ON notification_preferences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM players 
            JOIN teams ON teams.id = players.team_id
            WHERE players.id = notification_preferences.player_id 
            AND teams.coach_id = auth.uid()
        )
    );

-- Create trigger for notification_preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
