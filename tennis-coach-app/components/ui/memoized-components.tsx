import { memo, useMemo, useCallback } from 'react'
import type { Player, Team, Match } from '@/lib/types'

// Memoized player card component
interface PlayerCardProps {
  player: Player
  onEdit?: (player: Player) => void
  onDelete?: (playerId: string) => void
  showActions?: boolean
}

export const PlayerCard = memo<PlayerCardProps>(({ player, onEdit, onDelete, showActions = true }) => {
  const handleEdit = useCallback(() => {
    onEdit?.(player)
  }, [onEdit, player])

  const handleDelete = useCallback(() => {
    onDelete?.(player.id)
  }, [onDelete, player.id])

  const playerInfo = useMemo(() => ({
    name: player.name,
    grade: player.grade,
    gender: player.gender,
    teamLevel: player.team_level,
    utrRating: player.utr_rating,
    positionPreference: player.position_preference
  }), [player])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{playerInfo.name}</h3>
          <div className="mt-1 space-y-1 text-sm text-gray-600">
            {playerInfo.grade && <p>Grade: {playerInfo.grade}</p>}
            {playerInfo.gender && <p>Gender: {playerInfo.gender}</p>}
            {playerInfo.teamLevel && <p>Level: {playerInfo.teamLevel}</p>}
            {playerInfo.utrRating && <p>UTR: {playerInfo.utrRating}</p>}
            {playerInfo.positionPreference && <p>Position: {playerInfo.positionPreference}</p>}
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2 ml-4">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

PlayerCard.displayName = 'PlayerCard'

// Memoized team stats component
interface TeamStatsProps {
  team: Team
}

export const TeamStats = memo<TeamStatsProps>(({ team }) => {
  const stats = useMemo(() => ({
    wins: team.season_record_wins,
    losses: team.season_record_losses,
    winPercentage: team.season_record_wins + team.season_record_losses > 0 
      ? Math.round((team.season_record_wins / (team.season_record_wins + team.season_record_losses)) * 100)
      : 0,
    totalMatches: team.season_record_wins + team.season_record_losses
  }), [team.season_record_wins, team.season_record_losses])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Record</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
          <div className="text-sm text-gray-600">Wins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
          <div className="text-sm text-gray-600">Losses</div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Win Percentage</span>
          <span className="font-semibold text-gray-900">{stats.winPercentage}%</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.winPercentage}%` }}
          />
        </div>
      </div>
    </div>
  )
})

TeamStats.displayName = 'TeamStats'

// Memoized match card component
interface MatchCardProps {
  match: Match
  onViewDetails?: (match: Match) => void
  onUpdateScore?: (match: Match) => void
}

export const MatchCard = memo<MatchCardProps>(({ match, onViewDetails, onUpdateScore }) => {
  const handleViewDetails = useCallback(() => {
    onViewDetails?.(match)
  }, [onViewDetails, match])

  const handleUpdateScore = useCallback(() => {
    onUpdateScore?.(match)
  }, [onUpdateScore, match])

  const matchInfo = useMemo(() => ({
    homeTeam: match.home_team?.school_name || 'Unknown Team',
    awayTeam: match.away_team?.school_name || 'Unknown Team',
    date: new Date(match.match_date).toLocaleDateString(),
    time: match.match_time,
    location: match.location,
    status: match.status,
    homeScore: match.home_score,
    awayScore: match.away_score,
    isCompleted: match.status === 'completed'
  }), [match])

  const statusColor = useMemo(() => {
    switch (matchInfo.status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }, [matchInfo.status])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {matchInfo.homeTeam} vs {matchInfo.awayTeam}
          </h3>
          <p className="text-sm text-gray-600">{matchInfo.date}</p>
          {matchInfo.time && <p className="text-sm text-gray-600">{matchInfo.time}</p>}
          {matchInfo.location && <p className="text-sm text-gray-600">{matchInfo.location}</p>}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {matchInfo.status}
        </span>
      </div>
      
      {matchInfo.isCompleted && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">{matchInfo.homeTeam}</span>
            <span className="text-2xl font-bold text-gray-900">{matchInfo.homeScore}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="font-semibold text-gray-900">{matchInfo.awayTeam}</span>
            <span className="text-2xl font-bold text-gray-900">{matchInfo.awayScore}</span>
          </div>
        </div>
      )}
      
      <div className="flex gap-2">
        {onViewDetails && (
          <button
            onClick={handleViewDetails}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
        )}
        {onUpdateScore && !matchInfo.isCompleted && (
          <button
            onClick={handleUpdateScore}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Update Score
          </button>
        )}
      </div>
    </div>
  )
})

MatchCard.displayName = 'MatchCard'

// Memoized loading component
interface LoadingCardProps {
  message?: string
}

export const LoadingCard = memo<LoadingCardProps>(({ message = 'Loading...' }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
})

LoadingCard.displayName = 'LoadingCard'
