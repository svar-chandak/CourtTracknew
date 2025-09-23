'use client'

import { useState, useEffect } from 'react'
import { useTournamentStore } from '@/stores/tournament-store'
import { useAuthStore } from '@/stores/auth-store'
import { TournamentManager } from './tournament-manager'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, Calendar, MapPin, Clock, Eye, Settings } from 'lucide-react'
import { toast } from 'sonner'
import type { Tournament } from '@/lib/types'
import type { BracketMatch } from '@/lib/tournament-engine'

interface TournamentBracketProps {
  tournament: Tournament
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TournamentBracket({ tournament, open, onOpenChange }: TournamentBracketProps) {
  const { coach } = useAuthStore()
  const { 
    tournamentTeams, 
    bracket,
    getTournamentTeams, 
    updateTournament, 
    generateBracket, 
    updateBracketMatch, 
    startTournament, 
    endTournament, 
    resetTournament 
  } = useTournamentStore()

  useEffect(() => {
    if (tournament && open) {
      getTournamentTeams(tournament.id)
    }
  }, [tournament, open, getTournamentTeams])

  const isCreator = coach?.id === tournament.creator_id
  const isReadOnly = !isCreator

  const handleUpdateTournament = async (updates: Partial<Tournament>) => {
    try {
      const { error } = await updateTournament(tournament.id, updates)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Tournament updated successfully!')
      }
    } catch (error) {
      toast.error('Failed to update tournament')
    }
  }

  const handleGenerateBracket = async () => {
    try {
      const { error } = await generateBracket(tournament.id)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Tournament bracket generated successfully!')
      }
    } catch (error) {
      toast.error('Failed to generate bracket')
    }
  }

  const handleUpdateMatch = async (matchId: string, updates: Partial<BracketMatch>) => {
    try {
      const { error } = await updateBracketMatch(matchId, updates)
      if (error) {
        toast.error(error)
      }
    } catch (error) {
      toast.error('Failed to update match')
    }
  }

  const handleStartTournament = async () => {
    try {
      const { error } = await startTournament(tournament.id)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Tournament started!')
      }
    } catch (error) {
      toast.error('Failed to start tournament')
    }
  }

  const handleEndTournament = async () => {
    try {
      const { error } = await endTournament(tournament.id)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Tournament ended!')
      }
    } catch (error) {
      toast.error('Failed to end tournament')
    }
  }

  const handleResetTournament = async () => {
    if (confirm('Are you sure you want to reset this tournament? This will delete all matches and reset the tournament to open status.')) {
      try {
        const { error } = await resetTournament(tournament.id)
        if (error) {
          toast.error(error)
        } else {
          toast.success('Tournament reset successfully!')
        }
      } catch (error) {
        toast.error('Failed to reset tournament')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{tournament.name}</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {tournament.tournament_type.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">
                Code: {tournament.tournament_code}
            </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Comprehensive tournament management and bracket system
          </DialogDescription>
        </DialogHeader>
        
        <TournamentManager
          tournament={tournament}
          teams={tournamentTeams}
          onUpdateTournament={handleUpdateTournament}
          onGenerateBracket={handleGenerateBracket}
          onUpdateMatch={handleUpdateMatch}
          onStartTournament={handleStartTournament}
          onEndTournament={handleEndTournament}
          onResetTournament={handleResetTournament}
          isReadOnly={isReadOnly}
        />
      </DialogContent>
    </Dialog>
  )
}