import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Send, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  User, 
  Bot, 
  Clock, 
  TrendingUp, 
  Target, 
  Shield, 
  Zap,
  AlertTriangle,
  Star,
  Loader,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Import types from the existing codebase
import { Player, Position, ScoringSystem, Team, DraftSettings, DraftPick } from '../../types';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  analysis?: {
    playerRecommendations?: Player[];
    strategyPoints?: string[];
    riskFactors?: string[];
    scarcityAlerts?: Array<{
      position: Position;
      severity: 'low' | 'medium' | 'high';
      message: string;
    }>;
    tierBreakdown?: Array<{
      tier: number;
      players: Player[];
      recommendation: string;
    }>;
  };
  metadata?: {
    confidence?: 'low' | 'medium' | 'high';
    processingTime?: number;
    contextUsed?: string[];
  };
}

export interface DraftContext {
  players: Player[];
  draftHistory: DraftPick[];
  currentRound: number;
  currentPick: number;
  userTeam: Team;
  scoringSystem: ScoringSystem;
  draftSettings: DraftSettings;
  availablePlayers: Player[];
  userRoster: Player[];
  positionNeeds: Record<Position, number>;
}

export interface AIChatProps {
  messages: ChatMessage[];
  input: string;
  draftContext: DraftContext;
  onSendMessage: (message: string) => void;
  onInputChange: (input: string) => void;
  onPromptSelect: (prompt: string) => void;
  isLoading?: boolean;
  isConnected?: boolean;
  maxHeight?: string;
  enableTypingIndicator?: boolean;
  enableMessageActions?: boolean;
  onMessageAction?: (messageId: string, action: 'copy' | 'like' | 'dislike') => void;
}

// Pre-defined AI prompts for quick access
const AI_PROMPTS = [
  {
    id: 'tier-analysis',
    text: 'Analyze current position tiers',
    icon: TrendingUp,
    description: 'Get tier breakdowns for all positions with value analysis',
    category: 'analysis'
  },
  {
    id: 'ppr-specialists',
    text: 'Identify top PPR specialists',
    icon: Target,
    description: 'Find players with highest PPR upside and reception volume',
    category: 'player-evaluation'
  },
  {
    id: 'scarcity-alerts',
    text: 'Alert me to position scarcity issues',
    icon: Shield,
    description: 'Identify positions running thin and draft timing recommendations',
    category: 'strategy'
  },
  {
    id: 'draft-strategy',
    text: 'Create complete draft strategy plan',
    icon: Zap,
    description: 'Comprehensive strategy based on your draft position and scoring',
    category: 'strategy'
  },
  {
    id: 'injury-analysis',
    text: 'Assess injury risks and upside potential',
    icon: AlertTriangle,
    description: 'Analyze injury histories and identify safe vs. risky picks',
    category: 'risk-assessment'
  },
  {
    id: 'value-targets',
    text: 'Find best value targets available',
    icon: Star,
    description: 'Players falling below ADP with strong upside potential',
    category: 'value'
  },
  {
    id: 'rookie-analysis',
    text: 'Analyze rookie prospects',
    icon: TrendingUp,
    description: 'Rookie evaluation with ceiling and floor projections',
    category: 'player-evaluation'
  },
  {
    id: 'sleepers',
    text: 'Identify late-round sleepers',
    icon: Target,
    description: 'Hidden gems for late rounds with breakout potential',
    category: 'value'
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return timestamp.toLocaleDateString();
};

const generateContextSummary = (context: DraftContext): string => {
  const { currentRound, currentPick, scoringSystem, positionNeeds } = context;
  const needsList = Object.entries(positionNeeds)
    .filter(([_, count]) => count > 0)
    .map(([pos, count]) => `${pos}(${count})`)
    .join(', ');
    
  return `Round ${currentRound}, Pick ${currentPick} | ${scoringSystem.toUpperCase()} | Needs: ${needsList || 'Flex depth'}`;
};

// ============================================================================
// COMPONENTS
// ============================================================================

const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1 p-3">
    <Bot className="w-4 h-4 text-blue-500" />
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
    <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
  </div>
);

const MessageActions: React.FC<{
  messageId: string;
  onAction: (messageId: string, action: 'copy' | 'like' | 'dislike') => void;
}> = ({ messageId, onAction }) => (
  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      onClick={() => onAction(messageId, 'copy')}
      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
      title="Copy message"
    >
      <Copy className="w-3 h-3" />
    </button>
    <button
      onClick={() => onAction(messageId, 'like')}
      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-green-600"
      title="Helpful"
    >
      <ThumbsUp className="w-3 h-3" />
    </button>
    <button
      onClick={() => onAction(messageId, 'dislike')}
      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600"
      title="Not helpful"
    >
      <ThumbsDown className="w-3 h-3" />
    </button>
  </div>
);

const PlayerRecommendationCard: React.FC<{
  player: Player;
  scoringSystem: ScoringSystem;
  reasoning?: string;
}> = ({ player, scoringSystem, reasoning }) => {
  const score = player[scoringSystem] || player.ppr;
  const tierColor = player.tier <= 1 ? 'bg-green-100 text-green-800' : 
                   player.tier <= 2 ? 'bg-blue-100 text-blue-800' : 
                   'bg-yellow-100 text-yellow-800';

  return (
    <div className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{player.name}</h4>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{player.position} - {player.team}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${tierColor}`}>
              Tier {player.tier}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">{score.toFixed(1)}</div>
          <div className="text-xs text-gray-500">ADP: {player.adp.toFixed(1)}</div>
        </div>
      </div>
      {reasoning && (
        <div className="text-sm text-gray-600 italic border-t pt-2">
          {reasoning}
        </div>
      )}
    </div>
  );
};

const AnalysisSection: React.FC<{
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  isCollapsible?: boolean;
}> = ({ title, icon: Icon, children, isCollapsible = true }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4">
      <div
        className={`flex items-center justify-between mb-2 ${
          isCollapsible ? 'cursor-pointer' : ''
        }`}
        onClick={() => isCollapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-gray-800">{title}</h4>
        </div>
        {isCollapsible && (
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      {isExpanded && <div className="pl-6">{children}</div>}
    </div>
  );
};

const MessageBubble: React.FC<{
  message: ChatMessage;
  draftContext: DraftContext;
  enableActions?: boolean;
  onAction?: (messageId: string, action: 'copy' | 'like' | 'dislike') => void;
}> = ({ message, draftContext, enableActions, onAction }) => {
  const isUser = message.type === 'user';
  const { analysis } = message;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-500' : 'bg-gray-600'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`rounded-2xl px-4 py-2 max-w-full ${
              isUser
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
            
            {/* Metadata for AI messages */}
            {!isUser && message.metadata && (
              <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(message.timestamp)}</span>
                {message.metadata.confidence && (
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    message.metadata.confidence === 'high' ? 'bg-green-100 text-green-700' :
                    message.metadata.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {message.metadata.confidence}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysis && !isUser && (
            <div className="mt-3 bg-white border rounded-lg p-4 shadow-sm w-full max-w-lg">
              {/* Player Recommendations */}
              {analysis.playerRecommendations && analysis.playerRecommendations.length > 0 && (
                <AnalysisSection title="Recommended Players" icon={Star}>
                  <div className="space-y-2">
                    {analysis.playerRecommendations.slice(0, 3).map((player, index) => (
                      <PlayerRecommendationCard
                        key={player.id}
                        player={player}
                        scoringSystem={draftContext.scoringSystem}
                        reasoning={`Top ${index + 1} pick based on current context and value`}
                      />
                    ))}
                  </div>
                </AnalysisSection>
              )}

              {/* Strategy Points */}
              {analysis.strategyPoints && analysis.strategyPoints.length > 0 && (
                <AnalysisSection title="Strategy Points" icon={Zap}>
                  <ul className="space-y-1">
                    {analysis.strategyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </AnalysisSection>
              )}

              {/* Scarcity Alerts */}
              {analysis.scarcityAlerts && analysis.scarcityAlerts.length > 0 && (
                <AnalysisSection title="Position Scarcity Alerts" icon={AlertTriangle}>
                  <div className="space-y-2">
                    {analysis.scarcityAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded border-l-4 ${
                          alert.severity === 'high' ? 'border-red-500 bg-red-50' :
                          alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                          'border-blue-500 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{alert.position}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </AnalysisSection>
              )}

              {/* Risk Factors */}
              {analysis.riskFactors && analysis.riskFactors.length > 0 && (
                <AnalysisSection title="Risk Factors" icon={Shield}>
                  <ul className="space-y-1">
                    {analysis.riskFactors.map((risk, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <AlertTriangle className="w-3 h-3 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </AnalysisSection>
              )}

              {/* Tier Breakdown */}
              {analysis.tierBreakdown && analysis.tierBreakdown.length > 0 && (
                <AnalysisSection title="Tier Analysis" icon={TrendingUp}>
                  <div className="space-y-3">
                    {analysis.tierBreakdown.map((tier, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">Tier {tier.tier}</h5>
                          <span className="text-sm text-gray-500">
                            {tier.players.length} players
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{tier.recommendation}</p>
                        <div className="flex flex-wrap gap-1">
                          {tier.players.slice(0, 5).map((player) => (
                            <span
                              key={player.id}
                              className="px-2 py-1 bg-gray-100 rounded text-xs"
                            >
                              {player.name}
                            </span>
                          ))}
                          {tier.players.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                              +{tier.players.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AnalysisSection>
              )}
            </div>
          )}

          {/* Message Actions */}
          {enableActions && onAction && !isUser && (
            <div className="mt-1">
              <MessageActions messageId={message.id} onAction={onAction} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickPrompts: React.FC<{
  prompts: typeof AI_PROMPTS;
  onPromptSelect: (prompt: string) => void;
  isLoading?: boolean;
}> = ({ prompts, onPromptSelect, isLoading }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = useMemo(() => {
    const cats = Array.from(new Set(prompts.map(p => p.category)));
    return ['all', ...cats];
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    return selectedCategory === 'all' 
      ? prompts 
      : prompts.filter(p => p.category === selectedCategory);
  }, [prompts, selectedCategory]);

  return (
    <div className="mb-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 text-sm rounded-full transition-colors capitalize ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Quick Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filteredPrompts.map((prompt) => {
          const Icon = prompt.icon;
          return (
            <button
              key={prompt.id}
              onClick={() => !isLoading && onPromptSelect(prompt.text)}
              disabled={isLoading}
              className="p-3 text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all border border-blue-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              title={prompt.description}
            >
              <div className="flex items-start space-x-2">
                <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-medium text-gray-900 text-sm leading-tight">
                    {prompt.text}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {prompt.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AIChat: React.FC<AIChatProps> = ({
  messages,
  input,
  draftContext,
  onSendMessage,
  onInputChange,
  onPromptSelect,
  isLoading = false,
  isConnected = true,
  maxHeight = "600px",
  enableTypingIndicator = true,
  enableMessageActions = true,
  onMessageAction
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = useCallback(() => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setShowQuickPrompts(false);
    }
  }, [input, isLoading, onSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handlePromptSelect = useCallback((prompt: string) => {
    onPromptSelect(prompt);
    setShowQuickPrompts(false);
  }, [onPromptSelect]);

  const contextSummary = useMemo(() => {
    return generateContextSummary(draftContext);
  }, [draftContext]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">AI Draft Assistant</h3>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
        <div className="text-xs text-gray-500">
          {contextSummary}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Welcome to your AI Draft Assistant!</p>
            <p className="text-sm text-gray-400">
              I'm here to help you make smart draft decisions. Ask me anything or use the quick prompts below.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              draftContext={draftContext}
              enableActions={enableMessageActions}
              onAction={onMessageAction}
            />
          ))
        )}

        {/* Typing Indicator */}
        {isLoading && enableTypingIndicator && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts (show when no messages or explicitly shown) */}
      {(showQuickPrompts || messages.length === 0) && (
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700">Quick Actions</h4>
            {messages.length > 0 && (
              <button
                onClick={() => setShowQuickPrompts(!showQuickPrompts)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showQuickPrompts ? 'Hide' : 'Show'} Prompts
              </button>
            )}
          </div>
          <QuickPrompts
            prompts={AI_PROMPTS}
            onPromptSelect={handlePromptSelect}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4 bg-white rounded-b-lg">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={inputRef as any}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask for advanced draft analysis..."
              disabled={!isConnected || isLoading}
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              style={{ 
                minHeight: '40px',
                maxHeight: '120px'
              }}
            />
            {!isConnected && (
              <p className="text-xs text-red-500 mt-1">
                AI Assistant is currently offline
              </p>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || !isConnected || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Quick Access Buttons */}
        {!showQuickPrompts && messages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setShowQuickPrompts(true)}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600"
            >
              Show Quick Actions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChat;