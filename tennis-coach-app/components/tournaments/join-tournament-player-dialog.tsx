'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePlayerTournamentStore } from '@/stores/player-tournament-store'
import { useTeamStore } from '@/stores/team-store'
import { useAuthStore } from '@/stores/auth-store'
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
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { Tournament } from '@/lib/types'
import type { Player } from '@/lib/types'

const joinTournamentSchema = z.object({
  tournament_code: z.string().min(8, 'Tournament code must be 8 characters').max(8, 'Tournament code must be 8 characters')
})

type JoinTournamentFormData = z.infer<typeof joinTournamentSchema>

interface JoinTournamentPlayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoined: (tournament: Tournament) => void
}

export function JoinTournamentPlayerDialog({
  open,
  onOpenChange,
  onJoined
}: JoinTournamentPlayerDialogProps) {
  const { coach } = useAuthStore()
  const { currentTeam, players, getPlayers } = useTeamStore()
  const { joinTournamentWithCode, submitPlayers, getTournamentPlayers } = usePlayerTournamentStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [step, setStep] = useState<'code' | 'players'>('code')
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [foundTournament, setFoundTournament] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<JoinTournamentFormData>({
    resolver: zodResolver(joinTournamentSchema)
  })

  const tournamentCode = watch('tournament_code')

  useEffect(() => {
    if (currentTeam && open) {
      getPlayers(currentTeam.id)
    }
  }, [currentTeam, open, getPlayers])

  const onSubmitCode = async (data: JoinTournamentFormData) => {
    if (!coach?.id) {
      toast.error('You must be logged in to join a tournament')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await joinTournamentWithCode(data.tournament_code, coach.id)
      
      if (error) {
        toast.error(error)
        return
      }

      // Fetch tournament from Supabase directly
      const { supabase } = await import('@/lib/supabase')
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('tournament_code', data.tournament_code.toUpperCase())
        .single()

      // For now, just validate code works - actual tournament fetch handled by store
      setFoundTournament(true)
      setStep('players')
      toast.success('Tournament found! Now select players to submit.')
    } catch (error) {
      toast.error('Failed to join tournament')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayerToggle = (playerId: string) => {
    const newSelected = new Set(selectedPlayers)
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId)
    } else {
      newSelected.add(playerId)
    }
    setSelectedPlayers(newSelected)
  }

  const onSubmitPlayers = async () => {
    if (!coach?.id || !currentTeam || selectedPlayers.size === 0 || !tournamentCode) {
      toast.error('Please select at least one player')
      return
    }

    setIsLoading(true)
    try {
      // Get tournament ID from code using Supabase
      const { supabase } = await import('@/lib/supabase')
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('tournament_code', tournamentCode.toUpperCase())
        .single()

      if (tournamentError || !tournamentData) {
        toast.error('Tournament not found')
        return
      }

      const { error } = await submitPlayers(
        tournamentData.id,
        Array.from(selectedPlayers),
        coach.id,
        currentTeam.school_name
      )

      if (error) {
        toast.error(error)
        return
      }

      toast.success(`Successfully submitted ${selectedPlayers.size} player(s) to tournament!`)
      reset()
      setSelectedPlayers(new Set())
      setStep('code')
      onOpenChange(false)
      
      // Pass full tournament object to onJoined
      onJoined(tournamentData as Tournament)
    } catch (error) {
      toast.error('Failed to submit players')
    } finally {
      setIsLoading(false)
    }
  }

  const playersWithUtr = players.filter(p => p.utr_rating && p.utr_rating > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'code' ? 'Join Tournament' : 'Select Players'}
          </DialogTitle>
          <DialogDescription>
            {step === 'code'
              ? 'Enter the tournament code provided by the tournament director'
              : 'Select players from your team to enter in this tournament'}
          </DialogDescription>
        </DialogHeader>

        {step === 'code' ? (
          <form onSubmit={handleSubmit(onSubmitCode)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tournament_code">Tournament Code</Label>
              <Input
                id="tournament_code"
                placeholder="Enter 8-character code (e.g., ABC123XY)"
                maxLength={8}
                {...register('tournament_code')}
                className="uppercase"
                onChange={(e) => {
                  register('tournament_code').onChange(e)
                  e.target.value = e.target.value.toUpperCase()
                }}
              />
              {errors.tournament_code && (
                <p className="text-sm text-red-600">{errors.tournament_code.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Joining...' : 'Join Tournament'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Selected: {selectedPlayers.size} player{selectedPlayers.size !== 1 ? 's' : ''}
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {playersWithUtr.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No players with UTR ratings found. Please add UTR ratings to your players.
                </div>
              ) : (
                playersWithUtr.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPlayers.has(player.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handlePlayerToggle(player.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-gray-600">
                        UTR: {player.utr_rating?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      {selectedPlayers.has(player.id) ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('code')
                  setSelectedPlayers(new Set())
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={onSubmitPlayers}
                disabled={isLoading || selectedPlayers.size === 0}
              >
                {isLoading ? 'Submitting...' : `Submit ${selectedPlayers.size} Player${selectedPlayers.size !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

