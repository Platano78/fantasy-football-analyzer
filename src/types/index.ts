// Core TypeScript interfaces for Fantasy Football Analyzer

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'DEF' | 'K';
export type ScoringSystem = 'ppr' | 'standard' | 'halfPpr';
export type ViewType = 'draft' | 'compare' | 'rankings' | 'simulation' | 'live-data' | 'draft-tracker' | 'enhanced-ai' | 'news' | 'analytics' | 'legacy';
export type InjuryStatus = 'Healthy' | 'Questionable' | 'Doubtful' | 'Out' | 'IR';
export type DraftStrategy = 'value_based' | 'position_scarcity' | 'balanced' | 'high_upside' | 'rb_zero' | 'user_controlled' | 'adp_based' | 'contrarian' | 'positional_runs' | 'analytics_based' | 'stars_and_scrubs';

export interface Player {
  id: number;
  name: string;
  position: Position;
  team: string;
  adp: number;
  ppr: number;
  standard: number;
  halfPpr: number;
  injury: InjuryStatus;
  news: string;
  tier: number;
}

export interface RosterNeeds {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  DEF: number;
  K: number;
}

export interface Team {
  id: number;
  name: string;
  owner: string;
  strategy: DraftStrategy;
  tendencies: string[];
  rosterNeeds: RosterNeeds;
}

export interface DraftSettings {
  position: number;
  totalTeams: number;
  rounds: number;
  leagueName: string;
  draftTime: string;
  timePerPick: number;
}

export interface DraftPick {
  round: number;
  pick: number;
  overallPick: number;
  teamId: number;
  playerId: number;
  timestamp: Date;
}

export interface FantasyFootballState {
  // Core data
  players: Player[];
  teams: Team[];
  draftSettings: DraftSettings;
  
  // UI state
  currentView: ViewType;
  scoringSystem: ScoringSystem;
  searchTerm: string;
  positionFilter: Position | 'ALL';
  
  // Draft state
  draftedPlayers: Set<number>;
  draftHistory: DraftPick[];
  currentOverallPick: number;
  currentRoundState: number;
  currentPicker: number;
  isUserTurn: boolean;
  isDraftSimulationActive: boolean;
  
  // Timer state
  draftTimer: number;
  isTimerActive: boolean;
  timerWarning: boolean;
  showTimerExpired: boolean;
  
  // Comparison state
  isCompareMode: boolean;
  selectedPlayers: Set<number>;
  showComparisonModal: boolean;
  comparisonView: string;
  
  // Rankings state
  customRankings: Record<number, number>;
  draggedPlayer: Player | null;
  
  // AI state
  aiMessages: any[];
  aiInput: string;
  
  // Live data state
  isUpdatingData: boolean;
  isDraftTracking: boolean;
  
  // Export state
  exportFormat: string;
  showExportModal: boolean;
  
  // Simulation state
  simulationSpeed: number;
  draftOrder: number[];
}

export type FantasyFootballAction = 
  | { type: 'SET_CURRENT_VIEW'; payload: ViewType }
  | { type: 'SET_SCORING_SYSTEM'; payload: ScoringSystem }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_POSITION_FILTER'; payload: Position | 'ALL' }
  | { type: 'DRAFT_PLAYER'; payload: { playerId: number; teamId: number } }
  | { type: 'START_DRAFT_SIMULATION' }
  | { type: 'STOP_DRAFT_SIMULATION' }
  | { type: 'NEXT_PICK' }
  | { type: 'START_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'TICK_TIMER' }
  | { type: 'TOGGLE_COMPARE_MODE' }
  | { type: 'SELECT_PLAYER'; payload: number }
  | { type: 'DESELECT_PLAYER'; payload: number | { playerId: number; teamId: number } }
  | { type: 'CLEAR_SELECTED_PLAYERS' }
  | { type: 'UPDATE_CUSTOM_RANKING'; payload: { playerId: number; ranking: number | undefined } }
  | { type: 'SET_DRAGGED_PLAYER'; payload: Player | null }
  | { type: 'ADD_AI_MESSAGE'; payload: any }
  | { type: 'SET_AI_INPUT'; payload: string }
  | { type: 'SET_UPDATING_DATA'; payload: boolean }
  | { type: 'SET_DRAFT_TRACKING'; payload: boolean }
  | { type: 'SET_EXPORT_FORMAT'; payload: string }
  | { type: 'TOGGLE_EXPORT_MODAL' }
  | { type: 'SET_SIMULATION_SPEED'; payload: number }
  | { type: 'RESET_DRAFT' };

// Helper types for component props
export interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  isCompareMode?: boolean;
  onSelect?: (playerId: number) => void;
  onDraft?: (playerId: number) => void;
  customRanking?: number;
  onUpdateRanking?: (playerId: number, ranking: number | undefined) => void;
}

export interface DraftBoardProps {
  players: Player[];
  draftedPlayers: Set<number>;
  searchTerm: string;
  positionFilter: Position | 'ALL';
  scoringSystem: ScoringSystem;
  onPlayerDraft: (playerId: number) => void;
  onSearchChange: (term: string) => void;
  onPositionFilterChange: (position: Position | 'ALL') => void;
}

export interface ComparisonModalProps {
  isOpen: boolean;
  players: Player[];
  scoringSystem: ScoringSystem;
  comparisonView: string;
  onClose: () => void;
  onViewChange: (view: string) => void;
}

export interface TimerDisplayProps {
  timeRemaining: number;
  isActive: boolean;
  isWarning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

// Utility types
export type FilteredPlayersResult = {
  players: Player[];
  totalCount: number;
  positionCounts: Record<Position, number>;
};

export type DraftAnalytics = {
  averageADP: number;
  positionBreakdown: Record<Position, number>;
  tierAnalysis: Record<number, number>;
  valueBasedDrafting: Array<{
    player: Player;
    value: number;
    expectedValue: number;
  }>;
};

// Export component interfaces
export * from './component-interfaces';