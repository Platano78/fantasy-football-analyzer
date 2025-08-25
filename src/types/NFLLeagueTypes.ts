// NFL.com League Sync Types
// Comprehensive type definitions for NFL.com fantasy league integration

// Base NFL League Data Structures
export interface NFLTeamInfo {
  name: string;
  abbreviation: string;
  logoUrl?: string;
  divisionRank?: number;
  conferenceRank?: number;
}

export interface NFLPlayer {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  team: string;
  teamInfo?: NFLTeamInfo;
  jerseyNumber?: number;
  bye?: number;
  injuryStatus?: 'Healthy' | 'Questionable' | 'Doubtful' | 'Out' | 'IR';
  projectedPoints?: number;
  lastWeekPoints?: number;
  seasonPoints?: number;
  rostered?: boolean;
  rosteredBy?: string;
}

export interface FantasyTeam {
  id: string;
  name: string;
  ownerName: string;
  ownerId: string;
  logoUrl?: string;
  record?: {
    wins: number;
    losses: number;
    ties: number;
  };
  points?: {
    total: number;
    average: number;
    rank: number;
  };
  roster: NFLPlayer[];
  draftPosition?: number;
  isCurrentUser?: boolean;
}

export interface LeagueSettings {
  name: string;
  size: number; // Number of teams
  scoringType: 'Standard' | 'PPR' | 'Half-PPR' | 'Custom';
  rosterSettings: {
    qb: number;
    rb: number;
    wr: number;
    te: number;
    flex: number;
    k: number;
    def: number;
    bench: number;
    ir?: number;
  };
  playoffSettings?: {
    teams: number;
    weeks: number;
    championshipWeek: number;
  };
  waiverSettings?: {
    type: 'Waiver Priority' | 'FAAB' | 'First Come First Serve';
    budget?: number;
  };
  tradeSettings?: {
    deadline?: string;
    reviewPeriod?: number;
    allowFuturePicks?: boolean;
  };
}

export interface DraftSettings {
  isDrafted: boolean;
  draftType: 'Snake' | 'Linear' | 'Auction';
  draftDate?: Date;
  draftStatus: 'Scheduled' | 'In Progress' | 'Complete';
  currentPick?: {
    round: number;
    pick: number;
    teamId: string;
    timeRemaining?: number;
  };
  myDraftPosition?: number;
  totalRounds: number;
  timePerPick?: number;
  draftOrder?: string[];
}

export interface NFLLeague {
  id: string;
  name: string;
  leagueKey: string; // Internal NFL.com league identifier
  url?: string;
  season: number;
  currentWeek: number;
  gameWeek?: number;
  
  // League configuration
  settings: LeagueSettings;
  draftSettings: DraftSettings;
  
  // Teams and members
  teams: FantasyTeam[];
  myTeam?: FantasyTeam;
  
  // Sync status
  lastSyncTime?: Date;
  syncStatus: 'never' | 'syncing' | 'success' | 'error' | 'partial';
  syncErrors?: string[];
  
  // Authentication state
  authStatus: 'unauthenticated' | 'authenticated' | 'expired' | 'error';
  
  // Manual override flags
  manualOverrides?: {
    roster?: boolean;
    settings?: boolean;
    draftPosition?: boolean;
  };
}

// Multi-League Management
export interface NFLLeagueCollection {
  leagues: Record<string, NFLLeague>;
  activeLeagueId: string | null;
  syncOrder: string[]; // Order for syncing multiple leagues
}

// Sync Configuration
export interface NFLSyncCredentials {
  username: string;
  password: string;
  rememberLogin?: boolean;
  lastUsed?: Date;
}

export interface NFLSyncConfig {
  credentials?: NFLSyncCredentials;
  autoSync: boolean;
  syncInterval: number; // minutes
  retryAttempts: number;
  timeout: number; // milliseconds
  enableScreenshots: boolean;
  debugMode: boolean;
}

// Sync Progress & Status
export type SyncStage = 
  | 'authenticating'
  | 'navigating'
  | 'loading_league'
  | 'extracting_settings'
  | 'extracting_teams'
  | 'extracting_rosters'
  | 'extracting_draft'
  | 'processing_data'
  | 'saving_data'
  | 'complete'
  | 'error';

export interface SyncProgress {
  stage: SyncStage;
  message: string;
  progress: number; // 0-100
  startTime: Date;
  estimatedTimeRemaining?: number;
  currentLeague?: string;
  currentTeam?: string;
  errors?: string[];
  warnings?: string[];
}

export interface SyncResult {
  leagueId: string;
  success: boolean;
  duration: number;
  dataExtracted: {
    settings: boolean;
    teams: boolean;
    rosters: boolean;
    draft: boolean;
  };
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

// Manual Entry Support
export interface ManualLeagueEntry {
  leagueInfo: {
    name: string;
    leagueId: string;
    teamCount: number;
    scoringType: LeagueSettings['scoringType'];
  };
  myTeamInfo: {
    teamName: string;
    ownerName: string;
    draftPosition?: number;
  };
  rosterEntry: {
    method: 'manual' | 'import';
    players: Partial<NFLPlayer>[];
  };
  opponentsInfo?: {
    teamName: string;
    ownerName: string;
    draftPosition?: number;
  }[];
}

// AI Coaching Integration Types
export interface NFLDraftContext {
  league: NFLLeague;
  availablePlayers: NFLPlayer[];
  draftedPlayers: NFLPlayer[];
  myRoster: NFLPlayer[];
  currentPick?: {
    round: number;
    pick: number;
    isMyPick: boolean;
    timeRemaining?: number;
  };
  positionalNeeds: Record<NFLPlayer['position'], number>;
  draftStrategy?: 'balanced' | 'rb_heavy' | 'zero_rb' | 'wr_heavy' | 'late_round_qb';
}

export interface NFLDraftRecommendation {
  recommendedPlayers: {
    player: NFLPlayer;
    reasoning: string;
    confidence: number;
    tier: number;
    alternativePositions?: NFLPlayer['position'][];
  }[];
  strategyAdvice: {
    currentRoundStrategy: string;
    nextRoundConsiderations: string[];
    positionPriorities: string[];
    riskFactors: string[];
  };
  rosterAnalysis: {
    strengths: string[];
    weaknesses: string[];
    upcomingNeeds: NFLPlayer['position'][];
    flexibilityRating: number;
  };
}

// Browser Automation Types
export interface NFLBrowserSession {
  sessionId: string;
  isActive: boolean;
  currentUrl: string;
  authenticated: boolean;
  lastActivity: Date;
  screenshotPath?: string;
  pageTitle?: string;
  errors: string[];
}

export interface NFLPageSelectors {
  // Authentication selectors
  loginForm: string;
  usernameField: string;
  passwordField: string;
  loginButton: string;
  loginError: string;
  
  // League navigation selectors  
  leagueList: string;
  leagueLink: string;
  leagueName: string;
  
  // League settings selectors
  settingsContainer: string;
  scoringType: string;
  rosterPositions: string;
  teamCount: string;
  
  // Team and roster selectors
  teamList: string;
  teamName: string;
  teamOwner: string;
  rosterTable: string;
  playerRow: string;
  playerName: string;
  playerPosition: string;
  playerTeam: string;
  
  // Draft board selectors
  draftBoard: string;
  draftOrder: string;
  draftPick: string;
  draftStatus: string;
  currentPick: string;
}

// Error Types
export class NFLSyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public stage: SyncStage,
    public leagueId?: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'NFLSyncError';
  }
}

export type NFLSyncErrorCode =
  | 'AUTHENTICATION_FAILED'
  | 'LEAGUE_NOT_FOUND'
  | 'PARSING_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'PAGE_CHANGED'
  | 'UNKNOWN_ERROR';

// React Component Props Types
export interface NFLLeagueSyncerProps {
  initialLeagues?: Record<string, NFLLeague>;
  onSyncComplete?: (results: SyncResult[]) => void;
  onSyncProgress?: (progress: SyncProgress) => void;
  onSyncError?: (error: NFLSyncError) => void;
  onLeagueCollectionUpdate?: (leagueCollection: NFLLeagueCollection) => void;
  config?: Partial<NFLSyncConfig>;
  className?: string;
}

export interface LeagueSwitcherProps {
  leagues: Record<string, NFLLeague>;
  activeLeagueId: string | null;
  onLeagueChange: (leagueId: string) => void;
  onAddLeague?: () => void;
  onRemoveLeague?: (leagueId: string) => void;
  showSyncStatus?: boolean;
  className?: string;
}

export interface NFLDraftCoachProps {
  league: NFLLeague;
  draftContext?: NFLDraftContext;
  onRecommendationRequest?: (context: NFLDraftContext) => Promise<NFLDraftRecommendation>;
  realTimeDraft?: boolean;
  aiService?: 'gemini-advanced' | 'gemini-enterprise' | 'hybrid';
  className?: string;
}

export interface ManualLeagueEntryProps {
  onLeagueCreated: (league: NFLLeague) => void;
  onCancel: () => void;
  existingLeague?: Partial<NFLLeague>;
  mode: 'create' | 'edit' | 'import';
  className?: string;
}

// Utility Types
export type NFLLeagueId = string;
export type NFLTeamId = string;
export type NFLPlayerId = string;

// Event Types for Real-time Updates
export interface NFLLeagueUpdateEvent {
  type: 'sync_start' | 'sync_progress' | 'sync_complete' | 'sync_error' | 'draft_update' | 'roster_change';
  leagueId: string;
  data: SyncProgress | SyncResult | NFLSyncError | DraftSettings | FantasyTeam;
  timestamp: Date;
}

// Storage Types
export interface NFLLeagueStorage {
  leagues: Record<string, NFLLeague>;
  config: NFLSyncConfig;
  credentials?: NFLSyncCredentials;
  lastSync: Date;
  version: string;
}

