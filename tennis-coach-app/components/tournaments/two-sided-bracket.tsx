'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePlayerTournamentStore } from '@/stores/player-tournament-store'
import { PlayerTournamentEngine } from '@/lib/player-tournament-engine'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Trophy, 
  School, 
  User, 
  AlertTriangle,
  Lock,
  Unlock,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import type { 
  BracketSlot, 
  BracketMatch, 
  TwoSidedBracket, 
  TournamentPlayer,
  ValidationWarning
} from '@/lib/player-tournament-types'

interface TwoSidedBracketProps {
  tournamentId: string
  isDirector: boolean
}

export function TwoSidedBracket({ tournamentId, isDirector }: TwoSidedBracketProps) {
  const {
    bracket,
    tournamentPlayers,
    schoolGroups,
    tournamentSettings,
    loading,
    updateBracketSlot,
    lockBracket,
    unlockBracket,
    getBracket,
    getSchoolGroups,
    getTournamentSettings,
    getTournamentPlayers
  } = usePlayerTournamentStore()

  const [draggedSlot, setDraggedSlot] = useState<BracketSlot | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<Map<string, ValidationWarning[]>>(new Map())

  const isLocked = tournamentSettings?.is_bracket_locked ?? false

  // Load data on mount
  useEffect(() => {
    if (tournamentId) {
      getTournamentPlayers(tournamentId)
      getBracket(tournamentId)
      getSchoolGroups(tournamentId)
      getTournamentSettings(tournamentId)
    }
  }, [tournamentId, getBracket, getSchoolGroups, getTournamentSettings, getTournamentPlayers])

  // Get school average UTR
  const getSchoolAvgUtr = useCallback((schoolName: string): number => {
    const schoolGroup = schoolGroups.find(sg => sg.school_name === schoolName)
    return schoolGroup?.average_utr ?? 0
  }, [schoolGroups])

  // Handle drag start
  const handleDragStart = (slot: BracketSlot, event: React.DragEvent) => {
    if (isLocked || slot.is_locked) {
      event.preventDefault()
      return
    }
    setDraggedSlot(slot)
    event.dataTransfer.effectAllowed = 'move'
  }

  // Handle drag over
  const handleDragOver = (event: React.DragEvent) => {
    if (isLocked || !draggedSlot) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  // Handle drop
  const handleDrop = async (targetSlot: BracketSlot, event: React.DragEvent) => {
    event.preventDefault()

    if (isLocked || !draggedSlot || targetSlot.is_locked) {
      return
    }

    if (draggedSlot.id === targetSlot.id) {
      setDraggedSlot(null)
      return
    }

    // Get player data from dragged slot
    const player = tournamentPlayers.find(tp => tp.player_id === draggedSlot.player_id)
    
    if (!player) {
      setDraggedSlot(null)
      return
    }

    // Validate the move
    const allSlots = bracket?.pool_a.rounds.concat(bracket.pool_b.rounds).flatMap(r => r.slots) ?? []
    const allMatches = bracket?.pool_a.rounds.concat(bracket.pool_b.rounds).flatMap(r => r.matches) ?? []
    
    const validationWarnings = PlayerTournamentEngine.validateSlotChange(
      targetSlot,
      player,
      allSlots,
      allMatches,
      targetSlot.round_number
    )

    // Show warnings but allow override
    if (validationWarnings.length > 0) {
      const hasErrors = validationWarnings.some(w => w.severity === 'error')
      
      if (hasErrors) {
        const confirm = window.confirm(
          `${validationWarnings.map(w => w.message).join('\n')}\n\nProceed anyway?`
        )
        if (!confirm) {
          setDraggedSlot(null)
          return
        }
      } else {
        toast.warning(validationWarnings.map(w => w.message).join(', '))
      }
      
      setWarnings(prev => {
        const newMap = new Map(prev)
        newMap.set(targetSlot.id, validationWarnings)
        return newMap
      })
    }

    // Update the slot
    const { error } = await updateBracketSlot(targetSlot.id, {
      player_id: player.player_id,
      school_name: player.school_name,
      utr_rating: player.utr_rating
    })

    if (error) {
      toast.error(error)
    } else {
      // If moving from another slot, clear that slot
      if (draggedSlot.player_id) {
        await updateBracketSlot(draggedSlot.id, {
          player_id: undefined,
          school_name: undefined,
          utr_rating: undefined
        })
      }
      
      toast.success('Bracket updated')
      await getBracket(tournamentId)
      await getSchoolGroups(tournamentId)
    }

    setDraggedSlot(null)
  }

  // Handle lock/unlock
  const handleLockToggle = async () => {
    if (!isDirector) return

    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser()
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    if (isLocked) {
      const { error } = await unlockBracket(tournamentId)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Bracket unlocked')
      }
    } else {
      const confirm = window.confirm(
        'Locking the bracket will prevent further changes. Only scores can be entered after locking. Continue?'
      )
      if (!confirm) return

      const { error } = await lockBracket(tournamentId, user.id)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Bracket locked')
      }
    }
  }

  if (loading && !bracket) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading bracket...</div>
      </div>
    )
  }

  if (!bracket) {
    return (
      <div className="text-center p-8 text-gray-500">
        No bracket generated yet. Generate bracket after players have joined.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with lock status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Tournament Bracket</h3>
          {isLocked && (
            <Badge variant="outline" className="bg-yellow-50">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          )}
        </div>
        {isDirector && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLockToggle}
          >
            {isLocked ? (
              <>
                <Unlock className="h-4 w-4 mr-1" />
                Unlock Bracket
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-1" />
                Lock Bracket
              </>
            )}
          </Button>
        )}
      </div>

      {/* Two-sided bracket */}
      <div className="grid grid-cols-2 gap-8">
        {/* Pool A */}
        <div className="space-y-4">
          <div className="text-center">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Pool A
            </Badge>
          </div>
          <BracketSide
            rounds={bracket.pool_a.rounds}
            poolSide="A"
            isLocked={isLocked}
            draggedSlot={draggedSlot}
            hoveredSlot={hoveredSlot}
            warnings={warnings}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onSlotHover={setHoveredSlot}
            getSchoolAvgUtr={getSchoolAvgUtr}
          />
        </div>

        {/* Pool B */}
        <div className="space-y-4">
          <div className="text-center">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Pool B
            </Badge>
          </div>
          <BracketSide
            rounds={bracket.pool_b.rounds}
            poolSide="B"
            isLocked={isLocked}
            draggedSlot={draggedSlot}
            hoveredSlot={hoveredSlot}
            warnings={warnings}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onSlotHover={setHoveredSlot}
            getSchoolAvgUtr={getSchoolAvgUtr}
          />
        </div>
      </div>
    </div>
  )
}

interface BracketSideProps {
  rounds: Array<{
    round_number: number
    slots: BracketSlot[]
    matches: BracketMatch[]
  }>
  poolSide: 'A' | 'B'
  isLocked: boolean
  draggedSlot: BracketSlot | null
  hoveredSlot: string | null
  warnings: Map<string, ValidationWarning[]>
  onDragStart: (slot: BracketSlot, event: React.DragEvent) => void
  onDragOver: (event: React.DragEvent) => void
  onDrop: (slot: BracketSlot, event: React.DragEvent) => Promise<void>
  onSlotHover: (slotId: string | null) => void
  getSchoolAvgUtr: (schoolName: string) => number
}

function BracketSide({
  rounds,
  poolSide,
  isLocked,
  draggedSlot,
  hoveredSlot,
  warnings,
  onDragStart,
  onDragOver,
  onDrop,
  onSlotHover,
  getSchoolAvgUtr
}: BracketSideProps) {
  return (
    <div className="space-y-6">
      {rounds.map((round, roundIdx) => (
        <div key={round.round_number} className="space-y-4">
          <div className="text-center font-medium text-sm text-gray-600">
            Round {round.round_number}
          </div>
          
          {/* Matches in this round */}
          <div className="space-y-3">
            {round.matches.map((match, matchIdx) => (
              <MatchCard
                key={match.id}
                match={match}
                round={round}
                matchIdx={matchIdx}
                isLocked={isLocked}
                draggedSlot={draggedSlot}
                hoveredSlot={hoveredSlot}
                warnings={warnings}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onSlotHover={onSlotHover}
                getSchoolAvgUtr={getSchoolAvgUtr}
              />
            ))}
          </div>

          {/* Empty slots for next round (if matches exist) */}
          {round.matches.length > 0 && roundIdx < rounds.length - 1 && (
            <div className="space-y-2">
              {rounds[roundIdx + 1].slots
                .filter(s => !s.player_id)
                .map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    isLocked={isLocked}
                    draggedSlot={draggedSlot}
                    hoveredSlot={hoveredSlot}
                    warnings={warnings.get(slot.id) ?? []}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onSlotHover={onSlotHover}
                    getSchoolAvgUtr={getSchoolAvgUtr}
                  />
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface MatchCardProps {
  match: BracketMatch
  round: { slots: BracketSlot[]; matches: BracketMatch[] }
  matchIdx: number
  isLocked: boolean
  draggedSlot: BracketSlot | null
  hoveredSlot: string | null
  warnings: Map<string, ValidationWarning[]>
  onDragStart: (slot: BracketSlot, event: React.DragEvent) => void
  onDragOver: (event: React.DragEvent) => void
  onDrop: (slot: BracketSlot, event: React.DragEvent) => Promise<void>
  onSlotHover: (slotId: string | null) => void
  getSchoolAvgUtr: (schoolName: string) => number
}

function MatchCard({
  match,
  round,
  matchIdx,
  isLocked,
  draggedSlot,
  hoveredSlot,
  warnings,
  onDragStart,
  onDragOver,
  onDrop,
  onSlotHover,
  getSchoolAvgUtr
}: MatchCardProps) {
  const slot1 = round.slots.find(s => s.id === match.slot_id_1)
  const slot2 = round.slots.find(s => s.id === match.slot_id_2)

  if (!slot1 && !slot2) return null

  const isBye = match.status === 'bye'
  const isCompleted = match.status === 'completed'

  return (
    <Card className={`${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
      <CardContent className="p-3 space-y-2">
        {/* Player 1 */}
        {slot1 && (
          <SlotCard
            slot={slot1}
            isLocked={isLocked}
            draggedSlot={draggedSlot}
            hoveredSlot={hoveredSlot}
            warnings={warnings.get(slot1.id) ?? []}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onSlotHover={onSlotHover}
            getSchoolAvgUtr={getSchoolAvgUtr}
            isWinner={isCompleted && match.winner_player_id === slot1.player_id}
          />
        )}

        {/* VS or Bye indicator */}
        <div className="text-center text-xs text-gray-500 font-medium">
          {isBye ? 'BYE' : 'VS'}
        </div>

        {/* Player 2 */}
        {slot2 && (
          <SlotCard
            slot={slot2}
            isLocked={isLocked}
            draggedSlot={draggedSlot}
            hoveredSlot={hoveredSlot}
            warnings={warnings.get(slot2.id) ?? []}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onSlotHover={onSlotHover}
            getSchoolAvgUtr={getSchoolAvgUtr}
            isWinner={isCompleted && match.winner_player_id === slot2.player_id}
          />
        )}

        {/* Match result */}
        {isCompleted && match.score_summary && (
          <div className="text-center text-xs text-gray-600 mt-2">
            Score: {match.score_summary}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface SlotCardProps {
  slot: BracketSlot
  isLocked: boolean
  draggedSlot: BracketSlot | null
  hoveredSlot: string | null
  warnings: ValidationWarning[]
  onDragStart: (slot: BracketSlot, event: React.DragEvent) => void
  onDragOver: (event: React.DragEvent) => void
  onDrop: (slot: BracketSlot, event: React.DragEvent) => Promise<void>
  onSlotHover: (slotId: string | null) => void
  getSchoolAvgUtr: (schoolName: string) => number
  isWinner?: boolean
}

function SlotCard({
  slot,
  isLocked,
  draggedSlot,
  hoveredSlot,
  warnings,
  onDragStart,
  onDragOver,
  onDrop,
  onSlotHover,
  getSchoolAvgUtr,
  isWinner = false
}: SlotCardProps) {
  const hasPlayer = !!slot.player_id
  const isDragging = draggedSlot?.id === slot.id
  const isHovered = hoveredSlot === slot.id
  const hasWarnings = warnings.length > 0
  const hasErrors = warnings.some(w => w.severity === 'error')

  const schoolAvgUtr = slot.school_name ? getSchoolAvgUtr(slot.school_name) : 0

  return (
    <div
      draggable={!isLocked && hasPlayer && !slot.is_locked}
      onDragStart={(e) => onDragStart(slot, e)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(slot, e)}
      onMouseEnter={() => onSlotHover(slot.id)}
      onMouseLeave={() => onSlotHover(null)}
      className={`
        p-3 rounded-lg border-2 transition-all cursor-move
        ${hasPlayer 
          ? 'bg-white border-blue-200' 
          : 'bg-gray-50 border-gray-200 border-dashed'
        }
        ${isDragging ? 'opacity-50' : ''}
        ${isHovered && !hasPlayer ? 'border-blue-400 bg-blue-50' : ''}
        ${hasErrors ? 'border-red-400 bg-red-50' : ''}
        ${hasWarnings && !hasErrors ? 'border-yellow-400 bg-yellow-50' : ''}
        ${isWinner ? 'ring-2 ring-green-400' : ''}
        ${isLocked || slot.is_locked ? 'cursor-not-allowed opacity-75' : ''}
      `}
    >
      {hasPlayer ? (
        <div className="space-y-1">
          {/* Player name */}
          <div className="font-medium text-sm flex items-center gap-1">
            {slot.player?.name || slot.player_id || 'Unknown Player'}
            {isWinner && <Trophy className="h-3 w-3 text-yellow-500" />}
          </div>
          
          {/* School */}
          {slot.school_name && (
            <div 
              className="text-xs text-gray-600 flex items-center gap-1"
              title={`School Avg UTR: ${schoolAvgUtr.toFixed(1)}`}
            >
              <School className="h-3 w-3" />
              {slot.school_name}
              {isHovered && schoolAvgUtr > 0 && (
                <span className="ml-1 text-gray-500">
                  (Avg: {schoolAvgUtr.toFixed(1)})
                </span>
              )}
            </div>
          )}
          
          {/* UTR */}
          {slot.utr_rating && slot.utr_rating > 0 && (
            <div className="text-xs font-medium text-blue-600 flex items-center gap-1">
              <User className="h-3 w-3" />
              UTR: {slot.utr_rating.toFixed(1)}
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="flex items-start gap-1 mt-1">
              <AlertTriangle className={`h-3 w-3 ${
                hasErrors ? 'text-red-500' : 'text-yellow-500'
              }`} />
              <div className="text-xs">
                {warnings.map((w, i) => (
                  <div key={i} className={hasErrors ? 'text-red-600' : 'text-yellow-600'}>
                    {w.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-xs text-gray-400 py-2">
          Empty Slot
          {!isLocked && !slot.is_locked && (
            <div className="text-xs text-gray-300 mt-1">
              Drop player here
            </div>
          )}
        </div>
      )}
    </div>
  )
}

