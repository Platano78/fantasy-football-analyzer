/**
 * Live Draft Room TypeScript Interfaces and Types
 * 
 * Comprehensive type definitions for real-time draft room functionality
 * supporting multiple fantasy football platforms (ESPN, NFL.com, Yahoo, Sleeper)
 * with live synchronization, URL parsing, authentication, and state management.
 * 
 * Features:
 * - Multi-platform draft room connections
 * - Real-time draft event synchronization
 * - Authentication and session management
 * - URL parsing and validation
 * - Draft state management with error/loading states
 * - WebSocket and polling-based updates
 * - Cross-platform draft data normalization
 */

import { Player, Position, Team, DraftPick, DraftSettings } from './index';
import { League, LeagueTeam } from './LeagueTypes';
import { NFLLeague } from './NFLLeagueTypes';

// ========================================
// CORE PLATFORM TYPES
// ========================================

/**
 * Supported fantasy football platforms for live draft integration
 */
export type DraftPlatform = 'espn' | 'nfl' | 'yahoo' | 'sleeper' | 'cbs' | 'fleaflicker';

/**
 * Draft room connection status states
 */
export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting' 
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'expired'
  | 'rate_limited';

/**
 * Draft synchronization modes
 */
export type SyncMode = 
  | 'manual'      // User-driven updates
  | 'polling'     // Regular API polling
  | 'websocket'   // Real-time WebSocket
  | 'hybrid'      // Mix of polling and WebSocket
  | 'disabled';   // No sync

/**
 * Authentication status for draft room access
 */
export type AuthStatus = 
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'expired'
  | 'invalid_credentials'
  | 'locked_out'
  | 'requires_2fa';

// ========================================
// URL PARSING AND VALIDATION
// ========================================

/**
 * Parsed draft room URL components
 */
export interface DraftRoomURL {
  platform: DraftPlatform;
  leagueId: string;
  seasonYear: number;
  draftId?: string;
  
  // Original and normalized URLs
  originalUrl: string;
  normalizedUrl: string;
  
  // URL validation results
  isValid: boolean;
  validationErrors: string[];
  
  // Platform-specific parameters
  platformParams: Record<string, string>;
  
  // Extracted metadata
  metadata: {
    leagueName?: string;
    draftType?: 'snake' | 'linear' | 'auction';
    teamCount?: number;
    isLive?: boolean;
    scheduledStart?: Date;
  };
}

/**
 * URL validation configuration per platform
 */
export interface PlatformURLConfig {
  platform: DraftPlatform;
  baseUrl: string;
  urlPatterns: RegExp[];
  requiredParams: string[];
  optionalParams: string[];
  
  // URL parsing rules
  extractors: {
    leagueId: (url: string) => string | null;
    seasonYear: (url: string) => number | null;
    draftId?: (url: string) => string | null;
  };
  
  // Validation rules
  validators: {
    leagueId: (id: string) => boolean;
    seasonYear: (year: number) => boolean;
    isPublic?: (url: string) => boolean;
  };
}

// ========================================
// AUTHENTICATION AND SESSION MANAGEMENT
// ========================================

/**
 * Platform-specific authentication credentials
 */
export interface DraftRoomCredentials {
  platform: DraftPlatform;
  
  // Basic auth (most platforms)
  username?: string;
  password?: string;
  
  // OAuth/Token-based auth
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  
  // Session management
  sessionId?: string;
  csrfToken?: string;
  
  // Platform-specific fields
  swid?: string;        // ESPN
  espnS2?: string;      // ESPN
  yahooGuid?: string;   // Yahoo
  
  // Security
  encryptedCredentials?: string;
  lastUsed?: Date;
  expiresAt?: Date;
  
  // Storage preferences
  rememberMe: boolean;
  storeLocally: boolean;
}

/**
 * Authentication session state
 */
export interface AuthSession {
  platform: DraftPlatform;
  leagueId: string;
  
  status: AuthStatus;
  credentials: DraftRoomCredentials;
  
  // Session lifecycle
  startTime: Date;
  lastActivity: Date;
  expiresAt?: Date;
  
  // Security tracking
  ipAddress?: string;
  userAgent?: string;
  sessionToken?: string;
  
  // Rate limiting
  requestCount: number;
  rateLimitResetTime?: Date;
  
  // Error tracking
  lastError?: string;
  failedAttempts: number;
  lockoutUntil?: Date;
}

/**
 * Multi-platform authentication manager
 */
export interface AuthenticationManager {
  sessions: Map<string, AuthSession>; // Key: `${platform}_${leagueId}`
  
  // Global auth state
  isInitialized: boolean;
  defaultCredentials: Partial<DraftRoomCredentials>;
  
  // Security settings
  maxFailedAttempts: number;
  lockoutDuration: number; // minutes
  sessionTimeout: number;  // minutes
  
  // Storage encryption
  encryptionKey?: string;
  storageBackend: 'localStorage' | 'sessionStorage' | 'memory' | 'secure';
}

// ========================================
// DRAFT ROOM CONNECTION CONFIGURATION
// ========================================

/**
 * Connection configuration for a specific draft room
 */
export interface DraftRoomConnection {
  // Platform identification
  platform: DraftPlatform;
  leagueId: string;
  draftId?: string;
  
  // Connection details
  url: DraftRoomURL;
  credentials: DraftRoomCredentials;
  
  // Sync configuration
  syncMode: SyncMode;
  syncInterval: number; // milliseconds for polling
  
  // Connection behavior
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelay: number; // milliseconds
  
  // Data preferences
  enableRealTimeUpdates: boolean;
  enableNotifications: boolean;
  enableAutoSync: boolean;
  
  // Performance settings
  requestTimeout: number;
  batchSize: number; // for bulk operations
  cacheTimeout: number;
  
  // Platform-specific settings
  platformConfig: Record<string, any>;
}

/**
 * Multi-platform connection manager
 */
export interface DraftRoomConnectionManager {
  connections: Map<string, DraftRoomConnection>;
  activeConnections: Set<string>;
  
  // Global settings
  maxConcurrentConnections: number;
  defaultSyncMode: SyncMode;
  globalTimeout: number;
  
  // Performance monitoring
  connectionStats: Map<string, ConnectionStats>;
  
  // Error handling
  errorRecovery: {
    enabled: boolean;
    maxRetries: number;
    backoffMultiplier: number;
  };
}

// ========================================
// REAL-TIME DRAFT SYNCHRONIZATION
// ========================================

/**
 * Live draft event types
 */
export type DraftEventType = 
  | 'draft_started'
  | 'draft_paused'
  | 'draft_resumed'
  | 'draft_completed'
  | 'pick_made'
  | 'pick_pending'
  | 'timer_started'
  | 'timer_warning'
  | 'timer_expired'
  | 'turn_changed'
  | 'trade_proposed'
  | 'trade_accepted'
  | 'trade_declined'
  | 'user_joined'
  | 'user_left'
  | 'connection_lost'
  | 'connection_restored'
  | 'sync_error'
  | 'data_updated';

/**
 * Live draft event data structure
 */
export interface DraftEvent {
  // Event identification
  id: string;
  type: DraftEventType;
  timestamp: Date;
  
  // Source information
  platform: DraftPlatform;
  leagueId: string;
  draftId?: string;
  
  // Event payload
  data: {
    // Pick-related events
    pick?: {
      round: number;
      pickNumber: number;
      overallPick: number;
      teamId: string;
      playerId?: string;
      timeRemaining?: number;
    };
    
    // Timer events
    timer?: {
      duration: number;
      remaining: number;
      isWarning: boolean;
    };
    
    // User events
    user?: {
      userId: string;
      username: string;
      teamId?: string;
      action: string;
    };
    
    // Trade events
    trade?: {
      tradeId: string;
      fromTeamId: string;
      toTeamId: string;
      players: string[];
      picks: number[];
      status: 'proposed' | 'accepted' | 'declined' | 'expired';
    };
    
    // Generic data update
    update?: {
      entity: 'rosters' | 'settings' | 'standings' | 'schedule';
      changes: Record<string, any>;
    };
    
    // Error information
    error?: {
      code: string;
      message: string;
      retryable: boolean;
      details?: Record<string, any>;
    };
  };
  
  // Processing metadata
  processed: boolean;
  retryCount: number;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Real-time draft synchronization state
 */
export interface DraftSyncState {
  // Connection state
  platform: DraftPlatform;
  leagueId: string;
  connectionStatus: ConnectionStatus;
  lastSyncTime: Date;
  
  // Event stream
  eventQueue: DraftEvent[];
  lastEventId?: string;
  totalEventsProcessed: number;
  
  // Sync health
  syncErrors: string[];
  consecutiveErrors: number;
  lastErrorTime?: Date;
  
  // Performance metrics
  averageLatency: number;
  eventsPerMinute: number;
  dataConsistency: number; // 0-100 percentage
  
  // WebSocket state (if applicable)
  websocket?: {
    url: string;
    readyState: number;
    lastPingTime?: Date;
    reconnectAttempts: number;
  };
  
  // Polling state (if applicable)
  polling?: {
    interval: number;
    lastPollTime: Date;
    consecutiveFailures: number;
  };
}

// ========================================
// LIVE DRAFT STATE MANAGEMENT
// ========================================

/**
 * Current draft turn information
 */
export interface DraftTurn {
  // Current pick details
  currentPick: {
    round: number;
    pickNumber: number;
    overallPick: number;
    teamId: string;
    userId?: string;
    timeRemaining?: number;
  };
  
  // Upcoming picks
  nextPicks: Array<{
    round: number;
    pickNumber: number;
    overallPick: number;
    teamId: string;
  }>;
  
  // Timer state
  timer: {
    isActive: boolean;
    duration: number; // total seconds
    remaining: number; // seconds left
    isWarning: boolean; // < 30 seconds typically
    isPaused: boolean;
  };
  
  // Turn context
  isUserTurn: boolean;
  canMakePick: boolean;
  availableActions: ('pick' | 'trade' | 'pause' | 'skip')[];
}

/**
 * Live draft board state
 */
export interface LiveDraftBoard {
  // Draft metadata
  draftId: string;
  leagueId: string;
  platform: DraftPlatform;
  
  // Draft configuration
  settings: {
    draftType: 'snake' | 'linear' | 'auction';
    rounds: number;
    teamCount: number;
    pickTimeLimit: number; // seconds
    tradingEnabled: boolean;
    pauseEnabled: boolean;
  };
  
  // Current state
  status: 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  currentTurn: DraftTurn;
  
  // Draft progress
  completedPicks: DraftPick[];
  availablePlayers: Player[];
  draftedPlayers: Set<string>; // player IDs
  
  // Participant information
  participants: Array<{
    teamId: string;
    teamName: string;
    userId: string;
    username: string;
    isOnline: boolean;
    lastActivity?: Date;
    draftPosition: number;
    autopickEnabled: boolean;
  }>;
  
  // Real-time updates
  lastUpdateTime: Date;
  pendingUpdates: number;
  syncStatus: ConnectionStatus;
}

/**
 * Draft room UI state management
 */
export interface DraftRoomUIState {
  // View state
  activeView: 'board' | 'available' | 'rosters' | 'chat' | 'trades';
  sidebarCollapsed: boolean;
  fullScreenMode: boolean;
  
  // Filtering and search
  playerSearch: string;
  positionFilter: Position | 'ALL';
  tierFilter: number[];
  teamFilter: string[];
  
  // Selection state
  selectedPlayer?: Player;
  selectedTeam?: string;
  compareMode: boolean;
  selectedForComparison: Set<string>; // player IDs
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: Date;
    dismissed: boolean;
  }>;
  
  // Loading states
  isLoading: boolean;
  loadingStates: {
    connecting: boolean;
    authenticating: boolean;
    syncing: boolean;
    makingPick: boolean;
    proposingTrade: boolean;
  };
  
  // Error states
  errors: {
    connection?: string;
    authentication?: string;
    sync?: string;
    general?: string;
  };
  
  // Modal states
  modals: {
    confirmPick: boolean;
    tradePropsal: boolean;
    draftSettings: boolean;
    connectionStatus: boolean;
  };
}

// ========================================
// DRAFT EVENTS AND WEBHOOKS
// ========================================

/**
 * WebSocket message types for real-time updates
 */
export type WebSocketMessageType = 
  | 'ping'
  | 'pong'
  | 'subscribe'
  | 'unsubscribe'
  | 'draft_event'
  | 'roster_update'
  | 'chat_message'
  | 'user_status'
  | 'error'
  | 'heartbeat';

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  id: string;
  timestamp: Date;
  
  // Subscription info
  channel?: string;
  leagueId?: string;
  
  // Message payload
  payload: {
    event?: DraftEvent;
    roster?: any;
    chat?: {
      userId: string;
      username: string;
      message: string;
      timestamp: Date;
    };
    userStatus?: {
      userId: string;
      isOnline: boolean;
      lastActivity: Date;
    };
    error?: {
      code: string;
      message: string;
      retryable: boolean;
    };
    heartbeat?: {
      serverTime: Date;
      connectionCount: number;
    };
  };
}

/**
 * Webhook configuration for external integrations
 */
export interface WebhookConfig {
  url: string;
  events: DraftEventType[];
  secret?: string;
  headers?: Record<string, string>;
  
  // Delivery settings
  retryAttempts: number;
  retryBackoff: number;
  timeout: number;
  
  // Filtering
  filters: {
    platforms?: DraftPlatform[];
    leagueIds?: string[];
    users?: string[];
  };
  
  // Status
  enabled: boolean;
  lastDelivery?: Date;
  failureCount: number;
}

// ========================================
// CROSS-PLATFORM DATA NORMALIZATION
// ========================================

/**
 * Normalized draft data structure (platform-agnostic)
 */
export interface NormalizedDraftData {
  // Core identification
  draftId: string;
  leagueId: string;
  platform: DraftPlatform;
  
  // Draft metadata
  name: string;
  season: number;
  draftType: 'snake' | 'linear' | 'auction';
  status: 'scheduled' | 'in_progress' | 'paused' | 'completed';
  
  // Timing
  scheduledStart?: Date;
  actualStart?: Date;
  completedAt?: Date;
  estimatedDuration?: number; // minutes
  
  // Configuration
  settings: {
    rounds: number;
    teams: number;
    pickTimeLimit: number;
    tradingEnabled: boolean;
    autopickEnabled: boolean;
    pauseEnabled: boolean;
    
    // Roster requirements
    rosterSlots: Record<Position, number>;
    benchSlots: number;
    totalSlots: number;
  };
  
  // Teams and participants
  teams: Array<{
    id: string;
    name: string;
    owner: {
      id: string;
      name: string;
      email?: string;
    };
    draftPosition: number;
    roster: Player[];
    autopickEnabled: boolean;
    isOnline: boolean;
  }>;
  
  // Draft order and picks
  draftOrder: string[]; // team IDs in order
  picks: DraftPick[];
  currentPick?: number; // overall pick number
  
  // Available players
  playerPool: Player[];
  draftedPlayerIds: Set<string>;
  
  // Platform-specific raw data
  rawData: Record<string, any>;
  
  // Normalization metadata
  normalizedAt: Date;
  dataVersion: string;
  mappingErrors: string[];
}

/**
 * Platform data mapping configuration
 */
export interface PlatformMapping {
  platform: DraftPlatform;
  
  // Field mappings (platform field -> normalized field)
  fieldMappings: {
    league: Record<string, string>;
    team: Record<string, string>;
    player: Record<string, string>;
    pick: Record<string, string>;
    settings: Record<string, string>;
  };
  
  // Value transformations
  transformers: {
    positions: (platformValue: any) => Position;
    draftStatus: (platformValue: any) => string;
    playerStatus: (platformValue: any) => string;
    pickTime: (platformValue: any) => Date;
  };
  
  // Default values for missing data
  defaults: {
    pickTimeLimit: number;
    rosterSlots: Record<Position, number>;
    benchSlots: number;
  };
  
  // Validation rules
  validators: {
    requiredFields: string[];
    fieldTypes: Record<string, string>;
    customValidations: Array<{
      field: string;
      validator: (value: any) => boolean;
      errorMessage: string;
    }>;
  };
}

// ========================================
// ERROR HANDLING AND RESILIENCE
// ========================================

/**
 * Draft room error types
 */
export type DraftRoomErrorType = 
  | 'connection_failed'
  | 'authentication_failed' 
  | 'authorization_denied'
  | 'rate_limited'
  | 'timeout'
  | 'invalid_data'
  | 'sync_conflict'
  | 'websocket_error'
  | 'api_error'
  | 'network_error'
  | 'parsing_error'
  | 'validation_error'
  | 'unknown_error';

/**
 * Structured error information
 */
export interface DraftRoomError {
  type: DraftRoomErrorType;
  code: string;
  message: string;
  details?: Record<string, any>;
  
  // Context
  platform: DraftPlatform;
  leagueId?: string;
  operation?: string;
  timestamp: Date;
  
  // Recovery information
  retryable: boolean;
  retryAfter?: number; // seconds
  suggestedAction?: string;
  
  // Technical details
  httpStatus?: number;
  originalError?: any;
  stackTrace?: string;
  
  // User-facing information
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
  errorType: DraftRoomErrorType;
  
  // Retry configuration
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
  
  // Recovery actions
  actions: Array<{
    name: string;
    description: string;
    automatic: boolean;
    handler: (error: DraftRoomError) => Promise<boolean>;
  }>;
  
  // Fallback behavior
  fallbackMode?: 'offline' | 'manual' | 'read_only';
  escalationThreshold: number; // consecutive failures
}

// ========================================
// PERFORMANCE AND MONITORING
// ========================================

/**
 * Connection performance statistics
 */
export interface ConnectionStats {
  platform: DraftPlatform;
  leagueId: string;
  
  // Timing metrics
  connectionTime: number; // milliseconds to connect
  averageLatency: number; // milliseconds
  lastResponseTime: number;
  
  // Request statistics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  
  // Data transfer
  bytesTransferred: number;
  eventsReceived: number;
  lastEventTime: Date;
  
  // Error tracking
  errorRate: number; // percentage
  commonErrors: Record<string, number>;
  
  // Uptime tracking
  connectedSince: Date;
  totalUptime: number; // milliseconds
  disconnectionCount: number;
}

/**
 * Draft room performance monitor
 */
export interface DraftRoomMonitor {
  // Overall health
  isHealthy: boolean;
  healthScore: number; // 0-100
  
  // Connection monitoring
  connections: Map<string, ConnectionStats>;
  
  // Performance metrics
  metrics: {
    averageConnectionTime: number;
    averageLatency: number;
    overallErrorRate: number;
    dataConsistency: number;
    
    // Resource usage
    memoryUsage: number; // MB
    cpuUsage: number; // percentage
    networkBandwidth: number; // KB/s
  };
  
  // Alerts and thresholds
  alerts: Array<{
    type: 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
  
  thresholds: {
    maxLatency: number;
    maxErrorRate: number;
    minHealthScore: number;
  };
}

// ========================================
// COMPONENT INTERFACE PROPS
// ========================================

/**
 * Props for DraftRoomConnector component
 */
export interface DraftRoomConnectorProps {
  // Configuration
  platform: DraftPlatform;
  leagueUrl: string;
  credentials?: Partial<DraftRoomCredentials>;
  
  // Connection behavior
  autoConnect?: boolean;
  syncMode?: SyncMode;
  enableNotifications?: boolean;
  
  // Event handlers
  onConnectionStatus?: (status: ConnectionStatus) => void;
  onDraftEvent?: (event: DraftEvent) => void;
  onAuthRequired?: (platform: DraftPlatform) => void;
  onError?: (error: DraftRoomError) => void;
  
  // UI customization
  showConnectionStatus?: boolean;
  showSyncIndicator?: boolean;
  className?: string;
  
  // Advanced configuration
  connectionConfig?: Partial<DraftRoomConnection>;
  errorRecovery?: Partial<ErrorRecoveryStrategy>;
}

/**
 * Props for LiveDraftBoard component
 */
export interface LiveDraftBoardProps {
  // Data
  draftData: LiveDraftBoard;
  availablePlayers: Player[];
  
  // User interaction
  currentUserId: string;
  canMakePicks: boolean;
  
  // Event handlers
  onPlayerSelect?: (player: Player) => void;
  onMakePick?: (playerId: string) => Promise<void>;
  onProposeTrade?: (proposal: any) => Promise<void>;
  onPlayerFilter?: (filters: any) => void;
  
  // UI configuration
  showTimer?: boolean;
  showChat?: boolean;
  enableTrading?: boolean;
  
  // Customization
  theme?: 'light' | 'dark' | 'auto';
  layout?: 'compact' | 'standard' | 'expanded';
  className?: string;
}

/**
 * Props for DraftRoomAuth component
 */
export interface DraftRoomAuthProps {
  platform: DraftPlatform;
  leagueId: string;
  
  // Authentication flow
  onAuthSuccess?: (credentials: DraftRoomCredentials) => void;
  onAuthFailure?: (error: DraftRoomError) => void;
  onCancel?: () => void;
  
  // UI configuration
  showRememberMe?: boolean;
  allowGuestMode?: boolean;
  
  // Pre-filled data
  initialCredentials?: Partial<DraftRoomCredentials>;
  
  // Styling
  className?: string;
  theme?: 'light' | 'dark';
}

// ========================================
// INTEGRATION TYPES
// ========================================

/**
 * Draft room service interface for dependency injection
 */
export interface DraftRoomService {
  // Connection management
  connect(config: DraftRoomConnection): Promise<ConnectionStatus>;
  disconnect(leagueId: string): Promise<void>;
  reconnect(leagueId: string): Promise<ConnectionStatus>;
  
  // Authentication
  authenticate(credentials: DraftRoomCredentials): Promise<AuthSession>;
  refreshAuth(sessionId: string): Promise<AuthSession>;
  logout(sessionId: string): Promise<void>;
  
  // Draft operations
  getDraftData(leagueId: string): Promise<NormalizedDraftData>;
  makePick(leagueId: string, playerId: string): Promise<DraftPick>;
  pauseDraft(leagueId: string): Promise<void>;
  resumeDraft(leagueId: string): Promise<void>;
  
  // Real-time sync
  subscribeToEvents(leagueId: string, callback: (event: DraftEvent) => void): () => void;
  enableSync(leagueId: string, mode: SyncMode): void;
  disableSync(leagueId: string): void;
  
  // Utilities
  validateURL(url: string): DraftRoomURL;
  parseURL(url: string, platform?: DraftPlatform): DraftRoomURL;
  normalizeData(rawData: any, platform: DraftPlatform): NormalizedDraftData;
}

/**
 * Draft room provider context
 */
export interface DraftRoomContextValue {
  // Current state
  connections: Map<string, DraftRoomConnection>;
  activeDrafts: Map<string, LiveDraftBoard>;
  authSessions: Map<string, AuthSession>;
  
  // Actions
  connectToDraft: (config: DraftRoomConnection) => Promise<void>;
  disconnectFromDraft: (leagueId: string) => Promise<void>;
  makePick: (leagueId: string, playerId: string) => Promise<void>;
  
  // State queries
  isConnected: (leagueId: string) => boolean;
  getConnectionStatus: (leagueId: string) => ConnectionStatus;
  getCurrentTurn: (leagueId: string) => DraftTurn | null;
  
  // Event subscription
  subscribe: (leagueId: string, callback: (event: DraftEvent) => void) => () => void;
  
  // Error handling
  lastError?: DraftRoomError;
  clearError: () => void;
}

// ========================================
// UTILITY TYPES AND HELPERS
// ========================================

/**
 * Type guard for checking valid platform
 */
export const isDraftPlatform = (value: string): value is DraftPlatform => {
  return ['espn', 'nfl', 'yahoo', 'sleeper', 'cbs', 'fleaflicker'].includes(value);
};

/**
 * Type guard for checking valid connection status
 */
export const isConnectionStatus = (value: string): value is ConnectionStatus => {
  return ['disconnected', 'connecting', 'connected', 'reconnecting', 'error', 'expired', 'rate_limited'].includes(value);
};

/**
 * Type guard for validating draft event
 */
export const isDraftEvent = (obj: any): obj is DraftEvent => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    obj.timestamp instanceof Date &&
    typeof obj.platform === 'string' &&
    typeof obj.data === 'object'
  );
};

/**
 * Utility type for extracting platform-specific configuration
 */
export type PlatformSpecificConfig<T extends DraftPlatform> = 
  T extends 'espn' ? {
    swid: string;
    espnS2: string;
    leagueId: string;
  } :
  T extends 'yahoo' ? {
    consumerKey: string;
    consumerSecret: string;
    leagueKey: string;
  } :
  T extends 'sleeper' ? {
    leagueId: string;
    userId?: string;
  } :
  Record<string, any>;

/**
 * Conditional type for platform-specific methods
 */
export type PlatformMethods<T extends DraftPlatform> = {
  [K in T]: T extends 'espn' ? {
    getESPNLeagueInfo(): Promise<any>;
    validateESPNCredentials(): Promise<boolean>;
  } : T extends 'yahoo' ? {
    refreshYahooToken(): Promise<string>;
    getYahooUserLeagues(): Promise<any[]>;
  } : {};
}[T];

// ========================================
// CONSTANTS AND ENUMS
// ========================================

/**
 * Platform-specific URL patterns
 */
export const PLATFORM_URL_PATTERNS: Record<DraftPlatform, RegExp[]> = {
  espn: [
    /fantasy\.espn\.com\/football\/league\?leagueId=(\d+)/,
    /fantasy\.espn\.com\/football\/draft\?leagueId=(\d+)/
  ],
  nfl: [
    /fantasy\.nfl\.com\/league\/(\d+)/,
    /fantasy\.nfl\.com\/draft\/(\d+)/
  ],
  yahoo: [
    /football\.fantasysports\.yahoo\.com\/f1\/(\d+)/,
    /football\.fantasysports\.yahoo\.com\/league\/([^\/]+)/
  ],
  sleeper: [
    /sleeper\.app\/leagues\/([a-zA-Z0-9]+)/,
    /sleeper\.app\/draft\/([a-zA-Z0-9]+)/
  ],
  cbs: [
    /cbs\.com\/fantasy\/football\/leagues\/(\d+)/
  ],
  fleaflicker: [
    /fleaflicker\.com\/nfl\/leagues\/(\d+)/
  ]
};

/**
 * Default connection timeouts per platform (milliseconds)
 */
export const PLATFORM_TIMEOUTS: Record<DraftPlatform, number> = {
  espn: 30000,
  nfl: 25000,
  yahoo: 35000,
  sleeper: 20000,
  cbs: 30000,
  fleaflicker: 25000
};

/**
 * Platform capabilities matrix
 */
export const PLATFORM_CAPABILITIES: Record<DraftPlatform, {
  realTimeSync: boolean;
  websockets: boolean;
  trading: boolean;
  autopick: boolean;
  pauseDraft: boolean;
  guestAccess: boolean;
}> = {
  espn: {
    realTimeSync: true,
    websockets: false,
    trading: true,
    autopick: true,
    pauseDraft: true,
    guestAccess: false
  },
  nfl: {
    realTimeSync: true,
    websockets: false,
    trading: true,
    autopick: true,
    pauseDraft: false,
    guestAccess: true
  },
  yahoo: {
    realTimeSync: true,
    websockets: false,
    trading: true,
    autopick: true,
    pauseDraft: true,
    guestAccess: false
  },
  sleeper: {
    realTimeSync: true,
    websockets: true,
    trading: true,
    autopick: true,
    pauseDraft: true,
    guestAccess: true
  },
  cbs: {
    realTimeSync: true,
    websockets: false,
    trading: false,
    autopick: true,
    pauseDraft: false,
    guestAccess: false
  },
  fleaflicker: {
    realTimeSync: false,
    websockets: false,
    trading: true,
    autopick: false,
    pauseDraft: false,
    guestAccess: true
  }
};

// Export all types for easy importing
export * from './index';
export * from './LeagueTypes';
export * from './NFLLeagueTypes';