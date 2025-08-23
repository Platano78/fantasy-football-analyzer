# Component Decomposition Architecture Guide

## Overview

This document outlines the TypeScript interface design and architectural approach for decomposing the 2,269-line `LegacyFantasyFootballAnalyzer.tsx` into smaller, maintainable components while preserving type safety and functionality.

## 🏗️ Component Architecture

### Component Hierarchy
```
FantasyFootballAnalyzer (Main Container)
├── Header
├── NavigationTabs
├── DraftBoard (when currentView === 'draft')
│   ├── DraftBoardFilters
│   ├── PlayerList (virtualized)
│   └── DraftProgressIndicator
├── DraftTimer (conditional)
├── AIChat (sidebar)
├── PlayerComparisonModal (modal overlay)
│   ├── StatsComparisonView
│   ├── TierAnalysisView
│   ├── ValueADPView
│   └── RecommendationView
└── Other Views (Compare, Simulation, Rankings, etc.)
```

## 🔄 Data Flow Architecture

### Context vs Props Strategy

**Use Context For:**
- Global application state (players, teams, draftSettings)
- Cross-cutting concerns (currentView, scoringSystem, isDraftSimulationActive)
- State that needs to be shared between distant components
- Timer state (draftTimer, isTimerActive, timerWarning)

**Use Props For:**
- Component-specific state and handlers
- Data transformations specific to a component
- Event callbacks that bubble up
- Configuration and customization options

### State Management Pattern

```typescript
// Global State (Context)
interface FantasyFootballContextValue {
  // Core Data
  players: Player[];
  teams: Team[];
  draftedPlayers: Set<number>;
  
  // UI State
  currentView: string;
  scoringSystem: ScoringSystem;
  
  // Actions
  dispatch: React.Dispatch<FantasyFootballAction>;
}

// Component-Specific State (Props)
interface DraftBoardProps {
  state: DraftBoardState;      // Derived from context + local state
  filters: DraftBoardFilters;  // Search, position filter
  actions: DraftBoardActions;  // Event handlers
}
```

## 📊 Component Interface Design

### 1. DraftBoard Component

**Responsibilities:**
- Display filtered player list
- Handle player selection/drafting
- Manage search and filtering
- Support drag & drop for rankings

**Key Interfaces:**
- `DraftBoardProps` - Main component props
- `DraftBoardState` - Player data and selection state
- `DraftBoardFilters` - Search and filter configuration
- `DraftBoardActions` - Event handler collection

**Type Safety Strategy:**
```typescript
export interface DraftBoardProps {
  state: DraftBoardState;
  filters: DraftBoardFilters;
  actions: DraftBoardActions;
  
  // Configuration
  isCompareMode: boolean;
  isDraftSimulationActive: boolean;
  
  // Optional features
  showTiers?: boolean;
  enableDragDrop?: boolean;
}
```

### 2. DraftTimer Component

**Responsibilities:**
- Display countdown timer
- Handle timer controls (start/stop/reset)
- Emit timer events (warning, expired)
- Audio alerts

**Key Interfaces:**
- `DraftTimerState` - Current timer state
- `DraftTimerActions` - Timer control handlers
- `DraftTimerProps` - Complete component interface

**Type Safety Features:**
- Strongly typed timer handlers
- Configuration options for thresholds
- Optional audio alert controls

### 3. AIChat Component

**Responsibilities:**
- Display chat history
- Handle message input/sending
- Integrate with MCP bridge for AI responses
- Provide draft recommendations

**Key Interfaces:**
- `AIMessage` - Structured message type with metadata
- `AIChatState` - Chat state and connection status
- `AIChatProps` - Includes context data for AI recommendations

**Advanced Features:**
- Rich message metadata (player recommendations, confidence levels)
- Context-aware AI responses based on draft state
- Retry mechanism for failed messages

### 4. PlayerComparisonModal Component

**Responsibilities:**
- Modal overlay for player comparison
- Tab-based comparison views
- Export functionality
- Player management (add/remove)

**Key Interfaces:**
- `PlayerComparisonModalState` - Modal state and selected players
- `ComparisonTabConfig` - Dynamic tab configuration
- `ComparisonViewProps` - Base interface for comparison views

**Modular Design:**
- Separate components for each comparison view
- Configurable tab system
- Reusable comparison view interface

## 🎯 Component-Specific Interfaces

### StatsComparisonView
```typescript
interface StatsComparisonViewProps extends ComparisonViewProps {
  highlightDifferences?: boolean;
  showAdvancedStats?: boolean;
}
```

### TierAnalysisView
```typescript
interface TierAnalysisViewProps extends ComparisonViewProps {
  showPositionalRankings?: boolean;
  groupByTier?: boolean;
}
```

### ValueADPView
```typescript
interface ValueADPViewProps extends ComparisonViewProps {
  chartHeight?: number;
  showTrendLine?: boolean;
  highlightSteals?: boolean;
}
```

### RecommendationView
```typescript
interface RecommendationViewProps extends ComparisonViewProps {
  confidenceThreshold?: 'low' | 'medium' | 'high';
  showReasoningDetails?: boolean;
  enableInteractiveComparison?: boolean;
}
```

## 🔧 Event System Design

### Strongly Typed Events
```typescript
export type FantasyFootballEvent = 
  | { type: 'player_drafted'; playerId: number; teamId: number; round: number; pick: number }
  | { type: 'player_selected'; playerId: number }
  | { type: 'timer_expired'; currentPicker: number }
  | { type: 'comparison_opened'; playerIds: number[] };

export type EventHandler<T extends FantasyFootballEvent> = (event: T) => void;
```

### Event Handler Types
```typescript
export type PlayerActionHandler = (playerId: number) => void;
export type PlayerSelectionHandler = (playerId: number, selected: boolean) => void;
export type PositionFilterHandler = (position: Position | 'ALL') => void;
```

## 🚀 Performance Optimization

### Memoization Strategy
- `React.memo` for pure components
- `useMemo` for expensive calculations (filtered players)
- `useCallback` for stable event handlers
- Component-specific memoization configuration

### Virtualization Support
```typescript
interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
  enableVirtualization: boolean;
}
```

## 🛡️ Type Safety Features

### Type Guards
```typescript
export const isValidPlayer = (obj: any): obj is Player => {
  return obj && 
         typeof obj.id === 'number' &&
         typeof obj.name === 'string' &&
         ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'].includes(obj.position);
};
```

### Validation Interfaces
- Runtime type checking for external data
- Validation helpers for component props
- Error boundary types for component failures

## 🔄 Migration Strategy

### Phase 1: Extract Independent Components
1. **DraftTimer** - Minimal dependencies, clear interface
2. **AIChat** - Self-contained chat functionality
3. **StatsComparisonView** - Pure display component

### Phase 2: Extract Core Components
1. **DraftBoard** - Main player interface, complex state
2. **PlayerComparisonModal** - Modal container with tabs
3. **Comparison Views** - Remaining tab components

### Phase 3: Integration & Testing
1. Update main component to use new structure
2. Comprehensive testing of type safety
3. Performance optimization and memoization
4. Error boundary implementation

## 📝 Implementation Notes

### Context Usage
- Keep the existing `FantasyFootballContext` as the primary state manager
- Use `useFantasyFootball()` hook in components that need global state
- Pass derived state and handlers as props for component isolation

### Props Interface Design
- Group related props into structured objects (`state`, `actions`, `config`)
- Use optional properties for customization
- Maintain backward compatibility where possible

### Event Handler Patterns
- Consistent naming convention (`onPlayerDraft`, `onTimerStart`)
- Strongly typed parameters
- Clear separation of concerns (selection vs. drafting vs. filtering)

### Error Handling
- Component-level error boundaries
- Graceful degradation for missing data
- Type-safe error reporting interfaces

## 🎯 Benefits of This Architecture

1. **Type Safety**: Every component interaction is fully typed
2. **Maintainability**: Clear separation of concerns and responsibilities
3. **Reusability**: Components can be used independently
4. **Testability**: Isolated components with clear interfaces
5. **Performance**: Optimized rendering with proper memoization
6. **Extensibility**: Easy to add new features or comparison views

This architecture ensures that the decomposition maintains all existing functionality while providing a solid foundation for future development and maintenance.