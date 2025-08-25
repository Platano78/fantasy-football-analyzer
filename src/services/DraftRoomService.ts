/**
 * Draft Room Service Implementation Example
 * 
 * Comprehensive service implementation demonstrating how to use the
 * draft room types and interfaces. This serves as a reference implementation
 * for connecting to multiple fantasy football platforms and managing
 * real-time draft synchronization.
 * 
 * NOTE: This is a TypeScript interface and example implementation.
 * Actual platform-specific APIs would need to be integrated separately.
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
  DraftTurn,
  WebSocketMessage,
  AuthStatus,
  DraftEventType
} from '../types/DraftRoomTypes';

import {
  DraftServiceFactory,
  DraftPlatformService,
  DraftRoomOrchestrator,
  ConnectionResult,
  AuthResult,
  DraftPickResult,
  HealthCheckResult,
  DraftEventCallback,
  UnsubscribeFunction,
  PlatformCapabilities,
  ConnectionStatusCallback
} from '../types/DraftRoomServiceTypes';

import { Player, DraftPick } from '../types/index';
import { parseURL, validateURL, detectPlatform } from '../utils/draftRoomUrlParser';

// ========================================
// DRAFT SERVICE FACTORY IMPLEMENTATION
// ========================================

/**
 * Factory for creating platform-specific draft services
 */
export class DraftServiceFactoryImpl implements DraftServiceFactory {
  private serviceRegistry = new Map<DraftPlatform, new() => DraftPlatformService>();
  private serviceInstances = new Map<DraftPlatform, DraftPlatformService>();

  constructor() {
    // Register default platform implementations
    this.registerPlatform('espn', ESPNDraftService);
    this.registerPlatform('sleeper', SleeperDraftService);
    this.registerPlatform('yahoo', YahooDraftService);
    this.registerPlatform('nfl', NFLDraftService);
    // Add more platforms as needed
  }

  createService(platform: DraftPlatform): DraftPlatformService {
    // Return cached instance if available
    if (this.serviceInstances.has(platform)) {
      return this.serviceInstances.get(platform)!;
    }

    const ServiceClass = this.serviceRegistry.get(platform);
    if (!ServiceClass) {
      throw new Error(`No service implementation found for platform: ${platform}`);
    }

    const service = new ServiceClass();
    this.serviceInstances.set(platform, service);
    return service;
  }

  getSupportedPlatforms(): DraftPlatform[] {
    return Array.from(this.serviceRegistry.keys());
  }

  isPlatformSupported(platform: DraftPlatform): boolean {
    return this.serviceRegistry.has(platform);
  }

  registerPlatform(platform: DraftPlatform, serviceClass: new() => DraftPlatformService): void {
    this.serviceRegistry.set(platform, serviceClass);
    // Clear cached instance if exists
    this.serviceInstances.delete(platform);
  }
}

// ========================================
// ABSTRACT BASE PLATFORM SERVICE
// ========================================

/**
 * Abstract base class for platform-specific services
 */
abstract class BaseDraftPlatformService implements DraftPlatformService {
  abstract readonly platform: DraftPlatform;
  abstract readonly capabilities: PlatformCapabilities;

  protected connectionStatus: ConnectionStatus = 'disconnected';
  protected currentConnection?: DraftRoomConnection;
  protected authSession?: AuthSession;
  protected eventListeners: Set<DraftEventCallback> = new Set();
  protected syncInterval?: number;
  protected websocket?: WebSocket;

  // Connection lifecycle
  async connect(config: DraftRoomConnection): Promise<ConnectionResult> {
    const startTime = Date.now();
    
    try {
      this.connectionStatus = 'connecting';
      this.currentConnection = config;

      // Validate URL
      const parsedUrl = validateURL(config.url.originalUrl, this.platform);
      if (!parsedUrl.isValid) {
        throw new Error(`Invalid URL: ${parsedUrl.validationErrors.join(', ')}`);
      }

      // Authenticate if credentials provided
      if (config.credentials.username || config.credentials.accessToken) {
        const authResult = await this.authenticate(config.credentials);
        if (!authResult.success) {
          throw new Error(`Authentication failed: ${authResult.error?.message}`);
        }
      }

      // Platform-specific connection logic
      await this.establishConnection(config);

      // Setup synchronization
      if (config.enableRealTimeUpdates) {
        await this.enableRealTimeSync(config.syncMode);
      }

      this.connectionStatus = 'connected';
      
      return {
        success: true,
        status: this.connectionStatus,
        sessionId: this.authSession?.sessionToken,
        metadata: {
          connectionTime: Date.now() - startTime,
          serverVersion: await this.getServerVersion().catch(() => undefined),
          capabilities: this.getCapabilityList(),
          warnings: []
        }
      };

    } catch (error) {
      this.connectionStatus = 'error';
      const draftError = this.createDraftError('connection_failed', error);
      
      return {
        success: false,
        status: this.connectionStatus,
        error: draftError,
        metadata: {
          connectionTime: Date.now() - startTime,
          warnings: []
        }
      };
    }
  }

  async disconnect(): Promise<void> {
    this.connectionStatus = 'disconnected';
    
    // Cleanup WebSocket
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }

    // Cleanup polling
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }

    // Clear listeners
    this.eventListeners.clear();

    // Platform-specific cleanup
    await this.cleanupConnection();
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // Authentication
  async authenticate(credentials: DraftRoomCredentials): Promise<AuthResult> {
    try {
      const session = await this.performAuthentication(credentials);
      this.authSession = session;
      
      return {
        success: true,
        session,
        metadata: {
          expiresAt: session.expiresAt,
          permissions: await this.getUserPermissions().catch(() => []),
          userInfo: {
            id: session.credentials.username || 'unknown',
            username: session.credentials.username || 'unknown'
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.createDraftError('authentication_failed', error),
        metadata: {}
      };
    }
  }

  async validateCredentials(credentials: DraftRoomCredentials): Promise<boolean> {
    try {
      const result = await this.authenticate(credentials);
      return result.success;
    } catch {
      return false;
    }
  }

  async refreshAuth(): Promise<AuthResult> {
    if (!this.authSession) {
      return {
        success: false,
        error: this.createDraftError('authentication_failed', new Error('No active session')),
        metadata: {}
      };
    }

    return this.authenticate(this.authSession.credentials);
  }

  // Draft operations
  async fetchDraftData(): Promise<NormalizedDraftData> {
    this.ensureConnected();
    return this.fetchPlatformDraftData();
  }

  async makePick(playerId: string): Promise<DraftPickResult> {
    this.ensureConnected();
    
    const startTime = Date.now();
    try {
      const pick = await this.submitPlayerPick(playerId);
      
      // Emit event
      const event: DraftEvent = {
        id: `pick_${Date.now()}`,
        type: 'pick_made',
        timestamp: new Date(),
        platform: this.platform,
        leagueId: this.currentConnection?.leagueId || '',
        data: {
          pick: {
            round: pick.round,
            pickNumber: pick.pick,
            overallPick: pick.overallPick,
            teamId: pick.teamId.toString(),
            playerId
          }
        },
        processed: false,
        retryCount: 0,
        importance: 'high'
      };
      
      this.emitEvent(event);
      
      return {
        success: true,
        pick,
        metadata: {
          processingTime: Date.now() - startTime,
          pickConfirmed: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.createDraftError('api_error', error),
        metadata: {
          processingTime: Date.now() - startTime,
          pickConfirmed: false
        }
      };
    }
  }

  async getAvailablePlayers(): Promise<Player[]> {
    this.ensureConnected();
    return this.fetchAvailablePlayers();
  }

  // Real-time synchronization
  async enableRealTimeSync(mode: SyncMode): Promise<void> {
    switch (mode) {
      case 'websocket':
        if (this.capabilities.supportsRealTime) {
          await this.setupWebSocketSync();
        }
        break;
      case 'polling':
        await this.setupPollingSync();
        break;
      case 'hybrid':
        if (this.capabilities.supportsRealTime) {
          await this.setupWebSocketSync();
        } else {
          await this.setupPollingSync();
        }
        break;
    }
  }

  async disableRealTimeSync(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  subscribeToEvents(callback: DraftEventCallback): UnsubscribeFunction {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  // Monitoring
  getConnectionStats(): any {
    return {
      platform: this.platform,
      leagueId: this.currentConnection?.leagueId || '',
      connectionTime: 0, // Would track actual metrics
      averageLatency: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0
    };
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = {
      connectivity: this.isConnected(),
      authentication: !!this.authSession,
      dataAccess: false,
      realTimeSync: !!this.websocket || !!this.syncInterval
    };

    // Test data access
    try {
      await this.testDataAccess();
      checks.dataAccess = true;
    } catch {
      checks.dataAccess = false;
    }

    const healthy = Object.values(checks).every(check => check);
    
    return {
      healthy,
      status: healthy ? 'healthy' : 'degraded',
      checks,
      metrics: {
        responseTime: 0, // Would measure actual response time
        errorRate: 0,
      },
      timestamp: new Date()
    };
  }

  // Abstract methods to be implemented by platform-specific services
  protected abstract establishConnection(config: DraftRoomConnection): Promise<void>;
  protected abstract performAuthentication(credentials: DraftRoomCredentials): Promise<AuthSession>;
  protected abstract fetchPlatformDraftData(): Promise<NormalizedDraftData>;
  protected abstract submitPlayerPick(playerId: string): Promise<DraftPick>;
  protected abstract fetchAvailablePlayers(): Promise<Player[]>;
  protected abstract cleanupConnection(): Promise<void>;
  protected abstract testDataAccess(): Promise<void>;

  // Optional platform-specific methods
  protected async getServerVersion(): Promise<string> { return '1.0.0'; }
  protected async getUserPermissions(): Promise<string[]> { return []; }

  async platformSpecificOperation(operation: string, params?: any): Promise<any> {
    throw new Error(`Operation '${operation}' not supported by ${this.platform} service`);
  }

  // Helper methods
  protected ensureConnected(): void {
    if (!this.isConnected()) {
      throw new Error('Not connected to draft room');
    }
  }

  protected createDraftError(type: any, error: any): DraftRoomError {
    return {
      type,
      code: `${this.platform}_error`,
      message: error instanceof Error ? error.message : String(error),
      platform: this.platform,
      leagueId: this.currentConnection?.leagueId,
      timestamp: new Date(),
      retryable: type !== 'authentication_failed',
      userMessage: `Failed to connect to ${this.platform}`,
      severity: 'high'
    };
  }

  protected getCapabilityList(): string[] {
    return Object.entries(this.capabilities)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key);
  }

  protected emitEvent(event: DraftEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  protected async setupWebSocketSync(): Promise<void> {
    const wsUrl = this.getWebSocketURL();
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.websocket.onclose = () => {
      // Attempt reconnection
      if (this.currentConnection?.autoReconnect) {
        setTimeout(() => this.setupWebSocketSync(), 5000);
      }
    };
  }

  protected async setupPollingSync(): Promise<void> {
    const interval = this.currentConnection?.syncInterval || 30000; // 30 seconds default
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.pollForUpdates();
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval) as any;
  }

  protected getWebSocketURL(): string {
    // Platform-specific WebSocket URL construction
    return `wss://example.com/${this.platform}/draft/${this.currentConnection?.leagueId}`;
  }

  protected handleWebSocketMessage(message: WebSocketMessage): void {
    if (message.type === 'draft_event' && message.payload.event) {
      this.emitEvent(message.payload.event);
    }
  }

  protected async pollForUpdates(): Promise<void> {
    // Platform-specific polling implementation
    // Would fetch latest draft state and emit events for changes
  }
}

// ========================================
// PLATFORM-SPECIFIC IMPLEMENTATIONS
// ========================================

/**
 * ESPN Draft Service Implementation
 */
class ESPNDraftService extends BaseDraftPlatformService {
  readonly platform: DraftPlatform = 'espn';
  readonly capabilities: PlatformCapabilities = {
    supportsRealTime: true,
    supportsWebSockets: false,
    supportsPolling: true,
    supportsAuthentication: true,
    canMakePicks: true,
    canPauseDraft: true,
    canResumeDraft: true,
    canProposeTrades: true,
    providesRosterData: true,
    providesPlayerPool: true,
    providesHistoricalData: true,
    providesProjections: true,
    maxConcurrentConnections: 5,
    rateLimits: {
      requestsPerMinute: 120,
      connectionsPerHour: 10
    },
    supportedApiVersions: ['v1', 'v2'],
    currentApiVersion: 'v2'
  };

  protected async establishConnection(config: DraftRoomConnection): Promise<void> {
    // ESPN-specific connection logic
    console.log(`Connecting to ESPN league ${config.leagueId}`);
  }

  protected async performAuthentication(credentials: DraftRoomCredentials): Promise<AuthSession> {
    // ESPN authentication with SWID and espn_s2
    return {
      platform: 'espn',
      leagueId: this.currentConnection?.leagueId || '',
      status: 'authenticated' as AuthStatus,
      credentials,
      startTime: new Date(),
      lastActivity: new Date(),
      requestCount: 0,
      failedAttempts: 0
    };
  }

  protected async fetchPlatformDraftData(): Promise<NormalizedDraftData> {
    // ESPN API calls to fetch draft data
    throw new Error('ESPN draft data fetching not implemented');
  }

  protected async submitPlayerPick(playerId: string): Promise<DraftPick> {
    // ESPN API call to submit pick
    throw new Error('ESPN pick submission not implemented');
  }

  protected async fetchAvailablePlayers(): Promise<Player[]> {
    // ESPN API to get available players
    return [];
  }

  protected async cleanupConnection(): Promise<void> {
    // ESPN cleanup
  }

  protected async testDataAccess(): Promise<void> {
    // Test ESPN API access
  }
}

/**
 * Sleeper Draft Service Implementation
 */
class SleeperDraftService extends BaseDraftPlatformService {
  readonly platform: DraftPlatform = 'sleeper';
  readonly capabilities: PlatformCapabilities = {
    supportsRealTime: true,
    supportsWebSockets: true,
    supportsPolling: true,
    supportsAuthentication: false, // Sleeper allows guest access
    canMakePicks: true,
    canPauseDraft: true,
    canResumeDraft: true,
    canProposeTrades: true,
    providesRosterData: true,
    providesPlayerPool: true,
    providesHistoricalData: true,
    providesProjections: false,
    maxConcurrentConnections: 10,
    rateLimits: {
      requestsPerMinute: 1000,
      connectionsPerHour: 100
    },
    supportedApiVersions: ['v1'],
    currentApiVersion: 'v1'
  };

  protected async establishConnection(config: DraftRoomConnection): Promise<void> {
    console.log(`Connecting to Sleeper league ${config.leagueId}`);
  }

  protected async performAuthentication(credentials: DraftRoomCredentials): Promise<AuthSession> {
    // Sleeper may not require authentication for read-only access
    return {
      platform: 'sleeper',
      leagueId: this.currentConnection?.leagueId || '',
      status: 'authenticated' as AuthStatus,
      credentials,
      startTime: new Date(),
      lastActivity: new Date(),
      requestCount: 0,
      failedAttempts: 0
    };
  }

  protected async fetchPlatformDraftData(): Promise<NormalizedDraftData> {
    throw new Error('Sleeper draft data fetching not implemented');
  }

  protected async submitPlayerPick(playerId: string): Promise<DraftPick> {
    throw new Error('Sleeper pick submission not implemented');
  }

  protected async fetchAvailablePlayers(): Promise<Player[]> {
    return [];
  }

  protected async cleanupConnection(): Promise<void> {}
  protected async testDataAccess(): Promise<void> {}
}

/**
 * Yahoo Draft Service Implementation
 */
class YahooDraftService extends BaseDraftPlatformService {
  readonly platform: DraftPlatform = 'yahoo';
  readonly capabilities: PlatformCapabilities = {
    supportsRealTime: true,
    supportsWebSockets: false,
    supportsPolling: true,
    supportsAuthentication: true,
    canMakePicks: true,
    canPauseDraft: true,
    canResumeDraft: true,
    canProposeTrades: true,
    providesRosterData: true,
    providesPlayerPool: true,
    providesHistoricalData: true,
    providesProjections: true,
    maxConcurrentConnections: 3,
    rateLimits: {
      requestsPerMinute: 60,
      connectionsPerHour: 5
    },
    supportedApiVersions: ['v1'],
    currentApiVersion: 'v1'
  };

  protected async establishConnection(config: DraftRoomConnection): Promise<void> {
    console.log(`Connecting to Yahoo league ${config.leagueId}`);
  }

  protected async performAuthentication(credentials: DraftRoomCredentials): Promise<AuthSession> {
    // Yahoo OAuth authentication
    return {
      platform: 'yahoo',
      leagueId: this.currentConnection?.leagueId || '',
      status: 'authenticated' as AuthStatus,
      credentials,
      startTime: new Date(),
      lastActivity: new Date(),
      requestCount: 0,
      failedAttempts: 0
    };
  }

  protected async fetchPlatformDraftData(): Promise<NormalizedDraftData> {
    throw new Error('Yahoo draft data fetching not implemented');
  }

  protected async submitPlayerPick(playerId: string): Promise<DraftPick> {
    throw new Error('Yahoo pick submission not implemented');
  }

  protected async fetchAvailablePlayers(): Promise<Player[]> {
    return [];
  }

  protected async cleanupConnection(): Promise<void> {}
  protected async testDataAccess(): Promise<void> {}
}

/**
 * NFL.com Draft Service Implementation
 */
class NFLDraftService extends BaseDraftPlatformService {
  readonly platform: DraftPlatform = 'nfl';
  readonly capabilities: PlatformCapabilities = {
    supportsRealTime: true,
    supportsWebSockets: false,
    supportsPolling: true,
    supportsAuthentication: true,
    canMakePicks: true,
    canPauseDraft: false,
    canResumeDraft: false,
    canProposeTrades: true,
    providesRosterData: true,
    providesPlayerPool: true,
    providesHistoricalData: true,
    providesProjections: true,
    maxConcurrentConnections: 5,
    rateLimits: {
      requestsPerMinute: 100,
      connectionsPerHour: 20
    },
    supportedApiVersions: ['v1'],
    currentApiVersion: 'v1'
  };

  protected async establishConnection(config: DraftRoomConnection): Promise<void> {
    console.log(`Connecting to NFL league ${config.leagueId}`);
  }

  protected async performAuthentication(credentials: DraftRoomCredentials): Promise<AuthSession> {
    return {
      platform: 'nfl',
      leagueId: this.currentConnection?.leagueId || '',
      status: 'authenticated' as AuthStatus,
      credentials,
      startTime: new Date(),
      lastActivity: new Date(),
      requestCount: 0,
      failedAttempts: 0
    };
  }

  protected async fetchPlatformDraftData(): Promise<NormalizedDraftData> {
    throw new Error('NFL draft data fetching not implemented');
  }

  protected async submitPlayerPick(playerId: string): Promise<DraftPick> {
    throw new Error('NFL pick submission not implemented');
  }

  protected async fetchAvailablePlayers(): Promise<Player[]> {
    return [];
  }

  protected async cleanupConnection(): Promise<void> {}
  protected async testDataAccess(): Promise<void> {}
}

// ========================================
// MAIN ORCHESTRATOR IMPLEMENTATION
// ========================================

/**
 * Main draft room orchestrator
 */
export class DraftRoomOrchestratorImpl implements DraftRoomOrchestrator {
  private services = new Map<DraftPlatform, DraftPlatformService>();
  private connections = new Map<string, DraftRoomConnection>();
  private draftBoards = new Map<string, LiveDraftBoard>();
  private eventListeners: Set<DraftEventCallback> = new Set();
  private statusListeners: Set<ConnectionStatusCallback> = new Set();
  
  private factory = new DraftServiceFactoryImpl();

  registerService(platform: DraftPlatform, service: DraftPlatformService): void {
    this.services.set(platform, service);
  }

  getService(platform: DraftPlatform): DraftPlatformService | null {
    let service = this.services.get(platform);
    
    if (!service && this.factory.isPlatformSupported(platform)) {
      service = this.factory.createService(platform);
      this.services.set(platform, service);
    }
    
    return service || null;
  }

  async connectToMultipleRooms(connections: DraftRoomConnection[]): Promise<ConnectionResult[]> {
    const results = await Promise.allSettled(
      connections.map(async connection => {
        const service = this.getService(connection.platform);
        if (!service) {
          return {
            success: false,
            status: 'error' as ConnectionStatus,
            error: {
              type: 'connection_failed',
              code: 'unsupported_platform',
              message: `Platform ${connection.platform} not supported`,
              platform: connection.platform,
              timestamp: new Date(),
              retryable: false,
              userMessage: `Platform ${connection.platform} is not supported`,
              severity: 'high'
            } as DraftRoomError,
            metadata: { connectionTime: 0, warnings: [] }
          } as ConnectionResult;
        }

        const result = await service.connect(connection);
        if (result.success) {
          this.connections.set(connection.leagueId, connection);
          
          // Subscribe to events from this service
          service.subscribeToEvents((event) => {
            this.eventListeners.forEach(listener => listener(event));
          });
        }
        
        return result;
      })
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        success: false,
        status: 'error' as ConnectionStatus,
        error: {
          type: 'connection_failed',
          code: 'unknown_error',
          message: 'Connection failed with unknown error',
          platform: 'espn', // fallback
          timestamp: new Date(),
          retryable: true,
          userMessage: 'Connection failed',
          severity: 'high'
        } as DraftRoomError,
        metadata: { connectionTime: 0, warnings: [] }
      } as ConnectionResult
    );
  }

  async disconnectFromAllRooms(): Promise<void> {
    const disconnectPromises = Array.from(this.services.values()).map(service => 
      service.disconnect().catch(console.error)
    );
    
    await Promise.allSettled(disconnectPromises);
    
    this.connections.clear();
    this.draftBoards.clear();
  }

  async syncAllConnections(): Promise<void> {
    const syncPromises = Array.from(this.connections.entries()).map(async ([leagueId, connection]) => {
      const service = this.getService(connection.platform);
      if (service && service.isConnected()) {
        try {
          const draftData = await service.fetchDraftData();
          // Update draft board from normalized data
          // This would involve converting NormalizedDraftData to LiveDraftBoard
        } catch (error) {
          console.error(`Failed to sync league ${leagueId}:`, error);
        }
      }
    });

    await Promise.allSettled(syncPromises);
  }

  async broadcastEvent(event: DraftEvent): Promise<void> {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  getAllDraftBoards(): Map<string, LiveDraftBoard> {
    return new Map(this.draftBoards);
  }

  getGlobalConnectionStatus(): Map<string, ConnectionStatus> {
    const statusMap = new Map<string, ConnectionStatus>();
    
    this.connections.forEach((connection, leagueId) => {
      const service = this.getService(connection.platform);
      statusMap.set(leagueId, service?.getConnectionStatus() || 'disconnected');
    });
    
    return statusMap;
  }

  subscribeToAllEvents(callback: DraftEventCallback): UnsubscribeFunction {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  onConnectionStatusChange(callback: ConnectionStatusCallback): UnsubscribeFunction {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }
}

// ========================================
// EXPORTS
// ========================================

// Export the main service instances
export const draftServiceFactory = new DraftServiceFactoryImpl();
export const draftRoomOrchestrator = new DraftRoomOrchestratorImpl();

// Export utility functions for easy usage
export function createDraftConnection(url: string, credentials?: Partial<DraftRoomCredentials>): DraftRoomConnection | null {
  const parsedUrl = parseURL(url);
  if (!parsedUrl.isValid) {
    return null;
  }

  return {
    platform: parsedUrl.platform,
    leagueId: parsedUrl.leagueId,
    draftId: parsedUrl.draftId,
    url: parsedUrl,
    credentials: {
      platform: parsedUrl.platform,
      rememberMe: false,
      storeLocally: false,
      ...credentials
    },
    syncMode: 'polling',
    syncInterval: 30000,
    autoReconnect: true,
    maxReconnectAttempts: 3,
    reconnectDelay: 5000,
    enableRealTimeUpdates: true,
    enableNotifications: true,
    enableAutoSync: true,
    requestTimeout: 30000,
    batchSize: 50,
    cacheTimeout: 300000,
    platformConfig: {}
  };
}

export function quickConnect(url: string, credentials?: Partial<DraftRoomCredentials>): Promise<ConnectionResult | null> {
  const connection = createDraftConnection(url, credentials);
  if (!connection) {
    return Promise.resolve(null);
  }

  const service = draftServiceFactory.createService(connection.platform);
  return service.connect(connection);
}