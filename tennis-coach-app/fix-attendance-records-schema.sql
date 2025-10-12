-- Fix attendance_records table to include team_id and proper relationships
ALTER TABLE public.attendance_records 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_team_id ON public.attendance_records(team_id);

-- Update RLS policies to include team_id
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

-- Add comment for documentation
COMMENT ON COLUMN public.attendance_records.team_id IS 'Reference to the team this attendance record belongs to';
