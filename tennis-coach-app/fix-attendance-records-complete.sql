-- Complete fix for attendance_records table to match the expected schema
-- First, add the missing columns
ALTER TABLE public.attendance_records 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN ('practice', 'match')),
ADD COLUMN IF NOT EXISTS event_id UUID,
ADD COLUMN IF NOT EXISTS event_date DATE,
ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update existing records to have the correct team_id based on the player's team
UPDATE public.attendance_records 
SET team_id = (
    SELECT p.team_id 
    FROM public.players p 
    WHERE p.id = attendance_records.player_id
)
WHERE team_id IS NULL;

-- Make team_id NOT NULL after populating existing records
ALTER TABLE public.attendance_records 
ALTER COLUMN team_id SET NOT NULL;

-- Set default values for existing records
UPDATE public.attendance_records 
SET 
    event_type = 'practice',
    event_date = COALESCE(created_at::date, CURRENT_DATE),
    recorded_by = (
        SELECT t.coach_id 
        FROM public.teams t 
        WHERE t.id = attendance_records.team_id
    )
WHERE event_type IS NULL OR event_date IS NULL OR recorded_by IS NULL;

-- Make event_type and event_date NOT NULL after setting defaults
ALTER TABLE public.attendance_records 
ALTER COLUMN event_type SET NOT NULL,
ALTER COLUMN event_date SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_team_id ON public.attendance_records(team_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_event_type ON public.attendance_records(event_type);
CREATE INDEX IF NOT EXISTS idx_attendance_records_event_id ON public.attendance_records(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_event_date ON public.attendance_records(event_date);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Coaches can view attendance records for their teams" ON public.attendance_records;
DROP POLICY IF EXISTS "Coaches can insert attendance records for their teams" ON public.attendance_records;
DROP POLICY IF EXISTS "Coaches can update attendance records for their teams" ON public.attendance_records;
DROP POLICY IF EXISTS "Coaches can delete attendance records for their teams" ON public.attendance_records;

-- Create new RLS policies using team_id
CREATE POLICY "Coaches can view attendance records for their teams" ON public.attendance_records
    FOR SELECT USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can insert attendance records for their teams" ON public.attendance_records
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can update attendance records for their teams" ON public.attendance_records
    FOR UPDATE USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can delete attendance records for their teams" ON public.attendance_records
    FOR DELETE USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE coach_id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON COLUMN public.attendance_records.team_id IS 'Reference to the team this attendance record belongs to';
COMMENT ON COLUMN public.attendance_records.event_type IS 'Type of event: practice or match';
COMMENT ON COLUMN public.attendance_records.event_id IS 'ID of the specific practice session or match';
COMMENT ON COLUMN public.attendance_records.event_date IS 'Date of the event';
COMMENT ON COLUMN public.attendance_records.recorded_by IS 'User ID of the coach who recorded this attendance';
