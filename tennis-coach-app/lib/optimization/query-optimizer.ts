import { supabase } from './supabase'
import type { DatabaseError } from './types/api'

// Query optimization utilities
export class QueryOptimizer {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private static readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  // Cache management
  static setCache(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  static getCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  static clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // Optimized query methods
  static async optimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Check cache first
    const cached = this.getCache<T>(queryKey)
    if (cached) {
      return cached
    }

    // Execute query
    const result = await queryFn()
    
    // Cache result
    this.setCache(queryKey, result, ttl)
    
    return result
  }

  // Batch operations
  static async batchQuery<T>(
    queries: Array<{ key: string; query: () => Promise<T> }>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {}
    const uncachedQueries: Array<{ key: string; query: () => Promise<T> }> = []

    // Check cache for all queries
    for (const { key, query } of queries) {
      const cached = this.getCache<T>(key)
      if (cached) {
        results[key] = cached
      } else {
        uncachedQueries.push({ key, query })
      }
    }

    // Execute uncached queries in parallel
    if (uncachedQueries.length > 0) {
      const promises = uncachedQueries.map(async ({ key, query }) => {
        const result = await query()
        this.setCache(key, result, ttl)
        return { key, result }
      })

      const batchResults = await Promise.all(promises)
      batchResults.forEach(({ key, result }) => {
        results[key] = result
      })
    }

    return results
  }
}

// Optimized Supabase query builder
export class OptimizedSupabaseQuery {
  private query: any
  private cacheKey?: string
  private ttl?: number

  constructor(table: string) {
    this.query = supabase.from(table)
  }

  select(columns: string = '*'): this {
    this.query = this.query.select(columns)
    return this
  }

  eq(column: string, value: any): this {
    this.query = this.query.eq(column, value)
    return this
  }

  in(column: string, values: any[]): this {
    this.query = this.query.in(column, values)
    return this
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.query = this.query.order(column, options)
    return this
  }

  limit(count: number): this {
    this.query = this.query.limit(count)
    return this
  }

  range(from: number, to: number): this {
    this.query = this.query.range(from, to)
    return this
  }

  single(): this {
    this.query = this.query.single()
    return this
  }

  maybeSingle(): this {
    this.query = this.query.maybeSingle()
    return this
  }

  // Enable caching for this query
  cache(key: string, ttl: number = 5 * 60 * 1000): this {
    this.cacheKey = key
    this.ttl = ttl
    return this
  }

  // Execute the query
  async execute<T>(): Promise<{ data: T | null; error: DatabaseError | null }> {
    try {
      if (this.cacheKey) {
        const result = await QueryOptimizer.optimizedQuery(
          this.cacheKey,
          () => this.query,
          this.ttl
        )
        return { data: result.data, error: result.error ? { message: result.error.message } : null }
      }

      const result = await this.query
      return { data: result.data, error: result.error ? { message: result.error.message } : null }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    }
  }
}

// Query builder factory
export function createQuery(table: string): OptimizedSupabaseQuery {
  return new OptimizedSupabaseQuery(table)
}

// Pre-built optimized queries
export const OptimizedQueries = {
  // Player queries
  getPlayersByTeam: (teamId: string) => 
    createQuery('players')
      .select('id, name, team_id, created_at, gender, team_level, player_id, password_hash, grade, position_preference, utr_rating')
      .eq('team_id', teamId)
      .cache(`players:team:${teamId}`, 2 * 60 * 1000), // 2 minutes cache

  getPlayerById: (playerId: string) =>
    createQuery('players')
      .select('*')
      .eq('id', playerId)
      .single()
      .cache(`player:${playerId}`, 5 * 60 * 1000), // 5 minutes cache

  // Team queries
  getTeamByCoachId: (coachId: string) =>
    createQuery('teams')
      .select(`
        *,
        coach:coaches(*)
      `)
      .eq('coach_id', coachId)
      .cache(`team:coach:${coachId}`, 10 * 60 * 1000), // 10 minutes cache

  getTeamByCode: (teamCode: string) =>
    createQuery('teams')
      .select(`
        *,
        coach:coaches(*)
      `)
      .eq('team_code', teamCode)
      .single()
      .cache(`team:code:${teamCode}`, 15 * 60 * 1000), // 15 minutes cache

  // Match queries
  getMatchesByTeam: (teamId: string) =>
    createQuery('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        created_by_coach:coaches!matches_created_by_fkey(*)
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('match_date', { ascending: false })
      .cache(`matches:team:${teamId}`, 1 * 60 * 1000), // 1 minute cache

  getUpcomingMatches: (teamId: string, limit: number = 5) =>
    createQuery('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*)
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .gte('match_date', new Date().toISOString().split('T')[0])
      .order('match_date', { ascending: true })
      .limit(limit)
      .cache(`matches:upcoming:${teamId}`, 5 * 60 * 1000), // 5 minutes cache

  // Tournament queries
  getTournamentById: (tournamentId: string) =>
    createQuery('tournaments')
      .select(`
        *,
        creator:coaches(*),
        teams:tournament_teams(
          *,
          team:teams(*)
        )
      `)
      .eq('id', tournamentId)
      .single()
      .cache(`tournament:${tournamentId}`, 2 * 60 * 1000), // 2 minutes cache

  getTournamentMatches: (tournamentId: string) =>
    createQuery('tournament_matches')
      .select(`
        *,
        team1:teams(*),
        team2:teams(*),
        winner_team:teams(*)
      `)
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })
      .order('match_number', { ascending: true })
      .cache(`tournament:matches:${tournamentId}`, 1 * 60 * 1000), // 1 minute cache
}

// Real-time subscription manager
export class RealtimeManager {
  private subscriptions = new Map<string, any>()
  private channels = new Set<string>()

  subscribe<T>(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: T) => void,
    filter?: Record<string, any>
  ): string {
    const channelName = `${table}:${event}`
    const channel = supabase.channel(channelName)

    const subscription = channel.on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
        filter: filter ? Object.entries(filter).map(([key, value]) => `${key}=eq.${value}`).join(',') : undefined
      },
      callback
    )

    this.subscriptions.set(channelName, subscription)
    this.channels.add(channelName)

    return channelName
  }

  unsubscribe(channelName: string): void {
    const subscription = this.subscriptions.get(channelName)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(channelName)
      this.channels.delete(channelName)
    }
  }

  unsubscribeAll(): void {
    for (const channelName of this.channels) {
      this.unsubscribe(channelName)
    }
  }

  // Pre-built subscriptions
  subscribeToPlayerChanges(teamId: string, callback: (payload: any) => void): string {
    return this.subscribe('players', '*', callback, { team_id: teamId })
  }

  subscribeToMatchChanges(teamId: string, callback: (payload: any) => void): string {
    return this.subscribe('matches', '*', callback)
  }

  subscribeToTournamentChanges(tournamentId: string, callback: (payload: any) => void): string {
    return this.subscribe('tournament_matches', '*', callback, { tournament_id: tournamentId })
  }
}

// Global realtime manager instance
export const realtimeManager = new RealtimeManager()
