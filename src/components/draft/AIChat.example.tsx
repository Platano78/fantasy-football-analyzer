import React, { useState, useCallback } from 'react';
import { AIChat, ChatMessage, DraftContext } from './AIChat';
import { ScoringSystem } from '../../types';

// Example integration of the AIChat component
export const AIChatExample: React.FC = () => {
  // Mock data for demonstration
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI Draft Assistant. I'm ready to help you dominate your fantasy draft with advanced analytics and personalized recommendations.",
      timestamp: new Date(Date.now() - 60000),
      metadata: {
        confidence: 'high'
      }
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock draft context
  const mockDraftContext: DraftContext = {
    players: [], // Would be populated with real player data
    draftHistory: [],
    currentRound: 3,
    currentPick: 7,
    userTeam: {
      id: 6,
      name: 'Your Team',
      owner: 'You',
      strategy: 'value_based',
      tendencies: ['takes_best_available'],
      rosterNeeds: { QB: 1, RB: 2, WR: 2, TE: 1, DEF: 1, K: 1 }
    },
    scoringSystem: 'ppr' as ScoringSystem,
    draftSettings: {
      position: 6,
      totalTeams: 12,
      rounds: 17,
      leagueName: "Example League",
      draftTime: "Sunday, Aug 24, 2025 9:00pm EDT",
      timePerPick: 60
    },
    availablePlayers: [],
    userRoster: [],
    positionNeeds: { QB: 1, RB: 2, WR: 2, TE: 1, DEF: 1, K: 1 }
  };

  const handleSendMessage = useCallback(async (message: string) => {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock AI response based on the message
    let aiResponse: ChatMessage;

    if (message.toLowerCase().includes('tier') || message.toLowerCase().includes('analyze')) {
      aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Based on your current draft position and PPR scoring, here's my tier analysis:",
        timestamp: new Date(),
        analysis: {
          playerRecommendations: [
            {
              id: 1,
              name: 'Cooper Kupp',
              position: 'WR',
              team: 'LAR',
              adp: 2.1,
              ppr: 21.4,
              standard: 14.7,
              halfPpr: 18.1,
              injury: 'Healthy',
              news: 'Elite PPR target with 120+ catch upside',
              tier: 1
            },
            {
              id: 2,
              name: 'Amon-Ra St. Brown',
              position: 'WR',
              team: 'DET',
              adp: 3.4,
              ppr: 20.1,
              standard: 13.8,
              halfPpr: 17.0,
              injury: 'Healthy',
              news: 'Lions high-volume passing offense',
              tier: 1
            }
          ],
          strategyPoints: [
            'WR is a position of strength in this round range',
            'Consider grabbing elite WR1 upside while available',
            'RB scarcity increases after round 4'
          ],
          tierBreakdown: [
            {
              tier: 1,
              players: [
                {
                  id: 1,
                  name: 'Cooper Kupp',
                  position: 'WR',
                  team: 'LAR',
                  adp: 2.1,
                  ppr: 21.4,
                  standard: 14.7,
                  halfPpr: 18.1,
                  injury: 'Healthy',
                  news: 'Elite PPR target',
                  tier: 1
                }
              ],
              recommendation: 'Elite WR1s with 300+ target upside and proven track records'
            }
          ]
        },
        metadata: {
          confidence: 'high',
          processingTime: 1200,
          contextUsed: ['draft_position', 'scoring_system', 'available_players']
        }
      };
    } else if (message.toLowerCase().includes('ppr') || message.toLowerCase().includes('specialist')) {
      aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Here are the top PPR specialists still available based on target share and reception volume:",
        timestamp: new Date(),
        analysis: {
          playerRecommendations: [
            {
              id: 3,
              name: 'Christian McCaffrey',
              position: 'RB',
              team: 'SF',
              adp: 1.1,
              ppr: 25.8,
              standard: 20.3,
              halfPpr: 23.1,
              injury: 'Healthy',
              news: 'Ultimate PPR back with 80+ reception upside',
              tier: 1
            }
          ],
          strategyPoints: [
            'PPR specialists get 3-5 point bonus over standard scoring',
            'Target volume more predictable than touchdown production',
            'Slot receivers and pass-catching RBs have highest floors'
          ]
        },
        metadata: {
          confidence: 'high'
        }
      };
    } else {
      // Generic helpful response
      aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I understand you're asking about "${message}". Let me analyze your current draft situation and provide targeted recommendations.`,
        timestamp: new Date(),
        analysis: {
          strategyPoints: [
            'At pick 3.07, you\'re in a prime position for value',
            'Consider your roster construction and positional needs',
            'Balance between best player available and team building'
          ],
          scarcityAlerts: [
            {
              position: 'RB',
              severity: 'medium',
              message: 'RB depth thins out significantly after round 4. Consider grabbing RB2 upside soon.'
            }
          ]
        },
        metadata: {
          confidence: 'medium'
        }
      };
    }

    setMessages(prev => [...prev, aiResponse]);
    setIsLoading(false);
  }, []);

  const handlePromptSelect = useCallback((prompt: string) => {
    setInput(prompt);
    // Auto-send the prompt
    handleSendMessage(prompt);
  }, [handleSendMessage]);

  const handleMessageAction = useCallback((messageId: string, action: 'copy' | 'like' | 'dislike') => {
    console.log(`Message ${messageId} action: ${action}`);
    // Implement message action handling here
    if (action === 'copy') {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        navigator.clipboard.writeText(message.content);
      }
    }
  }, [messages]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Chat Component Demo</h1>
        <p className="text-gray-600">
          This demonstrates the standalone AIChat component with all features including
          contextual recommendations, quick prompts, and rich message formatting.
        </p>
      </div>

      <div className="border rounded-lg" style={{ height: '700px' }}>
        <AIChat
          messages={messages}
          input={input}
          draftContext={mockDraftContext}
          onSendMessage={handleSendMessage}
          onInputChange={setInput}
          onPromptSelect={handlePromptSelect}
          isLoading={isLoading}
          isConnected={true}
          enableTypingIndicator={true}
          enableMessageActions={true}
          onMessageAction={handleMessageAction}
        />
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <h3 className="font-medium mb-2">Features Demonstrated:</h3>
        <ul className="space-y-1">
          <li>• Message history with user/AI message bubbles</li>
          <li>• Rich analysis results with player recommendations</li>
          <li>• Pre-defined quick action prompts organized by category</li>
          <li>• Typing indicators and loading states</li>
          <li>• Message actions (copy, like, dislike)</li>
          <li>• Draft context integration and awareness</li>
          <li>• Responsive design with collapsible sections</li>
          <li>• Auto-scrolling and proper message formatting</li>
        </ul>
      </div>
    </div>
  );
};

export default AIChatExample;