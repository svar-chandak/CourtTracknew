import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address')
export const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number').optional()
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters')
export const teamCodeSchema = z.string().length(6, 'Team code must be exactly 6 characters').regex(/^[A-Z0-9]+$/, 'Team code must contain only uppercase letters and numbers')

// Player validation schemas
export const playerFormSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  grade: z.number().min(9, 'Grade must be at least 9').max(12, 'Grade must be at most 12').optional(),
  gender: z.enum(['male', 'female'], { required_error: 'Please select a gender' }),
  team_level: z.enum(['varsity', 'jv', 'freshman'], { required_error: 'Please select a team level' }),
  position_preference: z.enum(['boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles']).optional(),
  utr_rating: z.number().min(1.0, 'UTR rating must be at least 1.0').max(16.0, 'UTR rating must be at most 16.0').optional(),
  player_id: z.string().min(4, 'Player ID must be at least 4 characters').optional(),
  password_hash: z.string().min(6, 'Password must be at least 6 characters').optional(),
})

// Coach validation schemas
export const coachFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: nameSchema,
  schoolName: z.string().min(2, 'School name must be at least 2 characters').max(100, 'School name must be less than 100 characters'),
  phone: phoneSchema,
})

// Team validation schemas
export const teamFormSchema = z.object({
  school_name: z.string().min(2, 'School name must be at least 2 characters').max(100, 'School name must be less than 100 characters'),
  team_level: z.enum(['varsity', 'jv', 'freshman']),
  gender: z.enum(['boys', 'girls', 'mixed']),
})

// Match validation schemas
export const matchFormSchema = z.object({
  home_team_id: z.string().uuid('Invalid home team ID'),
  away_team_id: z.string().uuid('Invalid away team ID'),
  match_date: z.string().min(1, 'Match date is required'),
  match_time: z.string().optional(),
  location: z.string().max(200, 'Location must be less than 200 characters').optional(),
  match_type: z.enum(['team_match', 'individual']),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

// Tournament validation schemas
export const tournamentFormSchema = z.object({
  name: z.string().min(2, 'Tournament name must be at least 2 characters').max(100, 'Tournament name must be less than 100 characters'),
  tournament_type: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'dual_match']),
  max_teams: z.number().min(2, 'Tournament must have at least 2 teams').max(32, 'Tournament cannot have more than 32 teams'),
  start_date: z.string().optional(),
  location: z.string().max(200, 'Location must be less than 200 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
})

// Score entry validation schemas
export const scoreEntrySchema = z.object({
  position: z.string().min(1, 'Position is required'),
  sets: z.array(z.object({
    homeScore: z.number().min(0, 'Score cannot be negative').max(7, 'Score cannot exceed 7'),
    awayScore: z.number().min(0, 'Score cannot be negative').max(7, 'Score cannot exceed 7'),
  })).min(1, 'At least one set is required'),
})

// Attendance validation schemas
export const attendanceFormSchema = z.object({
  player_id: z.string().uuid('Invalid player ID'),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().max(200, 'Notes must be less than 200 characters').optional(),
})

// Utility functions for validation
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success
}

export const validatePhone = (phone: string): boolean => {
  return phoneSchema.safeParse(phone).success
}

export const validateTeamCode = (code: string): boolean => {
  return teamCodeSchema.safeParse(code).success
}

// Form field validation helpers
export const getFieldError = (errors: any, fieldName: string): string | undefined => {
  return errors[fieldName]?.message
}

export const hasFieldError = (errors: any, fieldName: string): boolean => {
  return !!errors[fieldName]
}

// Type exports for form data
export type PlayerFormData = z.infer<typeof playerFormSchema>
export type CoachFormData = z.infer<typeof coachFormSchema>
export type TeamFormData = z.infer<typeof teamFormSchema>
export type MatchFormData = z.infer<typeof matchFormSchema>
export type TournamentFormData = z.infer<typeof tournamentFormSchema>
export type ScoreEntryFormData = z.infer<typeof scoreEntrySchema>
export type AttendanceFormData = z.infer<typeof attendanceFormSchema>
