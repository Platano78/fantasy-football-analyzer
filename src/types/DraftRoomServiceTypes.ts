/**
 * Draft Room Service Implementation Types
 * 
 * Service layer interfaces, implementations, and factory patterns
 * for live draft room functionality. These types define the contracts
 * between different service layers and provide type safety for
 * dependency injection and service orchestration.
 */

import {
  DraftPlatform,
  ConnectionStatus,
  DraftEvent,
  DraftRoomConnection,
  DraftRoomCredentials,
  AuthSession,
  NormalizedDraftData,
  LiveDraftBoard,
  DraftRoomError,
  SyncMode,
  DraftRoomURL,
  ConnectionStats
} from './DraftRoomTypes';
import { Player, DraftPick } from './index';

// ========================================
// SERVICE FACTORY PATTERNS
// ========================================

/**
 * Factory for creating platform-specific draft services
 */
export interface DraftServiceFactory {
  /**
   * Create a draft service for specific platform
   */
  createService(platform: DraftPlatform): DraftPlatformService;
  
  /**
   * Get all supported platforms
   */
  getSupportedPlatforms(): DraftPlatform[];
  
  /**
   * Check if platform is supported
   */
  isPlatformSupported(platform: DraftPlatform): boolean;
  
  /**
   * Register custom platform implementation
   */
  registerPlatform(platform: DraftPlatform, serviceClass: new() => DraftPlatformService): void;
}

/**
 * Platform-specific service interface
 */
export interface DraftPlatformService {
  readonly platform: DraftPlatform;
  readonly capabilities: PlatformCapabilities;
  
  // Connection lifecycle
  connect(config: DraftRoomConnection): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionStatus(): ConnectionStatus;
  
  // Authentication
  authenticate(credentials: DraftRoomCredentials): Promise<AuthResult>;
  validateCredentials(credentials: DraftRoomCredentials): Promise<boolean>;
  refreshAuth(): Promise<AuthResult>;
  
  // Draft data operations
  fetchDraftData(): Promise<NormalizedDraftData>;
  makePick(playerId: string): Promise<DraftPickResult>;
  getAvailablePlayers(): Promise<Player[]>;
  
  // Real-time synchronization
  enableRealTimeSync(mode: SyncMode): Promise<void>;
  disableRealTimeSync(): Promise<void>;
  subscribeToEvents(callback: DraftEventCallback): UnsubscribeFunction;
  
  // Platform-specific operations
  platformSpecificOperation(operation: string, params?: any): Promise<any>;
  
  // Monitoring and diagnostics
  getConnectionStats(): ConnectionStats;
  performHealthCheck(): Promise<HealthCheckResult>;
}

// ========================================
// RESULT TYPES
// ========================================

/**
 * Connection attempt result
 */
export interface ConnectionResult {
  success: boolean;
  status: ConnectionStatus;
  sessionId?: string;
  error?: DraftRoomError;
  metadata: {
    connectionTime: number;
    serverVersion?: string;
    capabilities?: string[];
    warnings?: string[];
  };
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: DraftRoomError;
  requiresTwoFactor?: boolean;
  metadata: {
    expiresAt?: Date;
    permissions?: string[];
    userInfo?: {
      id: string;
      username: string;
      email?: string;
    };
  };
}

/**
 * Draft pick operation result
 */
export interface DraftPickResult {
  success: boolean;
  pick?: DraftPick;
  error?: DraftRoomError;
  warnings?: string[];
  metadata: {
    processingTime: number;
    pickConfirmed: boolean;
    nextPickInfo?: {
      teamId: string;
      timeLimit: number;
    };
  };
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    connectivity: boolean;
    authentication: boolean;
    dataAccess: boolean;
    realTimeSync: boolean;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    lastError?: string;
  };
  timestamp: Date;
}

// ========================================
// CALLBACK AND EVENT TYPES
// ========================================

/**
 * Draft event callback function type
 */
export type DraftEventCallback = (event: DraftEvent) => void | Promise<void>;

/**
 * Unsubscribe function for event listeners
 */
export type UnsubscribeFunction = () => void;

/**
 * Connection status change callback
 */
export type ConnectionStatusCallback = (
  platform: DraftPlatform,
  leagueId: string,
  status: ConnectionStatus,
  error?: DraftRoomError
) => void;

// ========================================
// SERVICE ORCHESTRATION
// ========================================

/**
 * Multi-platform draft room orchestrator
 */
export interface DraftRoomOrchestrator {
  // Service management
  registerService(platform: DraftPlatform, service: DraftPlatformService): void;
  getService(platform: DraftPlatform): DraftPlatformService | null;
  
  // Multi-league operations
  connectToMultipleRooms(connections: DraftRoomConnection[]): Promise<ConnectionResult[]>;
  disconnectFromAllRooms(): Promise<void>;
  
  // Cross-platform synchronization
  syncAllConnections(): Promise<void>;
  broadcastEvent(event: DraftEvent): Promise<void>;
  
  // Aggregate data
  getAllDraftBoards(): Map<string, LiveDraftBoard>;
  getGlobalConnectionStatus(): Map<string, ConnectionStatus>;
  
  // Event coordination
  subscribeToAllEvents(callback: DraftEventCallback): UnsubscribeFunction;
  onConnectionStatusChange(callback: ConnectionStatusCallback): UnsubscribeFunction;
}

/**
 * Service configuration registry
 */
export interface ServiceConfigRegistry {
  // Configuration management
  setConfig(platform: DraftPlatform, config: PlatformServiceConfig): void;
  getConfig(platform: DraftPlatform): PlatformServiceConfig;
  updateConfig(platform: DraftPlatform, updates: Partial<PlatformServiceConfig>): void;
  
  // Default configurations
  getDefaultConfig(platform: DraftPlatform): PlatformServiceConfig;
  resetToDefaults(platform: DraftPlatform): void;
  
  // Validation
  validateConfig(platform: DraftPlatform, config: PlatformServiceConfig): ValidationResult;
}

// ========================================
// CONFIGURATION TYPES
// ========================================

/**
 * Platform-specific service configuration
 */
export interface PlatformServiceConfig {
  // Connection settings
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  
  // Authentication
  authEndpoint?: string;
  authMethod: 'basic' | 'oauth' | 'token' | 'session';
  tokenRefreshThreshold: number; // minutes before expiry
  
  // Sync configuration
  defaultSyncMode: SyncMode;
  syncInterval: number; // milliseconds
  maxEventQueueSize: number;
  
  // Rate limiting
  rateLimit: {
    requestsPerMinute: number;
    burstAllowance: number;
  };
  
  // Platform-specific settings
  platformSettings: Record<string, any>;
  
  // Feature flags
  features: {
    realTimeSync: boolean;
    websockets: boolean;
    backgroundSync: boolean;
    offlineMode: boolean;
  };
}

/**
 * Platform capabilities descriptor
 */
export interface PlatformCapabilities {
  // Core features
  supportsRealTime: boolean;
  supportsWebSockets: boolean;
  supportsPolling: boolean;
  supportsAuthentication: boolean;
  
  // Draft operations
  canMakePicks: boolean;
  canPauseDraft: boolean;
  canResumeDraft: boolean;
  canProposeTrades: boolean;
  
  // Data access
  providesRosterData: boolean;
  providesPlayerPool: boolean;
  providesHistoricalData: boolean;
  providesProjections: boolean;
  
  // Limitations
  maxConcurrentConnections: number;
  rateLimits: {
    requestsPerMinute: number;
    connectionsPerHour: number;
  };
  
  // API versions supported
  supportedApiVersions: string[];
  currentApiVersion: string;
}

/**
 * Validation result for configurations
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

// ========================================
// CACHING AND STORAGE
// ========================================

/**
 * Draft data cache interface
 */
export interface DraftDataCache {
  // Basic cache operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // Draft-specific caching
  cacheDraftBoard(leagueId: string, board: LiveDraftBoard): Promise<void>;
  getCachedDraftBoard(leagueId: string): Promise<LiveDraftBoard | null>;
  
  // Player data caching
  cacheAvailablePlayers(leagueId: string, players: Player[]): Promise<void>;
  getCachedAvailablePlayers(leagueId: string): Promise<Player[] | null>;
  
  // Event caching
  cacheEvents(leagueId: string, events: DraftEvent[]): Promise<void>;
  getCachedEvents(leagueId: string, since?: Date): Promise<DraftEvent[]>;
  
  // Cache management
  invalidate(pattern: string): Promise<void>;
  getStats(): Promise<CacheStats>;
  optimize(): Promise<void>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  itemCount: number;
  hitRate: number;
  missRate: number;
  memoryUsage: number; // bytes
  oldestEntry: Date;
  newestEntry: Date;
}

/**
 * Persistent storage interface for draft data
 */
export interface DraftStorage {
  // Draft history
  saveDraftHistory(leagueId: string, history: DraftPick[]): Promise<void>;
  loadDraftHistory(leagueId: string): Promise<DraftPick[]>;
  
  // Connection configurations
  saveConnectionConfig(leagueId: string, config: DraftRoomConnection): Promise<void>;
  loadConnectionConfig(leagueId: string): Promise<DraftRoomConnection | null>;
  
  // Authentication sessions
  saveAuthSession(sessionId: string, session: AuthSession): Promise<void>;
  loadAuthSession(sessionId: string): Promise<AuthSession | null>;
  removeAuthSession(sessionId: string): Promise<void>;
  
  // User preferences
  saveUserPreferences(userId: string, preferences: DraftUserPreferences): Promise<void>;
  loadUserPreferences(userId: string): Promise<DraftUserPreferences>;
  
  // Storage management
  cleanup(olderThan: Date): Promise<number>; // returns count of cleaned items
  export(format: 'json' | 'csv'): Promise<string>;
  import(data: string, format: 'json' | 'csv'): Promise<void>;
}

// ========================================
// USER PREFERENCES AND SETTINGS
// ========================================

/**
 * User preferences for draft rooms
 */
export interface DraftUserPreferences {
  userId: string;
  
  // UI preferences
  ui: {
    theme: 'light' | 'dark' | 'auto';
    layout: 'compact' | 'standard' | 'expanded';
    showNotifications: boolean;
    soundEnabled: boolean;
    autoRefresh: boolean;
  };
  
  // Draft preferences
  drafting: {
    defaultSyncMode: SyncMode;
    autoPickWarningTime: number; // seconds
    enableKeyboardShortcuts: boolean;
    confirmPicks: boolean;
    highlightMyTurn: boolean;
  };
  
  // Platform-specific preferences
  platformPreferences: Record<DraftPlatform, {
    rememberCredentials: boolean;
    defaultLeagueId?: string;
    autoConnect: boolean;
    enableRealTimeSync: boolean;
  }>;
  
  // Notification preferences
  notifications: {
    myTurn: boolean;
    timerWarning: boolean;
    playerDrafted: boolean;
    connectionIssues: boolean;
    tradeProposals: boolean;
  };
  
  // Privacy settings
  privacy: {
    shareActivity: boolean;
    allowRemoteAccess: boolean;
    logUserActions: boolean;
  };
  
  // Last updated
  lastModified: Date;
}

// ========================================
// MONITORING AND ANALYTICS
// ========================================

/**
 * Draft room analytics collector
 */
export interface DraftAnalytics {
  // Usage tracking
  trackConnection(platform: DraftPlatform, leagueId: string, success: boolean): void;
  trackPickMade(leagueId: string, playerId: string, timeToDecide: number): void;
  trackError(error: DraftRoomError): void;
  
  // Performance tracking
  trackResponseTime(platform: DraftPlatform, operation: string, duration: number): void;
  trackCacheHit(cacheKey: string): void;
  trackCacheMiss(cacheKey: string): void;
  
  // User behavior
  trackUserAction(userId: string, action: string, context?: Record<string, any>): void;
  trackFeatureUsage(feature: string, userId?: string): void;
  
  // Data collection
  getUsageStats(timeRange: TimeRange): Promise<UsageStats>;
  getPerformanceMetrics(platform?: DraftPlatform): Promise<PerformanceMetrics>;
  getErrorReport(timeRange: TimeRange): Promise<ErrorReport>;
  
  // Export capabilities
  exportAnalytics(format: 'json' | 'csv', timeRange: TimeRange): Promise<string>;
}

/**
 * Time range for analytics queries
 */
export interface TimeRange {
  start: Date;
  end: Date;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Usage statistics
 */
export interface UsageStats {
  timeRange: TimeRange;
  
  // Connection stats
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  uniqueUsers: number;
  
  // Platform breakdown
  platformUsage: Record<DraftPlatform, {
    connections: number;
    users: number;
    averageSessionDuration: number;
  }>;
  
  // Activity patterns
  peakUsageHours: number[];
  averageSessionDuration: number;
  totalPicksMade: number;
  totalEventsProcessed: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  // Response times
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // Error rates
  errorRate: number;
  timeoutRate: number;
  
  // Cache performance
  cacheHitRate: number;
  cacheMissRate: number;
  cacheSize: number;
  
  // Resource usage
  memoryUsage: number;
  cpuUsage: number;
  networkBandwidth: number;
  
  // Platform-specific metrics
  platformMetrics: Record<DraftPlatform, {
    connectionSuccessRate: number;
    averageLatency: number;
    errorCount: number;
  }>;
}

/**
 * Error reporting
 */
export interface ErrorReport {
  timeRange: TimeRange;
  
  // Error summary
  totalErrors: number;
  uniqueErrors: number;
  errorRate: number;
  
  // Error breakdown
  errorsByType: Record<string, number>;
  errorsByPlatform: Record<DraftPlatform, number>;
  
  // Top errors
  topErrors: Array<{
    type: string;
    message: string;
    count: number;
    firstSeen: Date;
    lastSeen: Date;
    affectedUsers: number;
  }>;
  
  // Resolution status
  resolvedErrors: number;
  unresolvedErrors: number;
  
  // Impact analysis
  impactAnalysis: {
    highImpactErrors: number;
    usersAffected: number;
    sessionsImpacted: number;
  };
}

// ========================================
// TESTING AND MOCKING
// ========================================

/**
 * Mock draft service for testing
 */
export interface MockDraftService extends DraftPlatformService {
  // Mock control methods
  setConnectionResult(result: ConnectionResult): void;
  setAuthResult(result: AuthResult): void;
  setDraftData(data: NormalizedDraftData): void;
  
  // Event simulation
  simulateEvent(event: DraftEvent): void;
  simulatePick(playerId: string, teamId: string): void;
  simulateError(error: DraftRoomError): void;
  
  // State inspection
  getCallHistory(): MockCallHistory[];
  getEventHistory(): DraftEvent[];
  reset(): void;
}

/**
 * Mock call history for testing
 */
export interface MockCallHistory {
  method: string;
  args: any[];
  timestamp: Date;
  result?: any;
  error?: Error;
}

/**
 * Test utilities for draft room functionality
 */
export interface DraftRoomTestUtils {
  // Mock creation
  createMockService(platform: DraftPlatform): MockDraftService;
  createMockConnection(overrides?: Partial<DraftRoomConnection>): DraftRoomConnection;
  createMockDraftBoard(overrides?: Partial<LiveDraftBoard>): LiveDraftBoard;
  
  // Data generators
  generateMockPlayers(count: number): Player[];
  generateMockEvents(count: number): DraftEvent[];
  generateMockPicks(count: number): DraftPick[];
  
  // Assertion helpers
  expectConnectionStatus(service: DraftPlatformService, status: ConnectionStatus): void;
  expectEventReceived(events: DraftEvent[], eventType: string): void;
  expectNoErrors(service: DraftPlatformService): void;
}

// ========================================
// EXTENSION POINTS
// ========================================

/**
 * Plugin interface for extending draft room functionality
 */
export interface DraftRoomPlugin {
  name: string;
  version: string;
  
  // Lifecycle hooks
  initialize(orchestrator: DraftRoomOrchestrator): Promise<void>;
  onConnectionEstablished(platform: DraftPlatform, leagueId: string): Promise<void>;
  onEventReceived(event: DraftEvent): Promise<void>;
  onPickMade(pick: DraftPick): Promise<void>;
  cleanup(): Promise<void>;
  
  // Optional platform extensions
  extendPlatformService?(platform: DraftPlatform, service: DraftPlatformService): DraftPlatformService;
  
  // Configuration
  getConfiguration(): PluginConfiguration;
  updateConfiguration(config: Partial<PluginConfiguration>): void;
}

/**
 * Plugin configuration
 */
export interface PluginConfiguration {
  enabled: boolean;
  priority: number; // execution order
  settings: Record<string, any>;
  platforms: DraftPlatform[]; // which platforms this plugin supports
  
  // Feature flags
  features: {
    modifiesEvents: boolean;
    requiresAuthentication: boolean;
    hasUI: boolean;
    storesData: boolean;
  };
}

/**
 * Plugin registry
 */
export interface PluginRegistry {
  // Plugin management
  register(plugin: DraftRoomPlugin): void;
  unregister(pluginName: string): void;
  getPlugin(name: string): DraftRoomPlugin | null;
  
  // Plugin lifecycle
  initializeAll(): Promise<void>;
  cleanupAll(): Promise<void>;
  
  // Event distribution
  distributeEvent(event: DraftEvent): Promise<void>;
  distributePickMade(pick: DraftPick): Promise<void>;
  
  // Plugin queries
  getLoadedPlugins(): DraftRoomPlugin[];
  getPluginsByPlatform(platform: DraftPlatform): DraftRoomPlugin[];
}

// ========================================
// TYPE EXPORTS
// ========================================

// Re-export core types for convenience
export type {
  DraftPlatform,
  ConnectionStatus,
  DraftEvent,
  DraftRoomConnection,
  DraftRoomCredentials,
  AuthSession,
  NormalizedDraftData,
  LiveDraftBoard,
  DraftRoomError,
  SyncMode,
  DraftRoomURL,
  ConnectionStats
} from './DraftRoomTypes';