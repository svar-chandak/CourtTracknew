'use client'

import { useState, useEffect } from 'react'
import { usePlayerTournamentStore } from '@/stores/player-tournament-store'
import { useTournamentStore } from '@/stores/tournament-store'
import { TwoSidedBracket } from './two-sided-bracket'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Play, Users, Trophy } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface SimpleTournamentManagerProps {
  tournamentId: string
  tournamentCode: string
}

export function SimpleTournamentManager({ tournamentId, tournamentCode }: SimpleTournamentManagerProps) {
  const { coach } = useAuthStore()
  const { getTournament } = useTournamentStore()
  const {
    tournamentPlayers,
    bracket,
    loading,
    generateInitialBracket,
    getTournamentPlayers,
    getBracket
  } = usePlayerTournamentStore()

  const [tournament, setTournament] = useState<{ id: string; name: string; tournament_code: string; [key: string]: unknown } | null>(null)

  // Fetch tournament details on mount
  useEffect(() => {
    const loadTournament = async () => {
      const { tournament: tournamentData } = await getTournament(tournamentCode)
      if (tournamentData) {
        setTournament(tournamentData)
      }
    }
    if (tournamentCode) {
      loadTournament()
    }
  }, [tournamentCode, getTournament])

  const isDirector = coach?.id === tournament?.creator_id

  useEffect(() => {
    if (tournamentId) {
      getTournamentPlayers(tournamentId)
      getBracket(tournamentId)
    }
  }, [tournamentId, getTournamentPlayers, getBracket])

  const handleGenerateBracket = async () => {
    if (tournamentPlayers.length < 2) {
      toast.error('Need at least 2 players to generate bracket')
      return
    }

    const { error } = await generateInitialBracket(tournamentId)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Bracket generated successfully!')
    }
  }

  // Group by school for display
  const schoolGroups = tournamentPlayers.reduce((acc, player) => {
    if (!acc[player.school_name]) {
      acc[player.school_name] = []
    }
    acc[player.school_name].push(player)
    return acc
  }, {} as Record<string, typeof tournamentPlayers>)

  const schoolAvgUtrs = Object.entries(schoolGroups).map(([school, players]) => {
    const utrs = players.map(p => p.utr_rating).filter((utr): utr is number => utr > 0)
    const avg = utrs.length > 0 ? utrs.reduce((sum, utr) => sum + utr, 0) / utrs.length : 0
    return { school, avg, count: players.length }
  })

  return (
    <div className="space-y-6">
      {/* Tournament Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{tournament?.name || 'Tournament'}</CardTitle>
              <CardDescription>
                Code: <code className="bg-gray-100 px-2 py-1 rounded">{tournamentCode}</code>
              </CardDescription>
            </div>
            <Badge variant="outline">{tournamentPlayers.length} Players</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* School Summary */}
            <div>
              <h4 className="font-medium mb-2">Schools ({schoolAvgUtrs.length})</h4>
              <div className="grid grid-cols-2 gap-2">
                {schoolAvgUtrs.map(({ school, avg, count }) => (
                  <div key={school} className="text-sm p-2 bg-gray-50 rounded">
                    <div className="font-medium">{school}</div>
                    <div className="text-xs text-gray-600">
                      {count} player{count !== 1 ? 's' : ''} • Avg UTR: {avg.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Bracket Button */}
            {isDirector && !bracket && (
              <Button onClick={handleGenerateBracket} disabled={loading || tournamentPlayers.length < 2}>
                <Play className="h-4 w-4 mr-2" />
                Generate Bracket
              </Button>
            )}

            {isDirector && bracket && (
              <div className="text-sm text-green-600">
                ✓ Bracket generated
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bracket Display */}
      {bracket && (
        <TwoSidedBracket tournamentId={tournamentId} isDirector={isDirector} />
      )}

      {!bracket && isDirector && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Generate bracket to view tournament structure
          </CardContent>
        </Card>
      )}
    </div>
  )
}

