'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { joinTournamentSchema, type JoinTournamentFormData } from '@/lib/validations'
import { useTournamentStore } from '@/stores/tournament-store'
import { useTeamStore } from '@/stores/team-store'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, MapPin, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import type { Tournament } from '@/lib/types'

interface JoinTournamentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournament?: Tournament | null
}

export function JoinTournamentDialog({ open, onOpenChange, tournament }: JoinTournamentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [foundTournament, setFoundTournament] = useState<Tournament | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  const { currentTeam } = useTeamStore()
  const { getTournament, joinTournament } = useTournamentStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<JoinTournamentFormData>({
    resolver: zodResolver(joinTournamentSchema),
  })

  const tournamentCode = watch('tournament_code')

  // If tournament is provided, set it as found tournament
  useState(() => {
    if (tournament) {
      setFoundTournament(tournament)
    }
  })

  const searchTournament = async (code: string) => {
    if (!code || code.length !== 8) return

    setIsSearching(true)
    try {
      const { tournament, error } = await getTournament(code)
      
      if (error) {
        toast.error(error)
        setFoundTournament(null)
      } else if (tournament) {
        setFoundTournament(tournament)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      setFoundTournament(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleJoinTournament = async () => {
    if (!foundTournament || !currentTeam) {
      toast.error('Missing tournament or team information')
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await joinTournament(foundTournament.tournament_code, currentTeam.id)
      
      if (error) {
        toast.error(error)
      } else {
        toast.success('Successfully joined the tournament!')
        reset()
        setFoundTournament(null)
        onOpenChange(false)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeLabel = (type: Tournament['tournament_type']) => {
    switch (type) {
      case 'single_elimination': return 'Single Elimination'
      case 'round_robin': return 'Round Robin'
      case 'dual_match': return 'Dual Match'
      default: return type
    }
  }

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'full': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canJoin = foundTournament && 
                  foundTournament.status === 'open' && 
                  (foundTournament.teams?.length || 0) < foundTournament.max_teams

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Join Tournament</DialogTitle>
          <DialogDescription>
            Enter a tournament code to join an existing tournament.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {!foundTournament ? (
            <form onSubmit={handleSubmit((data) => searchTournament(data.tournament_code))} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tournament_code">Tournament Code</Label>
                <Input
                  id="tournament_code"
                  placeholder="Enter 8-character tournament code"
                  maxLength={8}
                  {...register('tournament_code')}
                  onChange={(e) => {
                    setValue('tournament_code', e.target.value.toUpperCase())
                    if (e.target.value.length === 8) {
                      searchTournament(e.target.value.toUpperCase())
                    }
                  }}
                />
                {errors.tournament_code && (
                  <p className="text-sm text-red-600">{errors.tournament_code.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={isSearching || !tournamentCode || tournamentCode.length !== 8}
                className="w-full"
              >
                {isSearching ? 'Searching...' : 'Search Tournament'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{foundTournament.name}</CardTitle>
                      <CardDescription>
                        {getTypeLabel(foundTournament.tournament_type)}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(foundTournament.status)}>
                      {foundTournament.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{foundTournament.teams?.length || 0} / {foundTournament.max_teams} teams</span>
                  </div>
                  
                  {foundTournament.start_date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(foundTournament.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {foundTournament.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{foundTournament.location}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Trophy className="h-4 w-4 mr-2" />
                    <span>Code: {foundTournament.tournament_code}</span>
                  </div>

                  {foundTournament.description && (
                    <p className="text-sm text-gray-600">
                      {foundTournament.description}
                    </p>
                  )}
                </CardContent>
              </Card>

              {canJoin ? (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFoundTournament(null)
                      reset()
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleJoinTournament}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Joining...' : 'Join Tournament'}
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    {foundTournament.status === 'full' ? 'Tournament is full' :
                     foundTournament.status === 'in_progress' ? 'Tournament has started' :
                     foundTournament.status === 'completed' ? 'Tournament is completed' :
                     'Cannot join this tournament'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFoundTournament(null)
                      reset()
                    }}
                  >
                    Back
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
