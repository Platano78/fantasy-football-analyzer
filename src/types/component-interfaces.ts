// Component Interface Design for LegacyFantasyFootballAnalyzer Decomposition
// This file contains all TypeScript interfaces needed for clean component separation

import { Player, Position, ScoringSystem, Team, DraftSettings, DraftPick } from './index';

// ============================================================================
// SHARED EVENT HANDLER TYPES
// ============================================================================

export type PlayerActionHandler = (playerId: number) => void;
export type PlayerSelectionHandler = (playerId: number, selected: boolean) => void;
export type PositionFilterHandler = (position: Position | 'ALL') => void;
export type ScoringSystemHandler = (system: ScoringSystem) => void;
export type SearchHandler = (term: string) => void;
export type TimerHandler = () => void;
export type ViewChangeHandler = (view: string) => void;

// ============================================================================
// DRAFT BOARD COMPONENT INTERFACES
// ============================================================================

export interface DraftBoardState {
  players: Player[];
  draftedPlayers: Set<number>;
  selectedPlayers: Set<number>;
  customRankings: Record<number, number>;
  draggedPlayer: Player | null;
}

export interface DraftBoardFilters {
  searchTerm: string;
  positionFilter: Position | 'ALL';
  scoringSystem: ScoringSystem;
}

export interface DraftBoardActions {
  onPlayerDraft: PlayerActionHandler;
  onPlayerSelect: PlayerActionHandler;
  onPlayerDeselect: PlayerActionHandler;
  onSearchChange: SearchHandler;
  onPositionFilterChange: PositionFilterHandler;
  onScoringSystemChange: ScoringSystemHandler;
  onCustomRankingUpdate: (playerId: number, ranking: number | undefined) => void;
  onDragStart: (player: Player) => void;
  onDragEnd: () => void;
}

export interface DraftBoardProps {
  // State
  state: DraftBoardState;
  filters: DraftBoardFilters;
  
  // UI State
  isCompareMode: boolean;
  isDraftSimulationActive: boolean;
  
  // Actions
  actions: DraftBoardActions;
  
  // Optional customization
  showTiers?: boolean;
  showCustomRankings?: boolean;
  enableDragDrop?: boolean;
  itemsPerPage?: number;
}

// ============================================================================
// DRAFT TIMER COMPONENT INTERFACES
// ============================================================================

export interface DraftTimerState {
  timeRemaining: number;
  isActive: boolean;
  isWarning: boolean;
  showExpired: boolean;
  currentPicker: number;
  currentRound: number;
}

export interface DraftTimerActions {
  onStart: TimerHandler;
  onStop: TimerHandler;
  onReset: TimerHandler;
  onExpired?: TimerHandler;
}

export interface DraftTimerProps {
  state: DraftTimerState;
  actions: DraftTimerActions;
  
  // Configuration
  warningThreshold?: number;
  autoAdvanceOnExpired?: boolean;
  enableAudioAlerts?: boolean;
}

// ============================================================================
// AI CHAT COMPONENT INTERFACES
// ============================================================================

export interface AIMessage {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  metadata?: {
    players?: Player[];
    recommendations?: string[];
    confidence?: 'low' | 'medium' | 'high';
  };
}

export interface AIChatState {
  messages: AIMessage[];
  input: string;
  isLoading: boolean;
  isConnected: boolean;
}

export interface AIChatActions {
  onSendMessage: (message: string) => void;
  onInputChange: (input: string) => void;
  onClearHistory: () => void;
  onRetryMessage: (messageId: number) => void;
}

export interface AIChatProps {
  state: AIChatState;
  actions: AIChatActions;
  
  // Context for AI recommendations
  contextData: {
    players: Player[];
    draftedPlayers: Set<number>;
    currentDraftState: {
      round: number;
      pick: number;
      isUserTurn: boolean;
    };
    scoringSystem: ScoringSystem;
    draftSettings: DraftSettings;
  };
  
  // UI Configuration
  maxHeight?: string;
  showTypingIndicator?: boolean;
  enablePlayerRecommendations?: boolean;
}

// ============================================================================
// PLAYER COMPARISON MODAL INTERFACES
// ============================================================================

export interface ComparisonTabConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<ComparisonViewProps>;
}

export interface ComparisonViewProps {
  players: Player[];
  scoringSystem: ScoringSystem;
}

export interface PlayerComparisonModalState {
  isOpen: boolean;
  selectedPlayers: Player[];
  activeView: string;
}

export interface PlayerComparisonModalActions {
  onClose: () => void;
  onViewChange: ViewChangeHandler;
  onExport?: () => void;
  onPlayerRemove?: PlayerActionHandler;
}

export interface PlayerComparisonModalProps {
  state: PlayerComparisonModalState;
  actions: PlayerComparisonModalActions;
  scoringSystem: ScoringSystem;
  
  // Tab configuration
  availableTabs: ComparisonTabConfig[];
  
  // Export options
  exportFormats?: string[];
}

// ============================================================================
// COMPARISON VIEW COMPONENT INTERFACES
// ============================================================================

export interface StatsComparisonViewProps extends ComparisonViewProps {
  highlightDifferences?: boolean;
  showAdvancedStats?: boolean;
}

export interface TierAnalysisViewProps extends ComparisonViewProps {
  showPositionalRankings?: boolean;
  groupByTier?: boolean;
}

export interface ValueADPViewProps extends ComparisonViewProps {
  chartHeight?: number;
  showTrendLine?: boolean;
  highlightSteals?: boolean;
  highlightReaches?: boolean;
}

export interface RecommendationViewProps extends ComparisonViewProps {
  confidenceThreshold?: 'low' | 'medium' | 'high';
  showReasoningDetails?: boolean;
  enableInteractiveComparison?: boolean;
}

// ============================================================================
// DRAFT SIMULATION INTERFACES
// ============================================================================

export interface DraftSimulationState {
  isActive: boolean;
  currentOverallPick: number;
  currentPicker: number;
  currentRound: number;
  isUserTurn: boolean;
  simulationSpeed: number;
  draftHistory: DraftPick[];
  teams: Team[];
}

export interface DraftSimulationActions {
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onNextPick: () => void;
  onResetDraft: () => void;
  onSimulationSpeedChange: (speed: number) => void;
  onManualPick: (playerId: number, teamId: number) => void;
}

export interface DraftSimulationProps {
  state: DraftSimulationState;
  actions: DraftSimulationActions;
  players: Player[];
  draftedPlayers: Set<number>;
  
  // Configuration
  autoAdvance?: boolean;
  enableManualOverrides?: boolean;
  showSimulationStats?: boolean;
}

// ============================================================================
// CONTEXT AND PROVIDER INTERFACES
// ============================================================================

export interface FantasyFootballContextValue {
  // Core State
  players: Player[];
  teams: Team[];
  draftSettings: DraftSettings;
  
  // Draft State
  draftedPlayers: Set<number>;
  selectedPlayers: Set<number>;
  draftHistory: DraftPick[];
  currentOverallPick: number;
  currentRoundState: number;
  currentPicker: number;
  isUserTurn: boolean;
  
  // UI State
  currentView: string;
  scoringSystem: ScoringSystem;
  searchTerm: string;
  positionFilter: Position | 'ALL';
  isCompareMode: boolean;
  showComparisonModal: boolean;
  comparisonView: string;
  
  // Timer State
  draftTimer: number;
  isTimerActive: boolean;
  timerWarning: boolean;
  showTimerExpired: boolean;
  
  // Simulation State
  isDraftSimulationActive: boolean;
  simulationSpeed: number;
  
  // Actions
  dispatch: React.Dispatch<any>; // Use the existing action type from your context
}

// ============================================================================
// PROPS FLOW ARCHITECTURE TYPES
// ============================================================================

// Parent component props interface
export interface FantasyFootballAnalyzerProps {
  // Configuration
  enableSimulation?: boolean;
  enableAIChat?: boolean;
  enableComparison?: boolean;
  enableCustomRankings?: boolean;
  
  // Theming
  theme?: 'light' | 'dark' | 'auto';
  
  // Data sources
  dataSource?: 'mock' | 'api' | 'file';
  apiEndpoint?: string;
  
  // Callbacks
  onDraftComplete?: (draftHistory: DraftPick[]) => void;
  onDataUpdate?: (players: Player[]) => void;
  onError?: (error: Error) => void;
}

// Higher-order component props for context injection
export interface WithFantasyFootballProps {
  contextValue: FantasyFootballContextValue;
}

// ============================================================================
// UTILITY AND HELPER TYPES
// ============================================================================

export interface FilteredPlayersResult {
  players: Player[];
  totalCount: number;
  positionCounts: Record<Position, number>;
  availableCount: number;
  draftedCount: number;
}

export interface DraftAnalytics {
  averageADP: number;
  positionBreakdown: Record<Position, number>;
  tierAnalysis: Record<number, number>;
  valueBasedDrafting: Array<{
    player: Player;
    value: number;
    expectedValue: number;
  }>;
  recommendedPicks: Player[];
}

export interface ComponentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// ============================================================================
// EVENT SYSTEM TYPES
// ============================================================================

export type FantasyFootballEvent = 
  | { type: 'player_drafted'; playerId: number; teamId: number; round: number; pick: number }
  | { type: 'player_selected'; playerId: number }
  | { type: 'player_deselected'; playerId: number }
  | { type: 'timer_started'; currentPicker: number }
  | { type: 'timer_expired'; currentPicker: number }
  | { type: 'view_changed'; fromView: string; toView: string }
  | { type: 'comparison_opened'; playerIds: number[] }
  | { type: 'comparison_closed' }
  | { type: 'simulation_started' }
  | { type: 'simulation_completed'; finalStandings: Team[] };

export type EventHandler<T extends FantasyFootballEvent> = (event: T) => void;

// ============================================================================
// PERFORMANCE OPTIMIZATION TYPES
// ============================================================================

export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
  enableVirtualization: boolean;
}

export interface MemoizationConfig {
  enablePlayerMemo: boolean;
  enableFilterMemo: boolean;
  enableStatsMemo: boolean;
  cacheSize: number;
}

// ============================================================================
// TYPE GUARDS AND VALIDATION
// ============================================================================

export const isValidPlayer = (obj: any): obj is Player => {
  return obj && 
         typeof obj.id === 'number' &&
         typeof obj.name === 'string' &&
         ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'].includes(obj.position) &&
         typeof obj.adp === 'number' &&
         typeof obj.ppr === 'number';
};

export const isValidScoringSystem = (system: any): system is ScoringSystem => {
  return ['ppr', 'standard', 'halfPpr'].includes(system);
};