'use client'

import { useState, useEffect } from 'react'
import { useTeamStore } from '@/stores/team-store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Users, MapPin, Trophy, Loader2, AlertCircle } from 'lucide-react'
import type { Team } from '@/lib/types'

interface TeamSearchProps {
  onTeamSelect: (team: Team) => void
  currentTeamId?: string
  placeholder?: string
}

export function TeamSearch({ onTeamSelect, currentTeamId, placeholder = "Search by team code or school name..." }: TeamSearchProps) {
  const { searchTeamsByCode, getAllTeams } = useTeamStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [showAllTeams, setShowAllTeams] = useState(false)

  // Load all teams on component mount
  useEffect(() => {
    const loadAllTeams = async () => {
      setIsLoading(true)
      const { teams, error } = await getAllTeams()
      if (error) {
        setError(error)
      } else {
        setAllTeams(teams.filter(team => team.id !== currentTeamId))
      }
      setIsLoading(false)
    }

    loadAllTeams()
  }, [getAllTeams, currentTeamId])

  // Search teams by code
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setShowAllTeams(true)
      setSearchResults([])
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const { teams, error } = await searchTeamsByCode(searchQuery.trim())
      
      if (error) {
        setError(error)
        setSearchResults([])
      } else {
        // Filter out current team from results
        const filteredTeams = teams.filter(team => team.id !== currentTeamId)
        setSearchResults(filteredTeams)
        setShowAllTeams(false)
      }
    } catch (error) {
      setError('An unexpected error occurred')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowAllTeams(true)
    setError('')
  }

  // Get teams to display
  const displayTeams = showAllTeams ? allTeams : searchResults

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
        {searchQuery && (
          <Button onClick={clearSearch} variant="ghost" size="sm">
            Clear
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Results */}
      {displayTeams.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              {showAllTeams ? 'All Teams' : `Search Results (${displayTeams.length})`}
            </h3>
            {!showAllTeams && (
              <Button 
                onClick={() => setShowAllTeams(true)} 
                variant="ghost" 
                size="sm"
              >
                Show All Teams
              </Button>
            )}
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {displayTeams.map((team) => (
              <Card 
                key={team.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onTeamSelect(team)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{team.school_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          #{team.team_code}
                        </Badge>
                      </div>
                      
                      {team.coach && (
                        <p className="text-sm text-gray-600">
                          Coach: {team.coach.full_name}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          <span>
                            {team.season_record_wins || 0}-{team.season_record_losses || 0}
                          </span>
                        </div>
                        
                        {team.coach?.school_name && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{team.coach.school_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button size="sm" variant="outline">
                      Select Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && searchQuery && searchResults.length === 0 && !showAllTeams && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
          <p className="text-gray-600 mb-4">
            No teams match your search for &quot;{searchQuery}&quot;
          </p>
          <Button onClick={() => setShowAllTeams(true)} variant="outline">
            Show All Teams
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !searchQuery && allTeams.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams available</h3>
          <p className="text-gray-600">
            No other teams are currently registered in the system.
          </p>
        </div>
      )}
    </div>
  )
}
