'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { scoreEntrySchema, type ScoreEntryFormData } from '@/lib/validations'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Match, Player, TeamMatchDivision } from '@/lib/types'

interface ScoreEntryDialogProps {
  match: Match | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onScoreEntered?: () => void
}

export function ScoreEntryDialog({ match, open, onOpenChange, onScoreEntered }: ScoreEntryDialogProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [divisions, setDivisions] = useState<TeamMatchDivision[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ScoreEntryFormData>({
    resolver: zodResolver(scoreEntrySchema),
  })

  const watchedPosition = watch('position')
  const watchedSets = watch('sets')

  useEffect(() => {
    if (match && open) {
      loadMatchData()
    }
  }, [match, open])

  const loadMatchData = async () => {
    if (!match) return

    setLoading(true)
    try {
      // Load players for both teams
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .or(`team_id.eq.${match.home_team_id},team_id.eq.${match.away_team_id}`)

      if (playersError) {
        console.error('Error loading players:', playersError)
      } else {
        setPlayers(playersData || [])
      }

      // Load existing divisions
      const { data: divisionsData, error: divisionsError } = await supabase
        .from('team_match_divisions')
        .select('*')
        .eq('match_id', match.id)
        .order('position_number')

      if (divisionsError) {
        console.error('Error loading divisions:', divisionsError)
      } else {
        setDivisions(divisionsData || [])
      }
    } catch (error) {
      console.error('Error loading match data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlayersByTeam = (teamId: string) => {
    return players.filter(p => p.team_id === teamId)
  }

  const getDivisionFromPosition = (position: string) => {
    if (position.includes('S')) return 'boys_singles'
    if (position.includes('D')) return 'boys_doubles'
    return 'boys_singles' // Default
  }

  const onSubmit = async (data: ScoreEntryFormData) => {
    if (!match) return

    setIsSubmitting(true)
    try {
      const division = getDivisionFromPosition(data.position)
      const positionNumber = parseInt(data.position.replace(/[^\d]/g, ''))

      // Check if division already exists
      const existingDivision = divisions.find(d => 
        d.division === division && d.position_number === positionNumber
      )

      if (existingDivision) {
        // Update existing division
        const { error } = await supabase
          .from('team_match_divisions')
          .update({
            home_player_ids: data.home_player_names.map(name => 
              players.find(p => p.name === name)?.id
            ).filter(Boolean),
            away_player_ids: data.away_player_names.map(name => 
              players.find(p => p.name === name)?.id
            ).filter(Boolean),
            home_sets_won: data.sets.filter(set => set.home_games > set.away_games).length,
            away_sets_won: data.sets.filter(set => set.away_games > set.home_games).length,
            winner: data.winner,
            score_details: data.sets,
            completed: true,
          })
          .eq('id', existingDivision.id)

        if (error) {
          toast.error('Failed to update match result')
          return
        }
      } else {
        // Create new division
        const { error } = await supabase
          .from('team_match_divisions')
          .insert({
            match_id: match.id,
            division,
            position_number: positionNumber,
            home_player_ids: data.home_player_names.map(name => 
              players.find(p => p.name === name)?.id
            ).filter(Boolean),
            away_player_ids: data.away_player_names.map(name => 
              players.find(p => p.name === name)?.id
            ).filter(Boolean),
            home_sets_won: data.sets.filter(set => set.home_games > set.away_games).length,
            away_sets_won: data.sets.filter(set => set.away_games > set.home_games).length,
            winner: data.winner,
            score_details: data.sets,
            completed: true,
          })

        if (error) {
          toast.error('Failed to create match result')
          return
        }
      }

      toast.success('Score entered successfully!')
      reset()
      onOpenChange(false)
      onScoreEntered?.()
    } catch (error) {
      console.error('Error entering score:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSet = () => {
    const currentSets = watchedSets || []
    if (currentSets.length < 3) {
      setValue('sets', [...currentSets, { home_games: 0, away_games: 0 }])
    }
  }

  const removeSet = (index: number) => {
    const currentSets = watchedSets || []
    setValue('sets', currentSets.filter((_, i) => i !== index))
  }

  if (!match) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enter Match Score</DialogTitle>
          <DialogDescription>
            {match.home_team?.school_name} vs {match.away_team?.school_name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Position Selection */}
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={watchedPosition || ''}
                onValueChange={(value) => setValue('position', value as '1S' | '2S' | '3S' | '4S' | '5S' | '6S' | '1D' | '2D' | '3D')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1S">1st Singles</SelectItem>
                  <SelectItem value="2S">2nd Singles</SelectItem>
                  <SelectItem value="3S">3rd Singles</SelectItem>
                  <SelectItem value="4S">4th Singles</SelectItem>
                  <SelectItem value="5S">5th Singles</SelectItem>
                  <SelectItem value="6S">6th Singles</SelectItem>
                  <SelectItem value="1D">1st Doubles</SelectItem>
                  <SelectItem value="2D">2nd Doubles</SelectItem>
                  <SelectItem value="3D">3rd Doubles</SelectItem>
                </SelectContent>
              </Select>
              {errors.position && (
                <p className="text-sm text-red-600">{errors.position.message}</p>
              )}
            </div>

            {/* Player Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Team Players */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{match.home_team?.school_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.from({ length: watchedPosition?.includes('D') ? 2 : 1 }).map((_, index) => (
                    <div key={index} className="space-y-1">
                      <Label htmlFor={`home_player_${index}`}>
                        Player {index + 1}
                      </Label>
                      <Select
                        value={watch(`home_player_names.${index}`) || ''}
                        onValueChange={(value) => {
                          const currentNames = watch('home_player_names') || []
                          const newNames = [...currentNames]
                          newNames[index] = value
                          setValue('home_player_names', newNames)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {getPlayersByTeam(match.home_team_id).map((player) => (
                            <SelectItem key={player.id} value={player.name}>
                              {player.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Away Team Players */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{match.away_team?.school_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.from({ length: watchedPosition?.includes('D') ? 2 : 1 }).map((_, index) => (
                    <div key={index} className="space-y-1">
                      <Label htmlFor={`away_player_${index}`}>
                        Player {index + 1}
                      </Label>
                      <Select
                        value={watch(`away_player_names.${index}`) || ''}
                        onValueChange={(value) => {
                          const currentNames = watch('away_player_names') || []
                          const newNames = [...currentNames]
                          newNames[index] = value
                          setValue('away_player_names', newNames)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {getPlayersByTeam(match.away_team_id).map((player) => (
                            <SelectItem key={player.id} value={player.name}>
                              {player.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Set Scores */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Set Scores</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSet}
                  disabled={!watchedPosition || (watchedSets?.length || 0) >= 3}
                >
                  Add Set
                </Button>
              </div>

              {(watchedSets || []).map((set, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label>Set {index + 1}:</Label>
                    <Input
                      type="number"
                      min="0"
                      max="7"
                      value={set.home_games}
                      onChange={(e) => {
                        const currentSets = watchedSets || []
                        const newSets = [...currentSets]
                        newSets[index] = { ...set, home_games: parseInt(e.target.value) || 0 }
                        setValue('sets', newSets)
                      }}
                      className="w-16"
                    />
                    <span>vs</span>
                    <Input
                      type="number"
                      min="0"
                      max="7"
                      value={set.away_games}
                      onChange={(e) => {
                        const currentSets = watchedSets || []
                        const newSets = [...currentSets]
                        newSets[index] = { ...set, away_games: parseInt(e.target.value) || 0 }
                        setValue('sets', newSets)
                      }}
                      className="w-16"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSet(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              {errors.sets && (
                <p className="text-sm text-red-600">{errors.sets.message}</p>
              )}
            </div>

            {/* Winner Selection */}
            <div className="space-y-2">
              <Label htmlFor="winner">Winner</Label>
              <Select
                value={watch('winner') || ''}
                onValueChange={(value) => setValue('winner', value as 'home' | 'away')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select winner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">{match.home_team?.school_name}</SelectItem>
                  <SelectItem value="away">{match.away_team?.school_name}</SelectItem>
                </SelectContent>
              </Select>
              {errors.winner && (
                <p className="text-sm text-red-600">{errors.winner.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Entering Score...' : 'Enter Score'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
