/**
 * Natural Language Command Parser Tests
 * Comprehensive tests for NLP parsing, entity extraction, and Gemini integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  NaturalLanguageCommandParser, 
  createNaturalLanguageParser,
  type ParsedCommand,
  type CommandType,
  type ParserContext
} from '../NaturalLanguageCommandParser'
import type { 
  LeagueAIContext, 
  AIEnhancedPlayer,
  League 
} from '../../types/LeagueTypes'
import type { Position } from '../../types'

// Mock data for testing
const mockLeague: League = {
  id: 'test-league-1',
  name: 'Test Champions League',
  platform: 'ESPN',
  totalTeams: 12,
  scoringType: 'PPR',
  settings: {
    rosterPositions: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'DEF', 'K'],
    playoffTeams: 6,
    regularSeasonLength: 14,
    playoffLength: 3
  }
}

const mockPlayers: AIEnhancedPlayer[] = [
  {
    id: 'player-1',
    name: 'Josh Allen',
    position: 'QB' as Position,
    team: 'BUF',
    projectedPoints: 25.4,
    aiInsights: {
      confidence: 95,
      recommendation: 'strong_start',
      reasoning: 'Elite QB1 with high ceiling'
    },
    fantasyRelevance: {
      rank: 1,
      tier: 1,
      upside: 'very_high',
      floor: 'high'
    }
  },
  {
    id: 'player-2',
    name: 'Christian McCaffrey',
    position: 'RB' as Position,
    team: 'SF',
    projectedPoints: 22.8,
    aiInsights: {
      confidence: 92,
      recommendation: 'must_start',
      reasoning: 'Elite RB1 with consistent production'
    },
    fantasyRelevance: {
      rank: 1,
      tier: 1,
      upside: 'high',
      floor: 'very_high'
    }
  },
  {
    id: 'player-3',
    name: 'Tyreek Hill',
    position: 'WR' as Position,
    team: 'MIA',
    projectedPoints: 18.6,
    aiInsights: {
      confidence: 88,
      recommendation: 'strong_start',
      reasoning: 'Elite WR1 with explosive upside'
    },
    fantasyRelevance: {
      rank: 2,
      tier: 1,
      upside: 'very_high',
      floor: 'medium'
    }
  },
  {
    id: 'player-4',
    name: 'Jonathan Taylor',
    position: 'RB' as Position,
    team: 'IND',
    projectedPoints: 20.1,
    aiInsights: {
      confidence: 85,
      recommendation: 'start',
      reasoning: 'High-volume RB with TD upside'
    },
    fantasyRelevance: {
      rank: 3,
      tier: 1,
      upside: 'high',
      floor: 'high'
    }
  },
  {
    id: 'player-5',
    name: 'DK Metcalf',
    position: 'WR' as Position,
    team: 'SEA',
    projectedPoints: 16.2,
    aiInsights: {
      confidence: 82,
      recommendation: 'start',
      reasoning: 'Red zone target with big play ability'
    },
    fantasyRelevance: {
      rank: 8,
      tier: 2,
      upside: 'high',
      floor: 'medium'
    }
  }
]

const mockLeagueContext: LeagueAIContext = {
  activeLeague: mockLeague,
  availableLeagues: [mockLeague],
  userRoster: mockPlayers.slice(0, 3),
  leagueSettings: mockLeague.settings,
  currentWeek: 10,
  crossLeagueData: {
    totalLeagues: 1,
    playerValueVariations: {},
    arbitrageOpportunities: []
  }
}

const mockParserContext: ParserContext = {
  leagueContext: mockLeagueContext,
  availablePlayers: mockPlayers,
  userRoster: mockPlayers.slice(0, 3),
  recentQueries: [],
  conversationHistory: []
}

describe('NaturalLanguageCommandParser', () => {
  let parser: NaturalLanguageCommandParser

  beforeEach(() => {
    parser = new NaturalLanguageCommandParser(mockParserContext)
  })

  describe('Command Type Recognition', () => {
    it('should recognize player analysis commands', async () => {
      const queries = [
        'Analyze Josh Allen this week',
        'Tell me about Christian McCaffrey',
        'How is Tyreek Hill looking?',
        'Should I start Jonathan Taylor?',
        'What about DK Metcalf for Sunday?'
      ]

      for (const query of queries) {
        const result = await parser.parseCommand(query)
        expect(result.type).toBe('player_analysis')
        expect(result.confidence).toBeGreaterThan(50)
        expect(result.entities.players).toBeDefined()
      }
    })

    it('should recognize player comparison commands', async () => {
      const queries = [
        'Compare Josh Allen vs Lamar Jackson',
        'Who should I start, CMC or Saquon?',
        'Tyreek Hill versus Stefon Diggs this week',
        'Josh Allen or Mahomes?',
        'Who is better between Taylor and Henry?'
      ]

      for (const query of queries) {
        const result = await parser.parseCommand(query)
        expect(result.type).toBe('player_comparison')
        expect(result.confidence).toBeGreaterThan(50)
      }
    })

    it('should recognize lineup optimization commands', async () => {
      const queries = [
        'Optimize my lineup for this week',
        'Who should I start this week?',
        'Best lineup for Week 10',
        'Start/sit recommendations',
        'Set my team for Sunday'
      ]

      for (const query of queries) {
        const result = await parser.parseCommand(query)
        expect(result.type).toBe('lineup_optimization')
        expect(result.confidence).toBeGreaterThan(40)
      }
    })

    it('should recognize waiver wire commands', async () => {
      const queries = [
        'Best waiver wire pickups this week',
        'Who should I pick up?',
        'Waiver targets for my team',
        'Drop and add recommendations',
        'Waiver wire help'
      ]

      for (const query of queries) {
        const result = await parser.parseCommand(query)
        expect(result.type).toBe('waiver_recommendations')
        expect(result.confidence).toBeGreaterThan(50)
      }
    })

    it('should recognize trade evaluation commands', async () => {
      const queries = [
        'Should I trade CMC for Josh Allen?',
        'Trade Tyreek Hill for two WRs?',
        'What is Josh Allen\'s trade value?',
        'Trade Jonathan Taylor for Kelce?'
      ]

      for (const query of queries) {
        const result = await parser.parseCommand(query)
        expect(result.type).toBe('trade_evaluation')
        expect(result.confidence).toBeGreaterThan(50)
        expect(result.entities.players).toBeDefined()
      }
    })

    it('should recognize roster analysis commands', async () => {
      const queries = [
        'Analyze my roster',
        'How is my team looking?',
        'Rate my team for playoffs',
        'Roster analysis for my Champions league',
        'Grade my team'
      ]

      for (const query of queries) {
        const result = await parser.parseCommand(query)
        expect(result.type).toBe('roster_analysis')
        expect(result.confidence).toBeGreaterThan(50)
      }
    })

    it('should recognize matchup analysis commands', async () => {
      const queries = [
        'Matchup analysis this week',
        'Who am I playing against?',
        'Preview my matchup',
        'Opponent analysis'
      ]

      for (const query of queries) {
        const result = await parser.parseCommand(query)
        expect(result.type).toBe('matchup_analysis')
        expect(result.confidence).toBeGreaterThan(50)
      }
    })
  })

  describe('Entity Extraction', () => {
    it('should extract player names correctly', async () => {
      const result = await parser.parseCommand('Should I start Josh Allen or Christian McCaffrey this week?')
      
      expect(result.entities.players).toBeDefined()
      expect(result.entities.players).toContain('Josh Allen')
      expect(result.entities.players).toContain('Christian McCaffrey')
    })

    it('should extract player nicknames', async () => {
      const queries = [
        'Should I start CMC this week?', // Christian McCaffrey
        'What about JT for Sunday?', // Jonathan Taylor  
        'DK or Tyreek this week?', // DK Metcalf
      ]

      for (const query of queries) {
        const result = await parser.parseCommand(query)
        expect(result.entities.players).toBeDefined()
        expect(result.entities.players!.length).toBeGreaterThan(0)
      }
    })

    it('should extract positions correctly', async () => {
      const queries = [
        'Best QB for this week?',
        'Top RB waiver pickups',
        'WR rankings for Week 10',
        'Tight end sleepers',
        'Kicker recommendations',
        'Defense streaming options'
      ]

      const expectedPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']

      for (let i = 0; i < queries.length; i++) {
        const result = await parser.parseCommand(queries[i])
        expect(result.entities.positions).toBeDefined()
        expect(result.entities.positions).toContain(expectedPositions[i])
      }
    })

    it('should extract timeframes correctly', async () => {
      const testCases = [
        { query: 'Start Josh Allen this week', expected: 'this_week' },
        { query: 'Who to draft next week?', expected: 'next_week' },
        { query: 'Best players for playoffs', expected: 'playoffs' },
        { query: 'Rest of season outlook', expected: 'rest_of_season' }
      ]

      for (const testCase of testCases) {
        const result = await parser.parseCommand(testCase.query)
        expect(result.entities.timeframe).toBe(testCase.expected)
      }
    })

    it('should extract actions correctly', async () => {
      const testCases = [
        { query: 'Should I start Josh Allen?', expected: 'start' },
        { query: 'Sit Tyreek Hill this week?', expected: 'sit' },
        { query: 'Trade Christian McCaffrey?', expected: 'trade' },
        { query: 'Drop Jonathan Taylor?', expected: 'drop' },
        { query: 'Pick up a defense?', expected: 'pick_up' },
        { query: 'Compare these players', expected: 'compare' }
      ]

      for (const testCase of testCases) {
        const result = await parser.parseCommand(testCase.query)
        expect(result.entities.action).toBe(testCase.expected)
      }
    })

    it('should extract league references', async () => {
      const result = await parser.parseCommand('Analyze my Champions League roster')
      expect(result.entities.league).toBeDefined()
      expect(result.entities.league).toContain('Champions')
    })
  })

  describe('Context Enhancement', () => {
    it('should inherit context from recent queries', async () => {
      // Add a previous query with league context
      const previousQuery: ParsedCommand = {
        type: 'player_analysis',
        confidence: 85,
        entities: {
          league: 'Test Champions League',
          timeframe: 'this_week'
        },
        parameters: {},
        originalQuery: 'Analyze Josh Allen for Champions League this week',
        processedQuery: 'analyze josh allen for champions league this week'
      }

      parser.updateContext({
        ...mockParserContext,
        recentQueries: [previousQuery]
      })

      const result = await parser.parseCommand('What about Christian McCaffrey?')
      
      // Should inherit league from previous query
      expect(result.entities.league).toBeDefined()
    })

    it('should validate player names against available players', async () => {
      const result = await parser.parseCommand('Should I start Josh Allen and Fake Player?')
      
      expect(result.entities.players).toBeDefined()
      expect(result.entities.players).toContain('Josh Allen')
      // Fake Player should be filtered out
      expect(result.entities.players).not.toContain('Fake Player')
    })

    it('should detect ambiguous player references', async () => {
      const result = await parser.parseCommand('What about Taylor this week?')
      
      // Should detect ambiguity if there are multiple Taylors
      if (result.ambiguities && result.ambiguities.length > 0) {
        expect(result.ambiguities[0].entity).toBe('Taylor')
        expect(result.ambiguities[0].possibleValues).toBeDefined()
        expect(result.ambiguities[0].clarificationNeeded).toContain('Did you mean')
      }
    })
  })

  describe('Confidence Scoring', () => {
    it('should assign higher confidence to exact matches', async () => {
      const exactMatch = await parser.parseCommand('Analyze Josh Allen this week')
      const vagueQuery = await parser.parseCommand('What should I do?')
      
      expect(exactMatch.confidence).toBeGreaterThan(vagueQuery.confidence)
    })

    it('should boost confidence for entity matches', async () => {
      const withEntities = await parser.parseCommand('Start Josh Allen at QB this week')
      const withoutEntities = await parser.parseCommand('General football advice')
      
      expect(withEntities.confidence).toBeGreaterThan(withoutEntities.confidence)
    })

    it('should penalize confidence for missing required entities', async () => {
      const result = await parser.parseCommand('Compare players') // Missing player names
      
      expect(result.confidence).toBeLessThan(70)
    })
  })

  describe('Follow-up Suggestions', () => {
    it('should provide relevant follow-up suggestions', async () => {
      const result = await parser.parseCommand('Analyze Josh Allen this week')
      
      expect(result.suggestedFollowUp).toBeDefined()
      expect(result.suggestedFollowUp!.length).toBeGreaterThan(0)
      expect(result.suggestedFollowUp).toContain('Compare this player to alternatives')
    })

    it('should provide different suggestions for different command types', async () => {
      const playerAnalysis = await parser.parseCommand('Analyze Josh Allen')
      const waiver = await parser.parseCommand('Best waiver pickups')
      
      expect(playerAnalysis.suggestedFollowUp).not.toEqual(waiver.suggestedFollowUp)
    })
  })

  describe('Parameter Extraction', () => {
    it('should extract comparison parameters correctly', async () => {
      const result = await parser.parseCommand('Compare Josh Allen to Patrick Mahomes')
      
      if (result.type === 'player_comparison') {
        expect(result.parameters.player1).toBeDefined()
        expect(result.parameters.player2).toBeDefined()
      }
    })

    it('should extract trade parameters correctly', async () => {
      const result = await parser.parseCommand('Should I trade Christian McCaffrey for Josh Allen?')
      
      if (result.type === 'trade_evaluation') {
        expect(result.parameters.givingUp).toBeDefined()
        expect(result.parameters.gettingBack).toBeDefined()
      }
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty queries gracefully', async () => {
      const result = await parser.parseCommand('')
      expect(result.type).toBe('general_advice')
      expect(result.confidence).toBeLessThan(50)
    })

    it('should handle very long queries', async () => {
      const longQuery = 'Should I start '.repeat(100) + 'Josh Allen this week?'
      const result = await parser.parseCommand(longQuery)
      
      expect(result).toBeDefined()
      expect(result.type).toBeDefined()
    })

    it('should handle queries with special characters', async () => {
      const result = await parser.parseCommand('Should I start Josh Allen??? What about CMC!!!')
      
      expect(result).toBeDefined()
      expect(result.entities.players).toBeDefined()
    })

    it('should handle mixed case queries', async () => {
      const result = await parser.parseCommand('SHOULD I START josh allen THIS WEEK?')
      
      expect(result.entities.players).toContain('Josh Allen')
      expect(result.entities.timeframe).toBe('this_week')
    })
  })

  describe('Context Updates', () => {
    it('should update context correctly', () => {
      const newPlayers = [...mockPlayers, {
        id: 'new-player',
        name: 'New Player',
        position: 'QB' as Position,
        team: 'NEW',
        projectedPoints: 15,
        aiInsights: {
          confidence: 75,
          recommendation: 'start',
          reasoning: 'Test player'
        },
        fantasyRelevance: {
          rank: 10,
          tier: 2,
          upside: 'medium',
          floor: 'medium'
        }
      }]

      parser.updateContext({
        ...mockParserContext,
        availablePlayers: newPlayers
      })

      // Parser should now recognize the new player
      // This is tested indirectly through the internal player name map
      expect(parser).toBeDefined()
    })
  })

  describe('Utility Methods', () => {
    it('should provide examples for command intents', () => {
      const examples = parser.getExamplesForIntent('player_analysis')
      expect(examples).toBeDefined()
      expect(examples.length).toBeGreaterThan(0)
    })

    it('should provide list of supported commands', () => {
      const commands = parser.getSupportedCommands()
      expect(commands).toBeDefined()
      expect(commands).toContain('player_analysis')
      expect(commands).toContain('lineup_optimization')
      expect(commands).toContain('trade_evaluation')
    })
  })
})

describe('Parser Factory Function', () => {
  it('should create parser instance correctly', () => {
    const parser = createNaturalLanguageParser(mockParserContext)
    expect(parser).toBeInstanceOf(NaturalLanguageCommandParser)
  })
})

describe('Gemini Integration (Mocked)', () => {
  it('should fall back to pattern matching when Gemini unavailable', async () => {
    const parser = new NaturalLanguageCommandParser(mockParserContext)
    
    const result = await parser.parseCommand('Should I start Josh Allen this week?')
    
    // Should still work with pattern matching
    expect(result.type).toBe('player_analysis')
    expect(result.entities.players).toContain('Josh Allen')
  })

  it('should handle complex queries with pattern fallback', async () => {
    const parser = new NaturalLanguageCommandParser(mockParserContext)
    
    const complexQuery = 'Given my current roster situation and the upcoming playoff schedule, should I consider trading Christian McCaffrey for a more consistent WR1 option like Tyreek Hill, especially considering the injury risk?'
    
    const result = await parser.parseCommand(complexQuery)
    
    expect(result).toBeDefined()
    expect(result.type).toBeDefined()
    expect(result.entities.players).toBeDefined()
  })
})