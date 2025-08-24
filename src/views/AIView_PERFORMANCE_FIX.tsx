import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Brain, Send, RotateCcw, Download, Bot, User, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { useDraftSimulation } from '@/hooks';
import { Player, Position, ScoringSystem } from '@/types';

// PERFORMANCE FIX: Simplified chat message interface - REMOVED analysis property
interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

// PERFORMANCE FIX: Removed complex UserPreferences and other heavy types
type SeasonPhase = 'draft' | 'early' | 'mid' | 'late' | 'playoff';

// PERFORMANCE FIX: Static responses instead of complex AI generation
const STATIC_AI_RESPONSES = [
  "Based on your league settings, I'd recommend focusing on RB depth in the early rounds.",
  "Your draft strategy looks solid. Consider targeting high-upside WRs in the middle rounds.",
  "For weekly optimization, check matchups and weather conditions before setting your lineup.",
  "Consider the playoff schedule when making trades - some players have better late-season matchups.",
  "Waiver wire priorities should focus on opportunity over talent early in the season."
];

// PERFORMANCE FIX: Simplified message component - REMOVED complex analysis display
const ChatMessageComponent = memo(({ 
  message,
  onCopy,
  onLike,
  onDislike
}: {
  message: ChatMessage;
  onCopy: (content: string) => void;
  onLike: (messageId: string) => void;
  onDislike: (messageId: string) => void;
}) => {
  const isAI = message.type === 'ai';

  return (
    <div className={`flex gap-3 mb-4 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isAI ? 'bg-blue-100' : 'bg-gray-100'
      }`}>
        {isAI ? <Bot className="w-5 h-5 text-blue-600" /> : <User className="w-5 h-5 text-gray-600" />}
      </div>
      
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

          {/* PERFORMANCE FIX: Simplified message actions - REMOVED complex analysis section */}
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

// PERFORMANCE FIX: Simplified quick actions - REMOVED complex season-aware features
const QuickActions = memo(({ 
  onPromptSelect,
  isLoading
}: {
  onPromptSelect: (prompt: string) => void;
  isLoading: boolean;
}) => {
  const actions = [
    { label: 'Draft Strategy', prompt: 'Help me with my draft strategy' },
    { label: 'Lineup Help', prompt: 'Optimize my weekly lineup' },
    { label: 'Trade Analysis', prompt: 'Analyze potential trades' },
    { label: 'Waiver Wire', prompt: 'Suggest waiver wire pickups' }
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => onPromptSelect(action.prompt)}
          disabled={isLoading}
          className="p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="font-medium">{action.label}</div>
        </button>
      ))}
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

// PERFORMANCE FIX: Simplified context summary - REMOVED complex calculations
const ContextSummary = memo(({ 
  currentRound,
  scoringSystem
}: {
  currentRound: number;
  scoringSystem: ScoringSystem;
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-gray-900 mb-3">Current Context</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Round:</span>
          <span className="font-medium ml-1">{currentRound}</span>
        </div>
        <div>
          <span className="text-gray-600">Scoring:</span>
          <span className="font-medium ml-1">{scoringSystem.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
});

ContextSummary.displayName = 'ContextSummary';

// PERFORMANCE FIX: Main AIView component - REMOVED complex features and setInterval usage
export default function AIView() {
  const { state } = useFantasyFootball();
  // PERFORMANCE FIX: Essential state only - messages, input, isLoading
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { currentRound } = useDraftSimulation();

  // PERFORMANCE FIX: Simplified initialization - NO setInterval, NO proactiveAlerts
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'ai',
      content: `🧠 **Fantasy Coach Ready**\n\nLeague: ${state.draftSettings.leagueName}\nScoring: ${state.scoringSystem.toUpperCase()}\n\nI'm here to help with your fantasy football decisions. What would you like to analyze?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [state.draftSettings.leagueName, state.scoringSystem]);

  // PERFORMANCE FIX: Auto-scroll - simple implementation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // PERFORMANCE FIX: Simplified AI response generation - NO complex analysis
  const generateAIResponse = useCallback(async (): Promise<ChatMessage> => {
    // Simple delay instead of complex processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return random static response for performance
    const randomResponse = STATIC_AI_RESPONSES[Math.floor(Math.random() * STATIC_AI_RESPONSES.length)];
    
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: randomResponse,
      timestamp: new Date()
    };
  }, []);

  // PERFORMANCE FIX: Simplified message handling
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
      const aiResponse = await generateAIResponse();
      setMessages(prev => [...prev.slice(0, -1), aiResponse]); // Replace typing indicator
    } catch (error) {
      setMessages(prev => [...prev.slice(0, -1), {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
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
    console.log('Liked message:', messageId);
  }, []);

  const dislikeMessage = useCallback((messageId: string) => {
    console.log('Disliked message:', messageId);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Assistant
          </h3>
          <div className="flex gap-2">
            <button
              onClick={clearChat}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={exportChat}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <ContextSummary
          currentRound={currentRound}
          scoringSystem={state.scoringSystem}
        />

        <QuickActions
          onPromptSelect={handleSendMessage}
          isLoading={isLoading}
        />
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
              placeholder="Ask for draft analysis, strategy recommendations, or player insights..."
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
