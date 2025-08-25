// Core TypeScript interfaces for Fantasy Football Analyzer

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'DEF' | 'K';
export type ScoringSystem = 'ppr' | 'standard' | 'halfPpr';
export type ViewType = 'draft' | 'compare' | 'rankings' | 'live-data' | 'draft-tracker' | 'enhanced-ai' | 'news' | 'analytics' | 'nfl-sync' | 'legacy';
export type InjuryStatus = 'Healthy' | 'Questionable' | 'Doubtful' | 'Out' | 'IR';
export type DraftStrategy = 'value_based' | 'position_scarcity' | 'balanced' | 'high_upside' | 'rb_zero' | 'user_controlled' | 'adp_based' | 'contrarian' | 'positional_runs' | 'analytics_based' | 'stars_and_scrubs' | 'boom_bust';

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

// Draft room connection types
export type DraftRoomProvider = 'espn' | 'nfl' | 'yahoo' | 'sleeper';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'syncing';

export interface DraftRoomConnection {
  provider: DraftRoomProvider;
  url: string;
  leagueId: string;
  status: ConnectionStatus;
  lastSync: Date | null;
  error?: string;
  retryCount: number;
}

export interface DraftRoomState {
  connection: DraftRoomConnection | null;
  autoSync: boolean;
  syncInterval: number; // milliseconds
  isLiveDraft: boolean;
  lastServerUpdate: Date | null;
  syncedData: any; // Stores synced draft room data from API
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
  
  // Draft room connection state
  draftRoomState: DraftRoomState;
  
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
  | { type: 'RESET_DRAFT' }
  | { type: 'SET_DRAFT_ROOM_CONNECTION'; payload: DraftRoomConnection | null }
  | { type: 'UPDATE_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'SET_AUTO_SYNC'; payload: boolean }
  | { type: 'SET_LIVE_DRAFT_STATUS'; payload: boolean }
  | { type: 'UPDATE_LAST_SERVER_UPDATE'; payload: Date };

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

// Export enhanced league types for AI integration
export * from './LeagueTypes';

// Export NFL league types
export * from './NFLLeagueTypes';

// Export live draft room types
export * from './DraftRoomTypes';
export * from './DraftRoomServiceTypes';