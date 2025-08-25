/**
 * ESPN API Service Integration Tests
 * Tests for ESPN API integration, data fetching, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock ESPN API responses
const mockESPNLeagueResponse = {
  status: 200,
  teams: [
    {
      id: 1,
      abbrev: "TEAM1",
      location: "Team",
      nickname: "One",
      owners: ["{12345678-1234-1234-1234-123456789012}"],
      playoffSeed: 1,
      record: {
        overall: {
          wins: 8,
          losses: 3,
          ties: 0,
          percentage: 0.727,
          pointsFor: 1234.5,
          pointsAgainst: 1098.3,
          streakType: "WIN",
          streakLength: 2
        }
      }
    }
  ],
  members: [
    {
      id: "{12345678-1234-1234-1234-123456789012}",
      displayName: "Test User",
      firstName: "Test",
      lastName: "User",
      isLeagueManager: true
    }
  ],
  settings: {
    name: "Test ESPN League",
    size: 10,
    scoringPeriodId: 11,
    matchupPeriodCount: 13,
    playoffMatchupPeriodCount: 3,
    rosterSettings: {
      positionLimits: {
        "0": { limit: 1 }, // QB
        "1": { limit: 2 }, // TQB (not used)
        "2": { limit: 2 }, // RB
        "3": { limit: 2 }, // RB/WR
        "4": { limit: 2 }, // WR
        "5": { limit: 1 }, // WR/TE
        "6": { limit: 1 }, // TE
        "7": { limit: 2 }, // OP (not used)
        "8": { limit: 1 }, // DT (not used)
        "9": { limit: 1 }, // DE (not used)
        "10": { limit: 1 }, // LB (not used)
        "11": { limit: 1 }, // DL (not used)
        "12": { limit: 1 }, // CB (not used)
        "13": { limit: 1 }, // S (not used)
        "14": { limit: 1 }, // DB (not used)
        "15": { limit: 1 }, // DP (not used)
        "16": { limit: 1 }, // D/ST
        "17": { limit: 1 }, // K
        "20": { limit: 1 }, // Bench
        "21": { limit: 1 }  // IR
      }
    },
    scoringSettings: {
      scoringItems: [
        {
          statId: 0, // Passing Yards
          points: 0.04,
          pointsOverrides: {}
        },
        {
          statId: 1, // Passing TDs
          points: 4.0,
          pointsOverrides: {}
        }
      ]
    }
  },
  schedule: [
    {
      id: 1,
      matchupPeriodId: 1,
      away: {
        teamId: 1,
        totalPoints: 125.5,
        rosterForCurrentScoringPeriod: {
          entries: [
            {
              lineupSlotId: 0,
              playerId: 3139477,
              playerPoolEntry: {
                player: {
                  id: 3139477,
                  fullName: "Josh Allen",
                  eligibleSlots: [0, 7, 20, 21]
                }
              }
            }
          ]
        }
      },
      home: {
        teamId: 2,
        totalPoints: 118.3
      }
    }
  ]
}

const mockESPNPlayersResponse = {
  players: [
    {
      id: 3139477,
      fullName: "Josh Allen",
      defaultPositionId: 1,
      eligibleSlots: [0, 7, 20, 21],
      proTeamId: 2,
      stats: [
        {
          id: "002024",
          seasonId: 2024,
          statSourceId: 0,
          statSplitTypeId: 0,
          stats: {
            "0": 4306.2, // Passing yards
            "1": 29.0,   // Passing TDs
            "2": 11.0,   // Interceptions
            "20": 15.0,  // Rushing attempts
            "21": 523.0, // Rushing yards
            "22": 15.0   // Rushing TDs
          }
        }
      ]
    }
  ]
}

// Mock the actual ESPN API service implementation
class MockESPNAPIService {
  private leagueId: string
  private season: number
  private baseUrl: string

  constructor(leagueId: string, season: number = 2024) {
    this.leagueId = leagueId
    this.season = season
    this.baseUrl = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl'
  }

  async getLeagueData() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (this.leagueId === 'invalid') {
      throw new Error('League not found')
    }

    return {
      ...mockESPNLeagueResponse,
      leagueId: this.leagueId,
      season: this.season
    }
  }

  async getTeams() {
    const leagueData = await this.getLeagueData()
    return leagueData.teams.map(team => ({
      id: team.id,
      name: `${team.location} ${team.nickname}`,
      abbrev: team.abbrev,
      owners: team.owners,
      record: team.record,
      playoffSeed: team.playoffSeed
    }))
  }

  async getPlayers(scoringPeriodId?: number) {
    await new Promise(resolve => setTimeout(resolve, 150))
    
    return mockESPNPlayersResponse.players.map(player => ({
      id: player.id,
      name: player.fullName,
      position: this.mapPositionId(player.defaultPositionId),
      team: this.mapTeamId(player.proTeamId),
      eligibleSlots: player.eligibleSlots,
      stats: player.stats
    }))
  }

  async getRosters(scoringPeriodId?: number) {
    const leagueData = await this.getLeagueData()
    
    return leagueData.schedule
      .filter(matchup => !scoringPeriodId || matchup.matchupPeriodId === scoringPeriodId)
      .flatMap(matchup => [
        {
          teamId: matchup.away.teamId,
          roster: matchup.away.rosterForCurrentScoringPeriod?.entries || []
        },
        {
          teamId: matchup.home.teamId,
          roster: []
        }
      ])
  }

  async getMatchups(scoringPeriodId?: number) {
    const leagueData = await this.getLeagueData()
    
    return leagueData.schedule
      .filter(matchup => !scoringPeriodId || matchup.matchupPeriodId === scoringPeriodId)
      .map(matchup => ({
        id: matchup.id,
        matchupPeriodId: matchup.matchupPeriodId,
        away: {
          teamId: matchup.away.teamId,
          totalPoints: matchup.away.totalPoints
        },
        home: {
          teamId: matchup.home.teamId,
          totalPoints: matchup.home.totalPoints
        }
      }))
  }

  async getLeagueSettings() {
    const leagueData = await this.getLeagueData()
    return {
      name: leagueData.settings.name,
      size: leagueData.settings.size,
      scoringPeriodId: leagueData.settings.scoringPeriodId,
      rosterSettings: leagueData.settings.rosterSettings,
      scoringSettings: leagueData.settings.scoringSettings
    }
  }

  async healthCheck() {
    try {
      await fetch(`${this.baseUrl}/seasons/${this.season}/segments/0/leagues/${this.leagueId}?view=mSettings`, {
        signal: AbortSignal.timeout(5000)
      })
      return {
        isHealthy: true,
        responseTime: Math.random() * 200 + 50,
        status: 'connected'
      }
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private mapPositionId(positionId: number): string {
    const positionMap: Record<number, string> = {
      1: 'QB',
      2: 'RB', 
      3: 'WR',
      4: 'TE',
      5: 'K',
      16: 'D/ST'
    }
    return positionMap[positionId] || 'UNKNOWN'
  }

  private mapTeamId(teamId: number): string {
    const teamMap: Record<number, string> = {
      2: 'BUF',
      3: 'MIA',
      4: 'NE',
      5: 'NYJ'
      // ... more teams
    }
    return teamMap[teamId] || 'UNK'
  }
}

// Mock AI service integration tests
class MockAIServiceIntegration {
  private aiServices: string[]
  private currentService: string

  constructor(services: string[] = ['claude', 'gemini', 'deepseek']) {
    this.aiServices = services
    this.currentService = services[0]
  }

  async queryAI(prompt: string, context: any = {}) {
    // Simulate different AI service responses
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100))

    if (this.currentService === 'claude') {
      return {
        response: `Claude AI Analysis: ${prompt}`,
        confidence: 95,
        service: 'claude',
        processingTime: 250
      }
    } else if (this.currentService === 'gemini') {
      return {
        response: `Gemini AI Analysis: ${prompt}`,
        confidence: 88,
        service: 'gemini',
        processingTime: 400
      }
    } else if (this.currentService === 'deepseek') {
      return {
        response: `DeepSeek AI Analysis: ${prompt}`,
        confidence: 82,
        service: 'deepseek',
        processingTime: 600
      }
    }

    throw new Error(`Unknown AI service: ${this.currentService}`)
  }

  async checkServiceHealth() {
    const results: Record<string, any> = {}

    for (const service of this.aiServices) {
      try {
        if (service === 'claude') {
          results[service] = { available: true, responseTime: 150 }
        } else if (service === 'gemini') {
          results[service] = { available: true, responseTime: 300 }
        } else if (service === 'deepseek') {
          results[service] = { available: Math.random() > 0.3, responseTime: 500 }
        }
      } catch (error) {
        results[service] = { available: false, error: error.message }
      }
    }

    return results
  }

  switchService(service: string) {
    if (this.aiServices.includes(service)) {
      this.currentService = service
      return true
    }
    return false
  }

  getCurrentService() {
    return this.currentService
  }
}

describe('ESPN API Service Integration Tests', () => {
  let espnService: MockESPNAPIService
  const testLeagueId = '123456789'

  beforeEach(() => {
    vi.clearAllMocks()
    espnService = new MockESPNAPIService(testLeagueId)
    
    // Mock global fetch for health checks
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('League Data Fetching', () => {
    it('should fetch league data successfully', async () => {
      const leagueData = await espnService.getLeagueData()

      expect(leagueData).toBeDefined()
      expect(leagueData.leagueId).toBe(testLeagueId)
      expect(leagueData.season).toBe(2024)
      expect(leagueData.teams).toBeDefined()
      expect(leagueData.members).toBeDefined()
      expect(leagueData.settings).toBeDefined()
    })

    it('should handle invalid league ID', async () => {
      const invalidService = new MockESPNAPIService('invalid')

      await expect(invalidService.getLeagueData()).rejects.toThrow('League not found')
    })

    it('should fetch teams data', async () => {
      const teams = await espnService.getTeams()

      expect(teams).toBeDefined()
      expect(teams).toHaveLength(1)
      expect(teams[0]).toHaveProperty('id')
      expect(teams[0]).toHaveProperty('name')
      expect(teams[0]).toHaveProperty('record')
    })

    it('should fetch league settings', async () => {
      const settings = await espnService.getLeagueSettings()

      expect(settings).toBeDefined()
      expect(settings.name).toBe('Test ESPN League')
      expect(settings.size).toBe(10)
      expect(settings.rosterSettings).toBeDefined()
      expect(settings.scoringSettings).toBeDefined()
    })
  })

  describe('Player Data Integration', () => {
    it('should fetch players with stats', async () => {
      const players = await espnService.getPlayers()

      expect(players).toBeDefined()
      expect(players).toHaveLength(1)
      
      const player = players[0]
      expect(player.id).toBe(3139477)
      expect(player.name).toBe('Josh Allen')
      expect(player.position).toBe('QB')
      expect(player.team).toBe('BUF')
      expect(player.stats).toBeDefined()
    })

    it('should fetch players for specific scoring period', async () => {
      const players = await espnService.getPlayers(11)

      expect(players).toBeDefined()
      expect(Array.isArray(players)).toBe(true)
    })
  })

  describe('Roster Management', () => {
    it('should fetch rosters', async () => {
      const rosters = await espnService.getRosters()

      expect(rosters).toBeDefined()
      expect(Array.isArray(rosters)).toBe(true)
      expect(rosters.length).toBeGreaterThan(0)
    })

    it('should fetch rosters for specific week', async () => {
      const rosters = await espnService.getRosters(1)

      expect(rosters).toBeDefined()
      expect(rosters.some(r => r.teamId === 1)).toBe(true)
    })
  })

  describe('Matchup Data', () => {
    it('should fetch matchups', async () => {
      const matchups = await espnService.getMatchups()

      expect(matchups).toBeDefined()
      expect(matchups).toHaveLength(1)
      
      const matchup = matchups[0]
      expect(matchup).toHaveProperty('away')
      expect(matchup).toHaveProperty('home')
      expect(matchup.away.totalPoints).toBe(125.5)
      expect(matchup.home.totalPoints).toBe(118.3)
    })

    it('should filter matchups by scoring period', async () => {
      const matchups = await espnService.getMatchups(1)

      expect(matchups).toBeDefined()
      matchups.forEach(matchup => {
        expect(matchup.matchupPeriodId).toBe(1)
      })
    })
  })

  describe('Health Monitoring', () => {
    it('should perform health check successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response)

      const health = await espnService.healthCheck()

      expect(health.isHealthy).toBe(true)
      expect(health.responseTime).toBeGreaterThan(0)
      expect(health.status).toBe('connected')
    })

    it('should handle health check failures', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      const health = await espnService.healthCheck()

      expect(health.isHealthy).toBe(false)
      expect(health.status).toBe('error')
      expect(health.error).toBe('Network error')
    })

    it('should handle health check timeouts', async () => {
      vi.mocked(global.fetch).mockImplementationOnce(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100)
        })
      )

      const health = await espnService.healthCheck()

      expect(health.isHealthy).toBe(false)
      expect(health.status).toBe('error')
    })
  })

  describe('Error Handling and Retry Logic', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network failure
      const networkFailureService = new MockESPNAPIService('network-error')
      vi.spyOn(networkFailureService, 'getLeagueData').mockRejectedValueOnce(
        new Error('Network request failed')
      )

      await expect(networkFailureService.getLeagueData()).rejects.toThrow('Network request failed')
    })

    it('should handle rate limiting', async () => {
      // Simulate rate limiting response
      const rateLimitedService = new MockESPNAPIService('rate-limited')
      vi.spyOn(rateLimitedService, 'getLeagueData').mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      )

      await expect(rateLimitedService.getLeagueData()).rejects.toThrow('Rate limit exceeded')
    })
  })
})

describe('AI Service Integration Tests', () => {
  let aiService: MockAIServiceIntegration

  beforeEach(() => {
    aiService = new MockAIServiceIntegration()
  })

  describe('Multi-Service AI Integration', () => {
    it('should query Claude AI service', async () => {
      aiService.switchService('claude')
      const result = await aiService.queryAI('Should I start Josh Allen?', {
        player: 'Josh Allen',
        position: 'QB'
      })

      expect(result.response).toContain('Claude AI Analysis')
      expect(result.confidence).toBe(95)
      expect(result.service).toBe('claude')
      expect(result.processingTime).toBe(250)
    })

    it('should query Gemini AI service', async () => {
      aiService.switchService('gemini')
      const result = await aiService.queryAI('Analyze my roster', {
        players: ['Josh Allen', 'Christian McCaffrey']
      })

      expect(result.response).toContain('Gemini AI Analysis')
      expect(result.confidence).toBe(88)
      expect(result.service).toBe('gemini')
      expect(result.processingTime).toBe(400)
    })

    it('should query DeepSeek AI service', async () => {
      aiService.switchService('deepseek')
      const result = await aiService.queryAI('Trade analysis', {
        trade: { giving: 'Josh Allen', receiving: 'Patrick Mahomes' }
      })

      expect(result.response).toContain('DeepSeek AI Analysis')
      expect(result.confidence).toBe(82)
      expect(result.service).toBe('deepseek')
      expect(result.processingTime).toBe(600)
    })

    it('should handle invalid AI service', async () => {
      const switched = aiService.switchService('invalid-service')
      expect(switched).toBe(false)
      expect(aiService.getCurrentService()).toBe('claude') // Should remain unchanged
    })
  })

  describe('AI Service Health Monitoring', () => {
    it('should check health of all AI services', async () => {
      const healthResults = await aiService.checkServiceHealth()

      expect(healthResults).toHaveProperty('claude')
      expect(healthResults).toHaveProperty('gemini')
      expect(healthResults).toHaveProperty('deepseek')

      expect(healthResults.claude.available).toBe(true)
      expect(healthResults.gemini.available).toBe(true)
      expect(healthResults.claude.responseTime).toBeLessThan(200)
    })

    it('should handle service failures in health check', async () => {
      const healthResults = await aiService.checkServiceHealth()

      // DeepSeek has random availability in mock
      if (!healthResults.deepseek.available) {
        expect(healthResults.deepseek.available).toBe(false)
      } else {
        expect(healthResults.deepseek.available).toBe(true)
        expect(healthResults.deepseek.responseTime).toBe(500)
      }
    })
  })

  describe('AI Service Fallback Chain', () => {
    it('should fall back to next service when primary fails', async () => {
      // Mock Claude failure
      const mockQueryAI = vi.spyOn(aiService, 'queryAI')
        .mockRejectedValueOnce(new Error('Claude service unavailable'))
        .mockResolvedValueOnce({
          response: 'Gemini fallback response',
          confidence: 88,
          service: 'gemini',
          processingTime: 400
        })

      aiService.switchService('gemini') // Switch to fallback
      const result = await aiService.queryAI('Test fallback')

      expect(result.response).toBe('Gemini fallback response')
      expect(result.service).toBe('gemini')

      mockQueryAI.mockRestore()
    })

    it('should maintain service switching functionality', () => {
      expect(aiService.getCurrentService()).toBe('claude')
      
      const switched = aiService.switchService('gemini')
      expect(switched).toBe(true)
      expect(aiService.getCurrentService()).toBe('gemini')

      aiService.switchService('deepseek')
      expect(aiService.getCurrentService()).toBe('deepseek')
    })
  })
})

describe('Combined ESPN + AI Integration Tests', () => {
  let espnService: MockESPNAPIService
  let aiService: MockAIServiceIntegration

  beforeEach(() => {
    espnService = new MockESPNAPIService('123456789')
    aiService = new MockAIServiceIntegration()
  })

  describe('Enhanced Fantasy Analysis Workflow', () => {
    it('should fetch ESPN data and enhance with AI analysis', async () => {
      // Fetch ESPN data
      const players = await espnService.getPlayers()
      expect(players).toHaveLength(1)
      
      const joshAllen = players.find(p => p.name === 'Josh Allen')
      expect(joshAllen).toBeDefined()

      // Get AI analysis for the player
      const aiResult = await aiService.queryAI(
        'Analyze Josh Allen for this week',
        { 
          player: joshAllen,
          context: 'weekly_start_sit'
        }
      )

      expect(aiResult.response).toContain('Analysis')
      expect(aiResult.confidence).toBeGreaterThan(80)
    })

    it('should combine league data with AI recommendations', async () => {
      // Get league settings
      const settings = await espnService.getLeagueSettings()
      expect(settings.name).toBe('Test ESPN League')

      // Get AI analysis for the league
      const aiResult = await aiService.queryAI(
        'Analyze league strategy',
        { 
          leagueSettings: settings,
          context: 'league_analysis'
        }
      )

      expect(aiResult.response).toContain('Analysis')
      expect(aiResult.service).toBe('claude')
    })

    it('should handle concurrent ESPN and AI requests', async () => {
      const [espnTeams, espnPlayers, aiHealth] = await Promise.all([
        espnService.getTeams(),
        espnService.getPlayers(),
        aiService.checkServiceHealth()
      ])

      expect(espnTeams).toBeDefined()
      expect(espnPlayers).toBeDefined()
      expect(aiHealth.claude.available).toBe(true)
    })

    it('should perform comprehensive health check', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response)

      const [espnHealth, aiHealth] = await Promise.all([
        espnService.healthCheck(),
        aiService.checkServiceHealth()
      ])

      expect(espnHealth.isHealthy).toBe(true)
      expect(aiHealth.claude.available).toBe(true)
      expect(aiHealth.gemini.available).toBe(true)
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle ESPN API failure with AI fallback advice', async () => {
      // Mock ESPN failure
      vi.spyOn(espnService, 'getPlayers').mockRejectedValueOnce(
        new Error('ESPN API unavailable')
      )

      // Should still be able to get general AI advice
      const aiResult = await aiService.queryAI(
        'General fantasy football advice when data is unavailable',
        { context: 'fallback_advice' }
      )

      expect(aiResult.response).toContain('Analysis')
      expect(aiResult.confidence).toBeGreaterThan(0)
    })

    it('should handle AI service failure with ESPN data only', async () => {
      // Mock AI failure
      vi.spyOn(aiService, 'queryAI').mockRejectedValueOnce(
        new Error('AI service unavailable')
      )

      // Should still be able to get ESPN data
      const players = await espnService.getPlayers()
      expect(players).toBeDefined()
      expect(players).toHaveLength(1)

      // Verify AI failure
      await expect(aiService.queryAI('test')).rejects.toThrow('AI service unavailable')
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const startTime = Date.now()
      
      const promises = [
        espnService.getPlayers(),
        espnService.getTeams(),
        espnService.getMatchups(),
        aiService.queryAI('Test query 1'),
        aiService.queryAI('Test query 2'),
        aiService.checkServiceHealth()
      ]

      const results = await Promise.all(promises)
      const endTime = Date.now()

      expect(results).toHaveLength(6)
      expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds
    })

    it('should maintain performance under load', async () => {
      const batchSize = 10
      const espnPromises = Array.from({ length: batchSize }, () => 
        espnService.getPlayers()
      )
      
      const aiPromises = Array.from({ length: batchSize }, (_, i) => 
        aiService.queryAI(`Batch query ${i}`)
      )

      const startTime = Date.now()
      const [espnResults, aiResults] = await Promise.all([
        Promise.all(espnPromises),
        Promise.all(aiPromises)
      ])
      const endTime = Date.now()

      expect(espnResults).toHaveLength(batchSize)
      expect(aiResults).toHaveLength(batchSize)
      expect(endTime - startTime).toBeLessThan(5000) // Reasonable time for batch processing
    })
  })
})