# AIChat Component Integration Guide

## Overview

The `AIChat` component is a standalone, intelligent chat interface designed specifically for fantasy football draft assistance. It provides contextual recommendations, pre-defined prompts, and rich message formatting to enhance the draft experience.

## Features

### ✨ **Core Features**
- **Message History**: Persistent chat conversation display with user/AI message bubbles
- **Rich AI Responses**: Formatted AI messages with player recommendations, strategy points, and analysis
- **Quick Action Prompts**: Pre-defined prompts categorized by analysis type
- **Context Awareness**: Full integration with draft state, player data, and scoring systems
- **Real-time Updates**: Typing indicators, loading states, and auto-scrolling

### 🎯 **AI Prompts Included**
- **Analysis**: "Analyze current position tiers"
- **Player Evaluation**: "Identify top PPR specialists", "Analyze rookie prospects"
- **Strategy**: "Create complete draft strategy plan", "Alert me to position scarcity issues"
- **Risk Assessment**: "Assess injury risks and upside potential"
- **Value**: "Find best value targets available", "Identify late-round sleepers"

### 🔧 **Advanced Features**
- **Message Actions**: Copy, like/dislike functionality
- **Collapsible Sections**: Expandable analysis results
- **Category Filtering**: Quick prompt organization
- **Performance Optimized**: Virtual scrolling and memoization
- **Responsive Design**: Works on desktop and mobile

## Basic Integration

```typescript
import React, { useState, useCallback } from 'react';
import { AIChat, ChatMessage, DraftContext } from './components/draft/AIChat';

const MyDraftView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const draftContext: DraftContext = {
    players: availablePlayers,
    draftHistory: currentDraftHistory,
    currentRound: 3,
    currentPick: 7,
    userTeam: userTeamData,
    scoringSystem: 'ppr',
    draftSettings: leagueSettings,
    availablePlayers: filteredPlayers,
    userRoster: currentRoster,
    positionNeeds: calculatePositionNeeds(currentRoster)
  };

  const handleSendMessage = useCallback(async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call your AI service here
      const aiResponse = await callAIService(message, draftContext);
      
      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        analysis: aiResponse.analysis,
        metadata: aiResponse.metadata
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI request failed:', error);
      // Handle error...
    } finally {
      setIsLoading(false);
    }
  }, [draftContext]);

  return (
    <div className="h-96">
      <AIChat
        messages={messages}
        input={input}
        draftContext={draftContext}
        onSendMessage={handleSendMessage}
        onInputChange={setInput}
        onPromptSelect={handleSendMessage}
        isLoading={isLoading}
        isConnected={true}
        enableTypingIndicator={true}
        enableMessageActions={true}
      />
    </div>
  );
};
```

## Props Interface

### Required Props

```typescript
interface AIChatProps {
  messages: ChatMessage[];           // Array of chat messages
  input: string;                     // Current input value
  draftContext: DraftContext;       // Complete draft state context
  onSendMessage: (message: string) => void;     // Message send handler
  onInputChange: (input: string) => void;       // Input change handler
  onPromptSelect: (prompt: string) => void;     // Quick prompt handler
}
```

### Optional Props

```typescript
interface AIChatProps {
  isLoading?: boolean;               // Show loading state (default: false)
  isConnected?: boolean;             // AI connection status (default: true)
  maxHeight?: string;                // Container max height (default: "600px")
  enableTypingIndicator?: boolean;   // Show typing animation (default: true)
  enableMessageActions?: boolean;    // Enable message actions (default: true)
  onMessageAction?: (messageId: string, action: string) => void;
}
```

## Message Structure

### ChatMessage Interface

```typescript
interface ChatMessage {
  id: string;                        // Unique message identifier
  type: 'user' | 'ai';              // Message sender type
  content: string;                   // Main message content
  timestamp: Date;                   // Message timestamp
  analysis?: MessageAnalysis;        // Rich AI analysis data
  metadata?: MessageMetadata;        // Additional message metadata
}
```

### Analysis Structure

```typescript
interface MessageAnalysis {
  playerRecommendations?: Player[];  // Recommended players with reasoning
  strategyPoints?: string[];         // Strategic advice points
  riskFactors?: string[];           // Risk assessment factors
  scarcityAlerts?: ScarcityAlert[]; // Position scarcity warnings
  tierBreakdown?: TierAnalysis[];   // Tier-based player groupings
}
```

## Draft Context Integration

The `DraftContext` interface provides comprehensive draft state information to the AI:

```typescript
interface DraftContext {
  players: Player[];                 // All available players
  draftHistory: DraftPick[];        // Complete draft history
  currentRound: number;              // Current draft round
  currentPick: number;               // Current pick number
  userTeam: Team;                    // User's team configuration
  scoringSystem: ScoringSystem;      // League scoring system
  draftSettings: DraftSettings;      // Draft configuration
  availablePlayers: Player[];        // Undrafted players
  userRoster: Player[];             // User's current roster
  positionNeeds: Record<Position, number>; // Remaining position needs
}
```

## AI Service Integration Examples

### OpenAI Integration

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const callAIService = async (message: string, context: DraftContext) => {
  const systemPrompt = `You are an expert fantasy football draft assistant. 
  Current context: Round ${context.currentRound}, Pick ${context.currentPick}, 
  Scoring: ${context.scoringSystem.toUpperCase()}. 
  User needs: ${Object.entries(context.positionNeeds)
    .filter(([_, count]) => count > 0)
    .map(([pos, count]) => `${pos}(${count})`)
    .join(', ')}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ],
    temperature: 0.7
  });

  return {
    content: response.choices[0].message.content,
    analysis: parseAIAnalysis(response.choices[0].message.content),
    metadata: {
      confidence: 'high',
      processingTime: Date.now() - startTime,
      contextUsed: ['draft_position', 'scoring_system', 'roster_needs']
    }
  };
};
```

### Custom AI Service

```typescript
const callCustomAIService = async (message: string, context: DraftContext) => {
  const response = await fetch('/api/ai-draft-assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      context: {
        round: context.currentRound,
        pick: context.currentPick,
        scoringSystem: context.scoringSystem,
        positionNeeds: context.positionNeeds,
        availablePlayers: context.availablePlayers.slice(0, 50) // Limit for API
      }
    })
  });

  return await response.json();
};
```

## Styling and Customization

### CSS Classes Used

The component uses Tailwind CSS classes. Key customization points:

```css
/* Message bubbles */
.message-user { @apply bg-blue-500 text-white; }
.message-ai { @apply bg-gray-100 text-gray-900; }

/* Quick prompts */
.prompt-card { @apply bg-gradient-to-r from-blue-50 to-indigo-50; }
.prompt-card:hover { @apply from-blue-100 to-indigo-100; }

/* Analysis sections */
.analysis-section { @apply border rounded-lg p-4 shadow-sm; }
.player-card { @apply bg-white border rounded-lg p-3; }
```

### Theme Customization

```typescript
// Custom theme props (extend the interface)
interface AIChatThemeProps {
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}
```

## Performance Optimization

### Virtual Scrolling

For long message histories:

```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedMessages = ({ messages }) => (
  <List
    height={400}
    itemCount={messages.length}
    itemSize={100}
    itemData={messages}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <MessageBubble message={data[index]} />
      </div>
    )}
  </List>
);
```

### Message Memoization

```typescript
import React, { memo } from 'react';

const MemoizedMessageBubble = memo(MessageBubble, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id &&
         prevProps.message.content === nextProps.message.content;
});
```

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AIChat } from './AIChat';

describe('AIChat Component', () => {
  const mockProps = {
    messages: [],
    input: '',
    draftContext: mockDraftContext,
    onSendMessage: jest.fn(),
    onInputChange: jest.fn(),
    onPromptSelect: jest.fn()
  };

  it('renders message input', () => {
    render(<AIChat {...mockProps} />);
    expect(screen.getByPlaceholderText(/ask for advanced draft analysis/i)).toBeInTheDocument();
  });

  it('displays quick prompts', () => {
    render(<AIChat {...mockProps} />);
    expect(screen.getByText(/analyze current position tiers/i)).toBeInTheDocument();
  });

  it('sends message on button click', () => {
    render(<AIChat {...mockProps} input="Test message" />);
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(mockProps.onSendMessage).toHaveBeenCalledWith('Test message');
  });
});
```

## Advanced Usage

### Custom Prompt Categories

```typescript
const customPrompts = [
  {
    id: 'league-specific',
    text: 'Analyze for 6-point passing TDs',
    icon: Target,
    description: 'QB analysis with 6pt passing TD scoring',
    category: 'league-specific'
  }
];

<AIChat
  {...props}
  customPrompts={customPrompts}
/>
```

### Message Persistence

```typescript
// Save messages to localStorage
useEffect(() => {
  localStorage.setItem('aiChatMessages', JSON.stringify(messages));
}, [messages]);

// Load messages on mount
useEffect(() => {
  const saved = localStorage.getItem('aiChatMessages');
  if (saved) {
    setMessages(JSON.parse(saved));
  }
}, []);
```

### Real-time Draft Updates

```typescript
// Update context when draft state changes
useEffect(() => {
  setDraftContext({
    ...draftContext,
    currentRound: currentDraftRound,
    currentPick: currentDraftPick,
    availablePlayers: filteredAvailablePlayers
  });
}, [currentDraftRound, currentDraftPick, filteredAvailablePlayers]);
```

## Common Integration Patterns

### 1. Sidebar Integration

```typescript
<div className="flex h-screen">
  <div className="flex-1">
    <DraftBoard {...draftProps} />
  </div>
  <div className="w-96 border-l">
    <AIChat {...aiChatProps} />
  </div>
</div>
```

### 2. Modal Integration

```typescript
{showAIAssistant && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white rounded-lg w-full max-w-4xl h-3/4">
      <AIChat {...aiChatProps} />
    </div>
  </div>
)}
```

### 3. Tab Integration

```typescript
const tabs = [
  { id: 'draft', name: 'Draft Board', component: DraftBoard },
  { id: 'ai', name: 'AI Assistant', component: AIChat },
];
```

This comprehensive guide should help you integrate the AIChat component effectively into your fantasy football application. The component is designed to be flexible and customizable while providing powerful AI-driven draft assistance.