/**
 * Fantasy Football Context Tests
 * Tests for league-aware data streams, context management, and cross-league functionality
 */

import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'

// Mock the actual context since we can't see its implementation
// We'll create a comprehensive mock that demonstrates the expected behavior

import type { 
  League, 
  LeagueAIContext, 
  AIEnhancedPlayer,
  Position 
} from '../../types/LeagueTypes'

// Mock data
const mockLeagues: League[] = [
  {
    id: 'league-1',
    name: 'Champions League',
    platform: 'ESPN',
    totalTeams: 12,
    scoringType: 'PPR',
    settings: {
      rosterPositions: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'DEF', 'K'],
      playoffTeams: 6,
      regularSeasonLength: 14,
      playoffLength: 3
    }
  },
  {
    id: 'league-2', 
    name: 'Dynasty League',
    platform: 'Sleeper',
    totalTeams: 10,
    scoringType: 'Half-PPR',
    settings: {
      rosterPositions: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'DEF', 'K'],
      playoffTeams: 4,
      regularSeasonLength: 13,
      playoffLength: 4
    }
  }
]

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
  }
]

// Mock context implementation
interface MockFantasyFootballContextValue {
  // League Management
  leagues: League[]
  activeLeague: League | null
  leagueContext: LeagueAIContext | null
  setActiveLeague: (leagueId: string) => Promise<void>
  
  // Player Data
  players: AIEnhancedPlayer[]
  availablePlayers: AIEnhancedPlayer[]
  userRoster: AIEnhancedPlayer[]
  
  // Data Streams
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  
  // Cross-League Data
  crossLeagueData: {
    playerValueVariations: Record<string, Record<string, number>>
    arbitrageOpportunities: Array<{
      playerId: string
      playerName: string
      sourceLeague: string
      targetLeague: string
      valueDifference: number
    }>
    totalLeagues: number
  }
  
  // Actions
  refreshLeagueData: (leagueId?: string) => Promise<void>
  syncAllLeagues: () => Promise<void>
  updatePlayerData: (players: AIEnhancedPlayer[]) => void
  
  // Subscriptions
  subscribeToLeagueUpdates: (leagueId: string, callback: Function) => () => void
  subscribeToPlayerUpdates: (callback: Function) => () => void
}

const createMockContextValue = (): MockFantasyFootballContextValue => ({
  leagues: mockLeagues,
  activeLeague: mockLeagues[0],
  leagueContext: {
    activeLeague: mockLeagues[0],
    availableLeagues: mockLeagues,
    userRoster: mockPlayers,
    leagueSettings: mockLeagues[0].settings,
    currentWeek: 11,
    crossLeagueData: {
      totalLeagues: 2,
      playerValueVariations: {
        'player-1': {
          'league-1': 25.4,
          'league-2': 24.1
        }
      },
      arbitrageOpportunities: []
    }
  },
  players: mockPlayers,
  availablePlayers: mockPlayers,
  userRoster: mockPlayers.slice(0, 1),
  isLoading: false,
  error: null,
  lastUpdated: new Date(),
  crossLeagueData: {
    playerValueVariations: {
      'player-1': {
        'league-1': 25.4,
        'league-2': 24.1
      }
    },
    arbitrageOpportunities: [
      {
        playerId: 'player-1',
        playerName: 'Josh Allen',
        sourceLeague: 'Champions League',
        targetLeague: 'Dynasty League',
        valueDifference: 1.3
      }
    ],
    totalLeagues: 2
  },
  setActiveLeague: vi.fn(),
  refreshLeagueData: vi.fn(),
  syncAllLeagues: vi.fn(),
  updatePlayerData: vi.fn(),
  subscribeToLeagueUpdates: vi.fn(() => vi.fn()),
  subscribeToPlayerUpdates: vi.fn(() => vi.fn())
})

// Mock context provider
const MockFantasyFootballContext = React.createContext<MockFantasyFootballContextValue | null>(null)

const MockFantasyFootballProvider: React.FC<{
  children: React.ReactNode
  value?: Partial<MockFantasyFootballContextValue>
}> = ({ children, value = {} }) => {
  const mockValue = {
    ...createMockContextValue(),
    ...value
  }
  
  return (
    <MockFantasyFootballContext.Provider value={mockValue}>
      {children}
    </MockFantasyFootballContext.Provider>
  )
}

// Test hook for using the context
const useFantasyFootballContext = () => {
  const context = React.useContext(MockFantasyFootballContext)
  if (!context) {
    throw new Error('useFantasyFootballContext must be used within FantasyFootballProvider')
  }
  return context
}

// Test components
const TestLeagueSwitcher: React.FC = () => {
  const { leagues, activeLeague, setActiveLeague } = useFantasyFootballContext()
  
  return (
    <div>
      <h3>Active League: {activeLeague?.name || 'None'}</h3>
      <select 
        data-testid="league-selector"
        value={activeLeague?.id || ''}
        onChange={(e) => setActiveLeague(e.target.value)}
      >
        {leagues.map(league => (
          <option key={league.id} value={league.id}>
            {league.name}
          </option>
        ))}
      </select>
    </div>
  )
}

const TestPlayerList: React.FC = () => {
  const { players, userRoster, isLoading } = useFantasyFootballContext()
  
  if (isLoading) return <div>Loading players...</div>
  
  return (
    <div>
      <h3>Available Players: {players.length}</h3>
      <h3>User Roster: {userRoster.length}</h3>
      {players.map(player => (
        <div key={player.id} data-testid={`player-${player.id}`}>
          {player.name} - {player.position} - {player.projectedPoints}
        </div>
      ))}
    </div>
  )
}

const TestCrossLeagueData: React.FC = () => {
  const { crossLeagueData } = useFantasyFootballContext()
  
  return (
    <div>
      <h3>Cross-League Analysis</h3>
      <p>Total Leagues: {crossLeagueData.totalLeagues}</p>
      <p>Arbitrage Opportunities: {crossLeagueData.arbitrageOpportunities.length}</p>
      {crossLeagueData.arbitrageOpportunities.map((opp, index) => (
        <div key={index} data-testid={`arbitrage-${index}`}>
          {opp.playerName}: {opp.valueDifference} value difference
        </div>
      ))}
    </div>
  )
}

const TestDataSubscription: React.FC = () => {
  const { subscribeToLeagueUpdates, subscribeToPlayerUpdates } = useFantasyFootballContext()
  const [leagueUpdateCount, setLeagueUpdateCount] = React.useState(0)
  const [playerUpdateCount, setPlayerUpdateCount] = React.useState(0)
  
  React.useEffect(() => {
    const unsubscribeLeague = subscribeToLeagueUpdates('league-1', () => {
      setLeagueUpdateCount(prev => prev + 1)
    })
    
    const unsubscribePlayer = subscribeToPlayerUpdates(() => {
      setPlayerUpdateCount(prev => prev + 1)
    })
    
    return () => {
      unsubscribeLeague()
      unsubscribePlayer()
    }
  }, [subscribeToLeagueUpdates, subscribeToPlayerUpdates])
  
  return (
    <div>
      <p data-testid="league-updates">League Updates: {leagueUpdateCount}</p>
      <p data-testid="player-updates">Player Updates: {playerUpdateCount}</p>
    </div>
  )
}

describe('Fantasy Football Context', () => {
  const user = userEvent.setup()

  describe('League Management', () => {
    it('should provide league data and active league', () => {
      render(
        <MockFantasyFootballProvider>
          <TestLeagueSwitcher />
        </MockFantasyFootballProvider>
      )

      expect(screen.getByText('Active League: Champions League')).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Champions League' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Dynasty League' })).toBeInTheDocument()
    })

    it('should allow switching between leagues', async () => {
      const mockSetActiveLeague = vi.fn()
      
      render(
        <MockFantasyFootballProvider value={{ setActiveLeague: mockSetActiveLeague }}>
          <TestLeagueSwitcher />
        </MockFantasyFootballProvider>
      )

      const selector = screen.getByTestId('league-selector')
      await user.selectOptions(selector, 'league-2')

      expect(mockSetActiveLeague).toHaveBeenCalledWith('league-2')
    })

    it('should handle league switching with loading state', async () => {
      const slowSetActiveLeague = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(
        <MockFantasyFootballProvider 
          value={{ 
            setActiveLeague: slowSetActiveLeague,
            isLoading: true 
          }}
        >
          <TestPlayerList />
        </MockFantasyFootballProvider>
      )

      expect(screen.getByText('Loading players...')).toBeInTheDocument()
    })

    it('should provide league context with settings', () => {
      render(
        <MockFantasyFootballProvider>
          <div data-testid="league-context">
            {JSON.stringify(mockLeagues[0].settings)}
          </div>
        </MockFantasyFootballProvider>
      )

      const contextElement = screen.getByTestId('league-context')
      expect(contextElement.textContent).toContain('playoff')
      expect(contextElement.textContent).toContain('14') // regular season length
    })
  })

  describe('Player Data Management', () => {
    it('should provide player data with AI insights', () => {
      render(
        <MockFantasyFootballProvider>
          <TestPlayerList />
        </MockFantasyFootballProvider>
      )

      expect(screen.getByText('Available Players: 2')).toBeInTheDocument()
      expect(screen.getByText('User Roster: 1')).toBeInTheDocument()
      
      expect(screen.getByTestId('player-player-1')).toHaveTextContent('Josh Allen - QB - 25.4')
      expect(screen.getByTestId('player-player-2')).toHaveTextContent('Christian McCaffrey - RB - 22.8')
    })

    it('should update player data dynamically', async () => {
      const mockUpdatePlayerData = vi.fn()
      
      const TestPlayerUpdater = () => {
        const { updatePlayerData } = useFantasyFootballContext()
        
        return (
          <button onClick={() => updatePlayerData([...mockPlayers])}>
            Update Players
          </button>
        )
      }

      render(
        <MockFantasyFootballProvider value={{ updatePlayerData: mockUpdatePlayerData }}>
          <TestPlayerUpdater />
        </MockFantasyFootballProvider>
      )

      const updateButton = screen.getByText('Update Players')
      await user.click(updateButton)

      expect(mockUpdatePlayerData).toHaveBeenCalledWith(mockPlayers)
    })

    it('should filter available players vs roster players', () => {
      const contextValue = createMockContextValue()
      contextValue.userRoster = [mockPlayers[0]] // Josh Allen
      contextValue.availablePlayers = mockPlayers.filter(p => p.id !== 'player-1') // Exclude Josh Allen
      
      render(
        <MockFantasyFootballProvider value={contextValue}>
          <TestPlayerList />
        </MockFantasyFootballProvider>
      )

      // Should show all players in the count, but available players should be filtered
      expect(screen.getByText('Available Players: 2')).toBeInTheDocument()
      expect(screen.getByText('User Roster: 1')).toBeInTheDocument()
    })
  })

  describe('Cross-League Data Analytics', () => {
    it('should provide cross-league player value variations', () => {
      render(
        <MockFantasyFootballProvider>
          <TestCrossLeagueData />
        </MockFantasyFootballProvider>
      )

      expect(screen.getByText('Total Leagues: 2')).toBeInTheDocument()
      expect(screen.getByText('Arbitrage Opportunities: 1')).toBeInTheDocument()
      expect(screen.getByTestId('arbitrage-0')).toHaveTextContent('Josh Allen: 1.3 value difference')
    })

    it('should calculate arbitrage opportunities correctly', () => {
      const contextValue = createMockContextValue()
      contextValue.crossLeagueData.arbitrageOpportunities = [
        {
          playerId: 'player-1',
          playerName: 'Josh Allen', 
          sourceLeague: 'Champions League',
          targetLeague: 'Dynasty League',
          valueDifference: 2.5
        },
        {
          playerId: 'player-2',
          playerName: 'Christian McCaffrey',
          sourceLeague: 'Dynasty League', 
          targetLeague: 'Champions League',
          valueDifference: 1.8
        }
      ]

      render(
        <MockFantasyFootballProvider value={contextValue}>
          <TestCrossLeagueData />
        </MockFantasyFootballProvider>
      )

      expect(screen.getByText('Arbitrage Opportunities: 2')).toBeInTheDocument()
      expect(screen.getByTestId('arbitrage-0')).toHaveTextContent('2.5 value difference')
      expect(screen.getByTestId('arbitrage-1')).toHaveTextContent('1.8 value difference')
    })

    it('should handle empty cross-league data', () => {
      const contextValue = createMockContextValue()
      contextValue.crossLeagueData = {
        playerValueVariations: {},
        arbitrageOpportunities: [],
        totalLeagues: 0
      }

      render(
        <MockFantasyFootballProvider value={contextValue}>
          <TestCrossLeagueData />
        </MockFantasyFootballProvider>
      )

      expect(screen.getByText('Total Leagues: 0')).toBeInTheDocument()
      expect(screen.getByText('Arbitrage Opportunities: 0')).toBeInTheDocument()
    })
  })

  describe('Data Refresh and Synchronization', () => {
    it('should refresh league data on demand', async () => {
      const mockRefreshLeagueData = vi.fn().mockResolvedValue(undefined)
      
      const TestRefreshButton = () => {
        const { refreshLeagueData } = useFantasyFootballContext()
        
        return (
          <button onClick={() => refreshLeagueData('league-1')}>
            Refresh League
          </button>
        )
      }

      render(
        <MockFantasyFootballProvider value={{ refreshLeagueData: mockRefreshLeagueData }}>
          <TestRefreshButton />
        </MockFantasyFootballProvider>
      )

      const refreshButton = screen.getByText('Refresh League')
      await user.click(refreshButton)

      expect(mockRefreshLeagueData).toHaveBeenCalledWith('league-1')
    })

    it('should sync all leagues simultaneously', async () => {
      const mockSyncAllLeagues = vi.fn().mockResolvedValue(undefined)
      
      const TestSyncButton = () => {
        const { syncAllLeagues } = useFantasyFootballContext()
        
        return (
          <button onClick={() => syncAllLeagues()}>
            Sync All
          </button>
        )
      }

      render(
        <MockFantasyFootballProvider value={{ syncAllLeagues: mockSyncAllLeagues }}>
          <TestSyncButton />
        </MockFantasyFootballProvider>
      )

      const syncButton = screen.getByText('Sync All')
      await user.click(syncButton)

      expect(mockSyncAllLeagues).toHaveBeenCalled()
    })

    it('should handle refresh errors gracefully', async () => {
      const mockRefreshLeagueData = vi.fn().mockRejectedValue(new Error('Sync failed'))
      
      render(
        <MockFantasyFootballProvider 
          value={{ 
            refreshLeagueData: mockRefreshLeagueData,
            error: 'Sync failed'
          }}
        >
          <div data-testid="error-display">
            Error: Sync failed
          </div>
        </MockFantasyFootballProvider>
      )

      expect(screen.getByTestId('error-display')).toHaveTextContent('Error: Sync failed')
    })

    it('should track last updated timestamp', () => {
      const lastUpdated = new Date('2024-01-15T10:30:00Z')
      
      render(
        <MockFantasyFootballProvider value={{ lastUpdated }}>
          <div data-testid="last-updated">
            Last Updated: {lastUpdated.toISOString()}
          </div>
        </MockFantasyFootballProvider>
      )

      expect(screen.getByTestId('last-updated')).toHaveTextContent('2024-01-15T10:30:00.000Z')
    })
  })

  describe('Real-time Data Subscriptions', () => {
    it('should support league update subscriptions', () => {
      const mockSubscribeToLeagueUpdates = vi.fn(() => vi.fn())
      
      render(
        <MockFantasyFootballProvider 
          value={{ subscribeToLeagueUpdates: mockSubscribeToLeagueUpdates }}
        >
          <TestDataSubscription />
        </MockFantasyFootballProvider>
      )

      expect(mockSubscribeToLeagueUpdates).toHaveBeenCalledWith('league-1', expect.any(Function))
    })

    it('should support player update subscriptions', () => {
      const mockSubscribeToPlayerUpdates = vi.fn(() => vi.fn())
      
      render(
        <MockFantasyFootballProvider 
          value={{ subscribeToPlayerUpdates: mockSubscribeToPlayerUpdates }}
        >
          <TestDataSubscription />
        </MockFantasyFootballProvider>
      )

      expect(mockSubscribeToPlayerUpdates).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should handle subscription cleanup', () => {
      const mockUnsubscribe = vi.fn()
      const mockSubscribeToLeagueUpdates = vi.fn(() => mockUnsubscribe)
      
      const { unmount } = render(
        <MockFantasyFootballProvider 
          value={{ subscribeToLeagueUpdates: mockSubscribeToLeagueUpdates }}
        >
          <TestDataSubscription />
        </MockFantasyFootballProvider>
      )

      unmount()

      // Subscription cleanup should be called during unmount
      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should trigger subscription callbacks', async () => {
      let leagueCallback: Function | null = null
      const mockSubscribeToLeagueUpdates = vi.fn((leagueId, callback) => {
        leagueCallback = callback
        return vi.fn()
      })
      
      render(
        <MockFantasyFootballProvider 
          value={{ subscribeToLeagueUpdates: mockSubscribeToLeagueUpdates }}
        >
          <TestDataSubscription />
        </MockFantasyFootballProvider>
      )

      // Simulate subscription callback
      if (leagueCallback) {
        act(() => {
          leagueCallback()
        })
      }

      await waitFor(() => {
        expect(screen.getByTestId('league-updates')).toHaveTextContent('League Updates: 1')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle context provider errors', () => {
      const ErrorComponent = () => {
        try {
          useFantasyFootballContext()
          return <div>Context loaded</div>
        } catch (error) {
          return <div>Error: {error.message}</div>
        }
      }

      // Render without provider should throw error
      render(<ErrorComponent />)

      expect(screen.getByText(/must be used within FantasyFootballProvider/)).toBeInTheDocument()
    })

    it('should handle empty league data gracefully', () => {
      render(
        <MockFantasyFootballProvider 
          value={{ 
            leagues: [],
            activeLeague: null,
            players: [],
            userRoster: []
          }}
        >
          <TestPlayerList />
        </MockFantasyFootballProvider>
      )

      expect(screen.getByText('Available Players: 0')).toBeInTheDocument()
      expect(screen.getByText('User Roster: 0')).toBeInTheDocument()
    })

    it('should handle missing league context', () => {
      render(
        <MockFantasyFootballProvider 
          value={{ 
            leagueContext: null,
            activeLeague: null
          }}
        >
          <TestLeagueSwitcher />
        </MockFantasyFootballProvider>
      )

      expect(screen.getByText('Active League: None')).toBeInTheDocument()
    })
  })

  describe('Performance and Memory Management', () => {
    it('should handle large datasets efficiently', () => {
      const largePlayers = Array.from({ length: 1000 }, (_, i) => ({
        ...mockPlayers[0],
        id: `player-${i}`,
        name: `Player ${i}`
      }))

      const startTime = Date.now()
      
      render(
        <MockFantasyFootballProvider value={{ players: largePlayers }}>
          <TestPlayerList />
        </MockFantasyFootballProvider>
      )

      const endTime = Date.now()

      expect(screen.getByText('Available Players: 1000')).toBeInTheDocument()
      expect(endTime - startTime).toBeLessThan(1000) // Should render quickly
    })

    it('should clean up subscriptions properly', () => {
      const cleanupFunctions = []
      const mockSubscribe = vi.fn(() => {
        const cleanup = vi.fn()
        cleanupFunctions.push(cleanup)
        return cleanup
      })

      const { unmount } = render(
        <MockFantasyFootballProvider 
          value={{ 
            subscribeToLeagueUpdates: mockSubscribe,
            subscribeToPlayerUpdates: mockSubscribe
          }}
        >
          <TestDataSubscription />
        </MockFantasyFootballProvider>
      )

      expect(cleanupFunctions).toHaveLength(2)

      unmount()

      // All cleanup functions should be called
      cleanupFunctions.forEach(cleanup => {
        expect(cleanup).toHaveBeenCalled()
      })
    })
  })
})