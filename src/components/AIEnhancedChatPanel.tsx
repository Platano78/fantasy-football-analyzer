/**
 * Enhanced AI Chat Panel with Performance Optimizations
 * 
 * This component extends the existing AIChat functionality with:
 * - Virtual scrolling for message history (performance optimization)
 * - League-aware context integration
 * - Memory leak prevention
 * - Enhanced AI service integration
 * - Cross-league intelligence
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader, 
  AlertTriangle, 
  Zap,
  MessageSquare,
  Brain,
  TrendingUp,
  Target,
  Shield
} from 'lucide-react';

// Import the existing AIChat as base
import { AIChat, ChatMessage, DraftContext, AIChatProps } from './draft/AIChat';

// Import our enhanced types
import { 
  League, 
  LeagueAIContext, 
  AIRecommendation, 
  AIChatMessage,
  AIEnhancedPlayer 
} from '../types/LeagueTypes';
import { Player, Position } from '../types';

// ============================================================================
// ENHANCED INTERFACES
// ============================================================================

export interface EnhancedChatMessage extends AIChatMessage {
  // Enhanced with league context
  leagueRelevantPlayers?: AIEnhancedPlayer[];
  crossLeagueInsights?: {
    arbitrageOpportunities: string[];
    valueDiscrepancies: Array<{
      playerId: string;
      playerName: string;
      leagueValues: Record<string, number>;
    }>;
  };
  // Performance tracking
  renderTime?: number;
  memoryUsage?: number;
}

export interface AIEnhancedChatProps {
  // Enhanced chat functionality
  messages: EnhancedChatMessage[];
  leagueContext: LeagueAIContext;
  onSendMessage: (message: string, leagueId?: string) => Promise<void>;
  
  // Performance settings
  maxMessages?: number; // Limit message history to prevent memory issues
  virtualizedScrolling?: boolean;
  messageChunkSize?: number;
  
  // AI service configuration
  aiServiceChain: ('claude' | 'gemini' | 'deepseek' | 'offline')[];
  currentAIService: string;
  onAIServiceFallback?: (service: string, error: Error) => void;
  
  // League-specific features
  activeLeagueId: string;
  availableLeagues: League[];
  onLeagueSwitch?: (leagueId: string) => void;
  
  // Advanced features
  enableRecommendations?: boolean;
  enableCrossLeagueAnalysis?: boolean;
  onRecommendationGenerated?: (recommendation: AIRecommendation) => void;
  
  // Component state
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

// ============================================================================
// PERFORMANCE-OPTIMIZED MESSAGE COMPONENTS
// ============================================================================

interface VirtualizedMessageListProps {
  messages: EnhancedChatMessage[];
  maxHeight: number;
  itemHeight: number;
  overscan: number;
  renderMessage: (message: EnhancedChatMessage, index: number) => React.ReactNode;
}

const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = memo(({
  messages,
  maxHeight,
  itemHeight,
  overscan,
  renderMessage
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(maxHeight);
  const containerRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    messages.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleMessages = useMemo(
    () => messages.slice(startIndex, endIndex),
    [messages, startIndex, endIndex]
  );

  const totalHeight = messages.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, []);

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      const isAtBottom = scrollTop >= totalHeight - containerHeight - 100;
      if (isAtBottom) {
        containerRef.current.scrollTop = totalHeight;
      }
    }
  }, [messages.length, totalHeight, containerHeight, scrollTop]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-auto"
      style={{ maxHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleMessages.map((message, index) => 
            renderMessage(message, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
});

// Memoized message bubble with performance optimizations
const EnhancedMessageBubble: React.FC<{
  message: EnhancedChatMessage;
  leagueContext: LeagueAIContext;
  onPlayerSelect?: (playerId: string) => void;
}> = memo(({ message, leagueContext, onPlayerSelect }) => {
  const isUser = message.sender === 'user';
  const activeLeague = leagueContext.activeLeague;

  const handlePlayerClick = useCallback((playerId: string) => {
    onPlayerSelect?.(playerId);
  }, [onPlayerSelect]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-[80%]`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-gray-600'
        }`}>
          {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
        </div>
        
        {/* Message Content */}
        <div className={`rounded-lg px-4 py-2 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-900 border'
        }`}>
          <div className="text-sm">
            {message.message}
          </div>
          
          {/* League Context Display */}
          {!isUser && message.leagueContext && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Target className="w-3 h-3" />
                <span>League: {activeLeague.name}</span>
                {message.leagueContext.relevantPlayers?.length > 0 && (
                  <span>• {message.leagueContext.relevantPlayers.length} players affected</span>
                )}
              </div>
            </div>
          )}
          
          {/* AI Metadata */}
          {!isUser && message.aiMetadata && (
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>
                {message.aiMetadata.confidence && (
                  <span className="capitalize">{message.aiMetadata.confidence} confidence</span>
                )}
              </span>
              {message.aiMetadata.processingTime && (
                <span>{message.aiMetadata.processingTime}ms</span>
              )}
            </div>
          )}
          
          {/* Cross-League Insights */}
          {message.crossLeagueInsights && message.crossLeagueInsights.arbitrageOpportunities.length > 0 && (
            <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
              <div className="flex items-center space-x-1 text-xs font-medium text-yellow-800 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span>Cross-League Opportunities</span>
              </div>
              <div className="text-xs text-yellow-700">
                {message.crossLeagueInsights.arbitrageOpportunities.slice(0, 2).map((opp, idx) => (
                  <div key={idx}>• {opp}</div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs opacity-75 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN ENHANCED CHAT COMPONENT
// ============================================================================

export const AIEnhancedChatPanel: React.FC<AIEnhancedChatProps> = memo(({
  messages = [],
  leagueContext,
  onSendMessage,
  maxMessages = 100, // Limit to prevent memory issues
  virtualizedScrolling = true,
  messageChunkSize = 20,
  aiServiceChain = ['claude', 'gemini', 'deepseek', 'offline'],
  currentAIService,
  onAIServiceFallback,
  activeLeagueId,
  availableLeagues,
  onLeagueSwitch,
  enableRecommendations = true,
  enableCrossLeagueAnalysis = true,
  onRecommendationGenerated,
  isLoading = false,
  error = null,
  className = ''
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [localMessages, setLocalMessages] = useState<EnhancedChatMessage[]>([]);

  // Memory management: limit message history
  const managedMessages = useMemo(() => {
    const allMessages = [...messages, ...localMessages];
    return allMessages.length > maxMessages 
      ? allMessages.slice(-maxMessages) 
      : allMessages;
  }, [messages, localMessages, maxMessages]);

  // AI Service Status Display
  const aiServiceStatus = useMemo(() => {
    const statusColors = {
      claude: 'bg-blue-500',
      gemini: 'bg-green-500', 
      deepseek: 'bg-purple-500',
      offline: 'bg-gray-500'
    };
    return {
      color: statusColors[currentAIService as keyof typeof statusColors] || 'bg-gray-500',
      name: currentAIService.charAt(0).toUpperCase() + currentAIService.slice(1)
    };
  }, [currentAIService]);

  // Enhanced send message with league context
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: EnhancedChatMessage = {
      id: `user-${Date.now()}`,
      timestamp: new Date(),
      sender: 'user',
      message: input.trim(),
      leagueContext: {
        leagueId: activeLeagueId,
        relevantPlayers: [],
        contextType: 'general'
      }
    };

    setLocalMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      await onSendMessage(input.trim(), activeLeagueId);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      // Add error message to chat
      const errorMessage: EnhancedChatMessage = {
        id: `error-${Date.now()}`,
        timestamp: new Date(),
        sender: 'ai',
        message: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        leagueContext: {
          leagueId: activeLeagueId,
          relevantPlayers: [],
          contextType: 'general'
        }
      };
      setLocalMessages(prev => [...prev, errorMessage]);
    }
  }, [input, isLoading, onSendMessage, activeLeagueId]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Message renderer for virtualization
  const renderMessage = useCallback((message: EnhancedChatMessage, index: number) => (
    <EnhancedMessageBubble
      key={`${message.id}-${index}`}
      message={message}
      leagueContext={leagueContext}
    />
  ), [leagueContext]);

  // Quick action prompts specific to league context
  const leagueSpecificPrompts = useMemo(() => {
    const activeLeague = leagueContext.activeLeague;
    return [
      `Analyze my ${activeLeague.name} roster for this week`,
      `What are the best waiver pickups for ${activeLeague.name}?`,
      `Compare player values between my leagues`,
      `Show me trade opportunities in ${activeLeague.name}`,
      `What's my championship odds in ${activeLeague.name}?`
    ];
  }, [leagueContext.activeLeague]);

  return (
    <div className={`flex flex-col bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Brain className="w-6 h-6 text-blue-600" />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${aiServiceStatus.color} border-2 border-white`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI League Assistant</h3>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span>{aiServiceStatus.name}</span>
              <span>•</span>
              <span>{leagueContext.activeLeague.name}</span>
            </div>
          </div>
        </div>
        
        {/* League Switcher */}
        {availableLeagues.length > 1 && (
          <select
            value={activeLeagueId}
            onChange={(e) => onLeagueSwitch?.(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableLeagues.map(league => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 min-h-0">
        {managedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-lg font-medium mb-2">Welcome to AI League Assistant!</p>
            <p className="text-sm text-center max-w-md">
              I can help you with draft strategy, roster decisions, trade analysis, and cross-league insights.
              Try one of the quick prompts below or ask me anything!
            </p>
          </div>
        ) : virtualizedScrolling ? (
          <VirtualizedMessageList
            messages={managedMessages}
            maxHeight={400}
            itemHeight={120} // Approximate message height
            overscan={5}
            renderMessage={renderMessage}
          />
        ) : (
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {managedMessages.map((message, index) => renderMessage(message, index))}
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="border-t bg-gray-50 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {leagueSpecificPrompts.slice(0, 4).map((prompt, index) => (
            <button
              key={index}
              onClick={() => setInput(prompt)}
              className="p-2 text-sm text-left bg-white hover:bg-blue-50 rounded-md border border-gray-200 hover:border-blue-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask me about ${leagueContext.activeLeague.name} or any fantasy football question...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={isExpanded ? 3 : 1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Input Controls */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:text-gray-700 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'} input
          </button>
          <span>{input.length}/500 characters</span>
        </div>
      </div>
    </div>
  );
});

AIEnhancedChatPanel.displayName = 'AIEnhancedChatPanel';
EnhancedMessageBubble.displayName = 'EnhancedMessageBubble';
VirtualizedMessageList.displayName = 'VirtualizedMessageList';

export default AIEnhancedChatPanel;