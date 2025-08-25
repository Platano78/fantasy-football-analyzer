import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Brain, TrendingUp, Target, Shield, Zap, Send, RotateCcw, Download, Sparkles, Bot, User, Copy, ThumbsUp, ThumbsDown, AlertTriangle, Calendar, Activity, BarChart3, Timer, Trophy, Clock, Search } from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { useDraftData } from '@/hooks';
import { Player, Position, ScoringSystem, DraftStrategy, InjuryStatus } from '@/types';

// Simplified chat message interface for performance
interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'alert';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

// Simplified types for performance
type SeasonPhase = 'draft' | 'early' | 'mid' | 'late' | 'playoff';

interface UserPreferences {
  draftStrategy: DraftStrategy[];
  riskTolerance: 'conservative' | 'balanced' | 'aggressive';
  positionPriorities: Position[];
  targetTypes: ('sleeper' | 'safe' | 'upside' | 'handcuff')[];
  tradingActivity: 'never' | 'rare' | 'active' | 'frequent';
}

// Enhanced AI prompts for comprehensive analysis
const AI_PROMPTS = {
  // Draft-focused prompts
  tierAnalysis: 'Analyze current position tiers and provide tier-based draft strategy recommendations',
  pprSpecialists: 'Identify top PPR specialists available and explain why they excel in PPR formats',
  scarcityAlert: 'Alert me to position scarcity issues and when I should prioritize each position',
  strategyPlan: 'Create a complete draft strategy plan based on my current roster and upcoming picks',
  riskAssessment: 'Assess injury risks and upside potential for players in my target range',
  valueTargets: 'Find the best value targets available based on ADP vs projected performance',
  rookieAnalysis: 'Analyze rookie prospects and their fantasy impact potential',
  lateRoundGems: 'Identify late-round sleepers with breakout potential',
  
  // Season management prompts
  weeklyOptimization: 'Optimize my lineup for this week with start/sit recommendations and reasoning',
  tradeAnalyzer: 'Analyze potential trades with fair value calculations and risk assessments',
  waiverStrategy: 'Identify top waiver wire targets and drop candidates for this week',
  playoffPlanning: 'Create a playoff preparation strategy focusing on schedule and matchups',
  injuryContingency: 'Develop contingency plans for key player injuries on my roster',
  
  // Advanced analytics
  multiWeekPlanning: 'Create a 3-week planning strategy with roster moves and matchup preparation',
  positionScarcityMonitor: 'Monitor position scarcity across the league and alert on opportunities',
  valueTrendAnalysis: 'Analyze player value trends and identify buy-low/sell-high opportunities',
  seasonPhasePlanning: 'Adapt my strategy based on current season phase and league dynamics',
  customScoringOptimization: 'Optimize recommendations for our specific league scoring system'
};

// Memoized message component with enhanced analysis display
const ChatMessageComponent = memo(({ 
  message,
  onCopy,
  onLike,
  onDislike,
  onDismissAlert
}: {
  message: ChatMessage;
  onCopy: (content: string) => void;
  onLike: (messageId: string) => void;
  onDislike: (messageId: string) => void;
  onDismissAlert?: (messageId: string) => void;
}) => {
  const isAI = message.type === 'ai';
  const isAlert = message.type === 'alert';
  const priorityColors = {
    low: 'bg-blue-50 border-blue-200',
    medium: 'bg-yellow-50 border-yellow-200', 
    high: 'bg-orange-50 border-orange-200',
    urgent: 'bg-red-50 border-red-200'
  };

  return (
    <div className={`flex gap-3 mb-4 ${
      isAlert ? 'flex-col' : (isAI ? 'flex-row' : 'flex-row-reverse')
    }`}>
      {/* Alert header */}
      {isAlert && (
        <div className={`p-3 rounded-lg border ${message.priority ? priorityColors[message.priority] : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${
                message.priority === 'urgent' ? 'text-red-500' :
                message.priority === 'high' ? 'text-orange-500' :
                message.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
              }`} />
              <span className="font-medium text-gray-900">
                {message.category?.toUpperCase() || 'ALERT'}
              </span>
            </div>
            {onDismissAlert && (
              <button
                onClick={() => onDismissAlert(message.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700">{message.content}</p>
        </div>
      )}
      
      {!isAlert && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isAI ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          {isAI ? <Bot className="w-5 h-5 text-blue-600" /> : <User className="w-5 h-5 text-gray-600" />}
        </div>
      )}
      
      <div className={`flex-1 max-w-[80%] ${isAI ? 'mr-12' : 'ml-12'}`}>
        <div className={`p-4 rounded-lg ${
          isAI ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'
        }`}>
          <div className="text-sm text-gray-900 whitespace-pre-wrap">
            {message.isTyping ? (
              <div className="flex items-center gap-1">
                <span>Analyzing...</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : (
              message.content
            )}
          </div>

          {/* Complex analysis section removed for performance */}

          {/* Message actions */}
          {isAI && !message.isTyping && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-blue-200">
              <button
                onClick={() => onCopy(message.content)}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Copy message"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => onLike(message.id)}
                className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                title="Like response"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDislike(message.id)}
                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                title="Dislike response"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
});

ChatMessageComponent.displayName = 'ChatMessageComponent';

// Enhanced quick action buttons with season-aware features
const QuickActions = memo(({ 
  onPromptSelect,
  isLoading,
  seasonPhase
}: {
  onPromptSelect: (prompt: string) => void;
  isLoading: boolean;
  seasonPhase: SeasonPhase;
}) => {
  const getPhaseActions = (phase: SeasonPhase) => {
    switch (phase) {
      case 'draft':
        return [
          { key: 'tierAnalysis', label: 'Tier Analysis', icon: TrendingUp, color: 'blue' },
          { key: 'scarcityAlert', label: 'Scarcity Alert', icon: Shield, color: 'orange' },
          { key: 'strategyPlan', label: 'Strategy Plan', icon: Zap, color: 'purple' },
          { key: 'valueTargets', label: 'Value Targets', icon: Target, color: 'green' }
        ];
      case 'early':
        return [
          { key: 'weeklyOptimization', label: 'Weekly Lineup', icon: Calendar, color: 'blue' },
          { key: 'waiverStrategy', label: 'Waiver Wire', icon: Search, color: 'green' },
          { key: 'tradeAnalyzer', label: 'Trade Analysis', icon: BarChart3, color: 'purple' },
          { key: 'injuryContingency', label: 'Injury Plans', icon: Activity, color: 'red' }
        ];
      case 'mid':
        return [
          { key: 'tradeAnalyzer', label: 'Trade Analyzer', icon: BarChart3, color: 'purple' },
          { key: 'valueTrendAnalysis', label: 'Value Trends', icon: TrendingUp, color: 'blue' },
          { key: 'multiWeekPlanning', label: 'Multi-Week Plan', icon: Calendar, color: 'green' },
          { key: 'positionScarcityMonitor', label: 'Scarcity Monitor', icon: Shield, color: 'orange' }
        ];
      case 'late':
      case 'playoff':
        return [
          { key: 'playoffPlanning', label: 'Playoff Prep', icon: Trophy, color: 'gold' },
          { key: 'weeklyOptimization', label: 'Lineup Optimizer', icon: Target, color: 'blue' },
          { key: 'injuryContingency', label: 'Injury Backup', icon: Activity, color: 'red' },
          { key: 'multiWeekPlanning', label: 'Schedule Analysis', icon: Calendar, color: 'green' }
        ];
      default:
        return [
          { key: 'tierAnalysis', label: 'Tier Analysis', icon: TrendingUp, color: 'blue' },
          { key: 'strategyPlan', label: 'Strategy Plan', icon: Zap, color: 'purple' },
          { key: 'valueTargets', label: 'Value Targets', icon: Target, color: 'green' },
          { key: 'scarcityAlert', label: 'Scarcity Alert', icon: Shield, color: 'orange' }
        ];
    }
  };

  const actions = getPhaseActions(seasonPhase);

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <button
            key={action.key}
            onClick={() => onPromptSelect(AI_PROMPTS[action.key as keyof typeof AI_PROMPTS])}
            disabled={isLoading}
            className={`p-3 text-left bg-${action.color}-50 hover:bg-${action.color}-100 rounded-lg transition-colors border border-${action.color}-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Icon className="w-4 h-4 mb-1" />
            <div className="font-medium">{action.label}</div>
          </button>
        );
      })}
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

// AI context summary component
const ContextSummary = memo(({ 
  availablePlayers,
  draftedPlayers,
  currentRound,
  scoringSystem,
  userTeamNeeds
}: {
  availablePlayers: Player[];
  draftedPlayers: Set<number>;
  currentRound: number;
  scoringSystem: ScoringSystem;
  userTeamNeeds: Position[];
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Current Context
      </h4>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Round:</span>
          <span className="font-medium ml-1">{currentRound}</span>
        </div>
        <div>
          <span className="text-gray-600">Scoring:</span>
          <span className="font-medium ml-1">{scoringSystem.toUpperCase()}</span>
        </div>
        <div>
          <span className="text-gray-600">Available:</span>
          <span className="font-medium ml-1">{availablePlayers.length} players</span>
        </div>
        <div>
          <span className="text-gray-600">Drafted:</span>
          <span className="font-medium ml-1">{draftedPlayers.size} players</span>
        </div>
      </div>
      
      {userTeamNeeds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-gray-600 text-sm">Team needs:</span>
          <div className="flex gap-1 mt-1">
            {userTeamNeeds.map(position => (
              <span key={position} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {position}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ContextSummary.displayName = 'ContextSummary';

// Removed complex components for performance

// Main AIView component with enhanced features
export default function AIView() {
  const { state } = useFantasyFootball();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({ 
    draftStrategy: ['balanced'], 
    riskTolerance: 'balanced', 
    positionPriorities: ['RB', 'WR', 'QB', 'TE', 'DEF', 'K'], 
    targetTypes: ['safe'], 
    tradingActivity: 'active' 
  });
  const [seasonPhase, setSeasonPhase] = useState<SeasonPhase>('draft');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { availablePlayers, currentRound } = useDraftData();

  // Initialize with enhanced welcome message and proactive systems
  useEffect(() => {
    const currentWeek = 1; // This would come from a real API
    const isDraftComplete = state.draftedPlayers.size >= state.draftSettings.totalTeams * state.draftSettings.rounds;
    const phase = isDraftComplete ? 'early' : 'draft';
    setSeasonPhase(phase);

    // Removed initial proactive alerts for performance

    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'ai',
      content: `🧠 **AI Fantasy Assistant (Performance Optimized)**\n\n**Season Phase:** ${phase.charAt(0).toUpperCase() + phase.slice(1)}\n**League:** ${state.draftSettings.leagueName}\n**Scoring:** ${state.scoringSystem.toUpperCase()}\n\n**Available Features:**\n• Basic AI responses and recommendations\n• Chat interface for questions\n• Quick action buttons for common queries\n\n**Current Focus:** ${phase === 'draft' ? 'Draft assistance' : 'Season management'}\n\nAsk me anything about fantasy football!`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [state.draftSettings, state.scoringSystem, state.draftedPlayers.size]);

  // Determine user team needs based on drafted players
  const userTeamNeeds = useMemo(() => {
    const neededPositions: Position[] = [];
    const positionCounts = Array.from(state.draftedPlayers).reduce((counts, playerId) => {
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        counts[player.position] = (counts[player.position] || 0) + 1;
      }
      return counts;
    }, {} as Record<Position, number>);

    // Standard roster requirements
    const requirements: Record<Position, number> = { QB: 1, RB: 2, WR: 2, TE: 1, DEF: 1, K: 1 };
    
    Object.entries(requirements).forEach(([pos, needed]) => {
      const current = positionCounts[pos as Position] || 0;
      if (current < needed) {
        for (let i = 0; i < needed - current; i++) {
          neededPositions.push(pos as Position);
        }
      }
    });

    return neededPositions;
  }, [state.draftedPlayers, state.players]);

  // Removed proactive alert generation system for performance

  // User preference analysis
  useEffect(() => {
    if (state.draftHistory.length >= 3) {
      const preferences = {
        draftStrategy: ['balanced'] as DraftStrategy[],
        riskTolerance: 'balanced' as const,
        positionPriorities: ['RB', 'WR', 'QB', 'TE', 'DEF', 'K'] as Position[],
        targetTypes: ['safe', 'upside'] as ('sleeper' | 'safe' | 'upside' | 'handcuff')[],
        tradingActivity: 'active' as const
      };
      
      // Analyze draft patterns
      const earlyPicks = state.draftHistory.slice(0, 6);
      const rbCount = earlyPicks.filter(pick => {
        const player = state.players.find(p => p.id === pick.playerId);
        return player?.position === 'RB';
      }).length;
      
      if (rbCount >= 3) {
        preferences.draftStrategy = ['rb_zero'];
      }
      
      setUserPreferences(preferences);
    }
  }, [state.draftHistory, state.players]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simplified AI response generation for performance
  const generateAIResponse = useCallback(async (userMessage: string): Promise<ChatMessage> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: 'AI response optimized for performance - complex analysis temporarily disabled',
      timestamp: new Date()
    };
  }, []);

  // Handle sending messages
  const handleSendMessage = useCallback(async (messageContent: string = input) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prev => [...prev, typingMessage]);

    try {
      const aiResponse = await generateAIResponse(messageContent);
      setMessages(prev => [...prev.slice(0, -1), aiResponse]); // Replace typing indicator
    } catch (error) {
      setMessages(prev => [...prev.slice(0, -1), {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, generateAIResponse]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const clearChat = useCallback(() => {
    setMessages(messages.slice(0, 1)); // Keep welcome message
  }, [messages]);

  const exportChat = useCallback(() => {
    const chatText = messages.map(msg => 
      `${msg.type.toUpperCase()} (${msg.timestamp.toLocaleString()}): ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  const likeMessage = useCallback((messageId: string) => {
    // In a real app, this would send feedback to improve AI responses
    console.log('Liked message:', messageId);
  }, []);

  const dislikeMessage = useCallback((messageId: string) => {
    // In a real app, this would send feedback to improve AI responses
    console.log('Disliked message:', messageId);
  }, []);

  // Removed dismissAlert for performance

  // Removed alert message handler for performance

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Enhanced AI Assistant
          </h3>
          <div className="flex gap-2">
            <button
              onClick={clearChat}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Chat
            </button>
            <button
              onClick={exportChat}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Export Chat
            </button>
          </div>
        </div>

        <ContextSummary
          availablePlayers={availablePlayers}
          draftedPlayers={state.draftedPlayers}
          currentRound={currentRound}
          scoringSystem={state.scoringSystem}
          userTeamNeeds={userTeamNeeds}
        />

        <QuickActions
          onPromptSelect={handleSendMessage}
          isLoading={isLoading}
          seasonPhase={seasonPhase}
        />

        {/* Proactive Alerts Display - Removed for performance */}
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 border-b border-gray-200">
          {messages.map(message => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              onCopy={copyMessage}
              onLike={likeMessage}
              onDislike={dislikeMessage}
              onDismissAlert={undefined}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask for advanced draft analysis, strategy recommendations, or player insights..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}