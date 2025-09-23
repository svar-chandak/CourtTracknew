import { z } from 'zod'

// Auth validations
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  school_name: z.string().min(2, 'School name must be at least 2 characters'),
  phone: z.string().optional(),
})

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  school_name: z.string().min(2, 'School name must be at least 2 characters'),
  phone: z.string().optional(),
})

// Team validations
export const teamSchema = z.object({
  team_level: z.enum(['varsity', 'jv', 'freshman']),
  gender: z.enum(['boys', 'girls', 'mixed']),
})

// Player validations
export const playerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  gender: z.enum(['male', 'female']),
  grade: z.number().min(9).max(12).optional(),
  position_preference: z.enum(['boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles']).optional(),
  team_level: z.enum(['varsity', 'jv', 'freshman']).optional(),
  utr_rating: z.string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    })
    .refine((val) => val === undefined || (val >= 1 && val <= 16), {
      message: 'UTR rating must be between 1 and 16',
    }),
})

// Player form input schema (for forms that accept string UTR)
export const playerFormInputSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  gender: z.enum(['male', 'female']),
  grade: z.number().min(9).max(12).optional(),
  position_preference: z.enum(['boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles']).optional(),
  team_level: z.enum(['varsity', 'jv', 'freshman']).optional(),
  utr_rating: z.string().optional(),
})

// Match validations
export const matchSchema = z.object({
  home_team_id: z.string().uuid('Invalid team ID'),
  away_team_id: z.string().uuid('Invalid team ID'),
  match_date: z.string().min(1, 'Match date is required'),
  match_time: z.string().optional(),
  location: z.string().optional(),
  match_type: z.enum(['team_match', 'individual']),
  notes: z.string().optional(),
}).refine((data) => data.home_team_id !== data.away_team_id, {
  message: 'Home and away teams must be different',
  path: ['away_team_id'],
})

// Tournament validations
export const tournamentSchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters'),
  tournament_type: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'dual_match']),
  max_teams: z.number().min(2).max(32),
  start_date: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
})

export const joinTournamentSchema = z.object({
  tournament_code: z.string().length(8, 'Tournament code must be 8 characters'),
})

// Lineup validations
export const lineupSchema = z.object({
  position: z.enum(['1S', '2S', '3S', '4S', '5S', '6S', '1D', '2D', '3D']),
  player_ids: z.array(z.string().uuid()).min(1).max(2),
})

// Challenge match validations
export const challengeMatchSchema = z.object({
  challenged_player_id: z.string().uuid('Invalid player ID'),
  match_date: z.string().min(1, 'Match date is required'),
}).refine((data) => data.challenged_player_id, {
  message: 'Please select a player to challenge',
})

// Score entry validations
export const scoreEntrySchema = z.object({
  position: z.enum(['1S', '2S', '3S', '4S', '5S', '6S', '1D', '2D', '3D']),
  home_player_names: z.array(z.string()).min(1).max(2),
  away_player_names: z.array(z.string()).min(1).max(2),
  sets: z.array(z.object({
    home_games: z.number().min(0).max(7),
    away_games: z.number().min(0).max(7),
  })).min(1).max(3),
  winner: z.enum(['home', 'away']),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
export type PlayerFormData = z.infer<typeof playerSchema>
export type PlayerFormInputData = z.infer<typeof playerFormInputSchema>
export type MatchFormData = z.infer<typeof matchSchema>
export type TournamentFormData = z.infer<typeof tournamentSchema>
export type JoinTournamentFormData = z.infer<typeof joinTournamentSchema>
export type LineupFormData = z.infer<typeof lineupSchema>
export type ChallengeMatchFormData = z.infer<typeof challengeMatchSchema>
export type ScoreEntryFormData = z.infer<typeof scoreEntrySchema>
