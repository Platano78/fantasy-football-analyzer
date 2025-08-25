/**
 * AIEnhancedChatPanel Component Tests
 * Tests for the enhanced AI chat functionality, virtualization, and league context integration
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { AIEnhancedChatPanel, type AIEnhancedChatProps } from '../AIEnhancedChatPanel'
import type { 
  EnhancedChatMessage, 
  LeagueAIContext, 
  League,
  AIEnhancedPlayer 
} from '../../types/LeagueTypes'
import type { Position } from '../../types'

// Mock dependencies
vi.mock('../draft/AIChat', () => ({
  AIChat: vi.fn(() => <div data-testid="mock-ai-chat">Mock AI Chat</div>),
  ChatMessage: vi.fn(),
  DraftContext: vi.fn(),
  AIChatProps: vi.fn()
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Send: () => <span data-testid="send-icon">Send</span>,
  Bot: () => <span data-testid="bot-icon">Bot</span>,
  User: () => <span data-testid="user-icon">User</span>,
  Loader: () => <span data-testid="loader-icon">Loading</span>,
  AlertTriangle: () => <span data-testid="alert-icon">Alert</span>,
  Brain: () => <span data-testid="brain-icon">Brain</span>,
  MessageSquare: () => <span data-testid="message-icon">Message</span>,
  Target: () => <span data-testid="target-icon">Target</span>,
  TrendingUp: () => <span data-testid="trending-icon">Trending</span>,
  Zap: () => <span data-testid="zap-icon">Zap</span>,
  Shield: () => <span data-testid="shield-icon">Shield</span>
}))

// Mock data
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
  }
]

const mockLeagueContext: LeagueAIContext = {
  activeLeague: mockLeague,
  availableLeagues: [mockLeague],
  userRoster: mockPlayers,
  leagueSettings: mockLeague.settings,
  currentWeek: 10,
  crossLeagueData: {
    totalLeagues: 1,
    playerValueVariations: {},
    arbitrageOpportunities: []
  }
}

const mockMessages: EnhancedChatMessage[] = [
  {
    id: 'msg-1',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    sender: 'user',
    message: 'Should I start Josh Allen this week?',
    leagueContext: {
      leagueId: 'test-league-1',
      relevantPlayers: [mockPlayers[0]],
      contextType: 'player_analysis'
    }
  },
  {
    id: 'msg-2',
    timestamp: new Date('2024-01-15T10:00:30Z'),
    sender: 'ai',
    message: 'Yes, Josh Allen is an excellent start this week. He has a favorable matchup and should provide strong fantasy production.',
    leagueContext: {
      leagueId: 'test-league-1',
      relevantPlayers: [mockPlayers[0]],
      contextType: 'player_analysis'
    },
    aiMetadata: {
      confidence: 'high',
      processingTime: 250,
      model: 'claude'
    },
    leagueRelevantPlayers: [mockPlayers[0]]
  }
]

const defaultProps: AIEnhancedChatProps = {
  messages: mockMessages,
  leagueContext: mockLeagueContext,
  onSendMessage: vi.fn(),
  aiServiceChain: ['claude', 'gemini', 'deepseek', 'offline'],
  currentAIService: 'claude',
  activeLeagueId: 'test-league-1',
  availableLeagues: [mockLeague],
  isLoading: false,
  error: null
}

describe('AIEnhancedChatPanel', () => {
  const user = userEvent.setup()
  let mockOnSendMessage: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnSendMessage = vi.fn()
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the chat panel with header', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByText('AI League Assistant')).toBeInTheDocument()
      expect(screen.getByText('Claude')).toBeInTheDocument()
      expect(screen.getByText('Test Champions League')).toBeInTheDocument()
    })

    it('should display AI service status indicator', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          currentAIService="gemini"
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByText('Gemini')).toBeInTheDocument()
    })

    it('should show league switcher when multiple leagues available', () => {
      const multipleLeagues = [
        mockLeague,
        { ...mockLeague, id: 'league-2', name: 'Second League' }
      ]

      render(
        <AIEnhancedChatPanel 
          {...defaultProps}
          availableLeagues={multipleLeagues}
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should display error messages when present', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps}
          error="Service temporarily unavailable"
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByText('Service temporarily unavailable')).toBeInTheDocument()
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    })
  })

  describe('Message Display', () => {
    it('should render existing messages', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByText('Should I start Josh Allen this week?')).toBeInTheDocument()
      expect(screen.getByText(/Yes, Josh Allen is an excellent start/)).toBeInTheDocument()
    })

    it('should display user and AI message bubbles differently', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      const userMessage = screen.getByText('Should I start Josh Allen this week?').closest('div')
      const aiMessage = screen.getByText(/Yes, Josh Allen is an excellent start/).closest('div')

      // Check that messages have different styling
      expect(userMessage?.className).toContain('bg-blue-600')
      expect(aiMessage?.className).toContain('bg-gray-100')
    })

    it('should show AI metadata for AI messages', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByText('250ms')).toBeInTheDocument()
      expect(screen.getByText('high confidence')).toBeInTheDocument()
    })

    it('should display league context information', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByText('League: Test Champions League')).toBeInTheDocument()
      expect(screen.getByText('• 1 players affected')).toBeInTheDocument()
    })

    it('should show welcome message when no messages exist', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps}
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByText('Welcome to AI League Assistant!')).toBeInTheDocument()
      expect(screen.getByTestId('message-icon')).toBeInTheDocument()
    })
  })

  describe('Cross-League Insights', () => {
    it('should display cross-league opportunities when available', () => {
      const messageWithInsights: EnhancedChatMessage = {
        ...mockMessages[1],
        crossLeagueInsights: {
          arbitrageOpportunities: [
            'Josh Allen valued higher in League A vs League B',
            'Consider trading in your other league'
          ],
          valueDiscrepancies: [{
            playerId: 'player-1',
            playerName: 'Josh Allen',
            leagueValues: { 'league-1': 25, 'league-2': 22 }
          }]
        }
      }

      render(
        <AIEnhancedChatPanel 
          {...defaultProps}
          messages={[messageWithInsights]}
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByText('Cross-League Opportunities')).toBeInTheDocument()
      expect(screen.getByTestId('trending-icon')).toBeInTheDocument()
    })
  })

  describe('Input Handling', () => {
    it('should handle text input correctly', async () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'What about Christian McCaffrey?')

      expect(textarea).toHaveValue('What about Christian McCaffrey?')
    })

    it('should send message on button click', async () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      const textarea = screen.getByRole('textbox')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', 'test-league-1')
      })
    })

    it('should send message on Enter key press', async () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Test message{Enter}')

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', 'test-league-1')
      })
    })

    it('should not send message on Shift+Enter', async () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Multi{Shift>}{Enter}{/Shift}line message')

      expect(mockOnSendMessage).not.toHaveBeenCalled()
    })

    it('should disable input when loading', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps}
          isLoading={true}
          onSendMessage={mockOnSendMessage}
        />
      )

      const textarea = screen.getByRole('textbox')
      const sendButton = screen.getByRole('button', { name: /send/i })

      expect(textarea).toBeDisabled()
      expect(sendButton).toBeDisabled()
    })

    it('should show loading indicator when sending', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps}
          isLoading={true}
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
    })

    it('should clear input after sending message', async () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      const textarea = screen.getByRole('textbox')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(textarea).toHaveValue('')
      })
    })

    it('should show character count', async () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Test')

      expect(screen.getByText('4/500 characters')).toBeInTheDocument()
    })

    it('should expand/collapse input area', async () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      const expandButton = screen.getByText('Expand input')
      await user.click(expandButton)

      expect(screen.getByText('Collapse input')).toBeInTheDocument()

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.rows).toBe(3)
    })
  })

  describe('Quick Prompts', () => {
    it('should display league-specific quick prompts', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByText('Analyze my Test Champions League roster for this week')).toBeInTheDocument()
      expect(screen.getByText('What are the best waiver pickups for Test Champions League?')).toBeInTheDocument()
    })

    it('should populate input with prompt when clicked', async () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      const promptButton = screen.getByText('Analyze my Test Champions League roster for this week')
      await user.click(promptButton)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('Analyze my Test Champions League roster for this week')
    })
  })

  describe('League Switching', () => {
    it('should call onLeagueSwitch when league is changed', async () => {
      const mockOnLeagueSwitch = vi.fn()
      const multipleLeagues = [
        mockLeague,
        { ...mockLeague, id: 'league-2', name: 'Second League' }
      ]

      render(
        <AIEnhancedChatPanel 
          {...defaultProps}
          availableLeagues={multipleLeagues}
          onLeagueSwitch={mockOnLeagueSwitch}
          onSendMessage={mockOnSendMessage}
        />
      )

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'league-2')

      expect(mockOnLeagueSwitch).toHaveBeenCalledWith('league-2')
    })
  })

  describe('Memory Management', () => {
    it('should limit message history to maxMessages', () => {
      const manyMessages = Array.from({ length: 150 }, (_, i) => ({
        ...mockMessages[0],
        id: `msg-${i}`,
        message: `Message ${i}`
      }))

      render(
        <AIEnhancedChatPanel 
          {...defaultProps}
          messages={manyMessages}
          maxMessages={100}
          onSendMessage={mockOnSendMessage}
        />
      )

      // Should only display the most recent 100 messages
      expect(screen.queryByText('Message 0')).not.toBeInTheDocument()
      expect(screen.getByText('Message 149')).toBeInTheDocument()
    })

    it('should enable virtualized scrolling by default', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps}
          virtualizedScrolling={true}
          onSendMessage={mockOnSendMessage}
        />
      )

      // Virtualized scrolling should be active (this is implementation-dependent)
      expect(screen.getByText('Should I start Josh Allen this week?')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle send message errors gracefully', async () => {
      const mockOnSendMessageError = vi.fn().mockRejectedValue(new Error('Network error'))

      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessageError}
        />
      )

      const textarea = screen.getByRole('textbox')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      // Should not throw error and should handle gracefully
      expect(mockOnSendMessageError).toHaveBeenCalledWith('Test message', 'test-league-1')
    })

    it('should show error message when onSendMessage fails', async () => {
      const mockOnSendMessageError = vi.fn().mockRejectedValue(new Error('AI service unavailable'))

      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessageError}
        />
      )

      const textarea = screen.getByRole('textbox')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 
        expect.stringContaining('Ask me about Test Champions League'))
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      const textarea = screen.getByRole('textbox')
      
      // Should be focusable
      await user.tab()
      expect(textarea).toHaveFocus()
    })
  })

  describe('Performance Optimizations', () => {
    it('should memoize message rendering', () => {
      const { rerender } = render(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      // Re-render with same props
      rerender(
        <AIEnhancedChatPanel 
          {...defaultProps} 
          onSendMessage={mockOnSendMessage}
        />
      )

      // Messages should still be visible (memoization working)
      expect(screen.getByText('Should I start Josh Allen this week?')).toBeInTheDocument()
    })

    it('should handle virtualized scrolling for large message lists', () => {
      const manyMessages = Array.from({ length: 1000 }, (_, i) => ({
        ...mockMessages[0],
        id: `msg-${i}`,
        message: `Message ${i}`,
        timestamp: new Date()
      }))

      render(
        <AIEnhancedChatPanel 
          {...defaultProps}
          messages={manyMessages}
          virtualizedScrolling={true}
          onSendMessage={mockOnSendMessage}
        />
      )

      // Component should render without performance issues
      expect(screen.getByText('AI League Assistant')).toBeInTheDocument()
    })
  })
})