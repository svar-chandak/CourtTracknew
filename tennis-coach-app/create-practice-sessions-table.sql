-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    practice_date DATE NOT NULL,
    practice_time TIME,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    practice_session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_session_or_match CHECK (
        (practice_session_id IS NOT NULL AND match_id IS NULL) OR 
        (practice_session_id IS NULL AND match_id IS NOT NULL)
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_team_id ON public.practice_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_date ON public.practice_sessions(practice_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON public.attendance_records(practice_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_match_id ON public.attendance_records(match_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_player_id ON public.attendance_records(player_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for practice_sessions
CREATE POLICY "Coaches can view practice sessions for their teams" ON public.practice_sessions
    FOR SELECT USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can insert practice sessions for their teams" ON public.practice_sessions
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can update practice sessions for their teams" ON public.practice_sessions
    FOR UPDATE USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can delete practice sessions for their teams" ON public.practice_sessions
    FOR DELETE USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

-- Create RLS policies for attendance_records
CREATE POLICY "Coaches can view attendance records for their teams" ON public.attendance_records
    FOR SELECT USING (
        player_id IN (
            SELECT p.id FROM public.players p
            JOIN public.teams t ON p.team_id = t.id
            WHERE t.coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can insert attendance records for their teams" ON public.attendance_records
    FOR INSERT WITH CHECK (
        player_id IN (
            SELECT p.id FROM public.players p
            JOIN public.teams t ON p.team_id = t.id
            WHERE t.coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can update attendance records for their teams" ON public.attendance_records
    FOR UPDATE USING (
        player_id IN (
            SELECT p.id FROM public.players p
            JOIN public.teams t ON p.team_id = t.id
            WHERE t.coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can delete attendance records for their teams" ON public.attendance_records
    FOR DELETE USING (
        player_id IN (
            SELECT p.id FROM public.players p
            JOIN public.teams t ON p.team_id = t.id
            WHERE t.coach_id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.practice_sessions IS 'Stores practice session information for attendance tracking';
COMMENT ON TABLE public.attendance_records IS 'Stores individual player attendance records for practices and matches';
COMMENT ON COLUMN public.attendance_records.status IS 'Attendance status: present, absent, late, or excused';
COMMENT ON COLUMN public.attendance_records.practice_session_id IS 'Reference to practice session (mutually exclusive with match_id)';
COMMENT ON COLUMN public.attendance_records.match_id IS 'Reference to match (mutually exclusive with practice_session_id)';
