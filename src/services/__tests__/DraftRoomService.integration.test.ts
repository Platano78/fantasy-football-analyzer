/**
 * Draft Room Service Integration Tests
 * Tests for real-time draft room connections, WebSocket handling, and platform integrations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { 
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
} from '../../types/DraftRoomTypes'

import type {
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
} from '../../types/DraftRoomServiceTypes'

import type { Player, DraftPick } from '../../types'

// Mock URL parser utility
vi.mock('../../utils/draftRoomUrlParser', () => ({
  parseURL: vi.fn(),
  validateURL: vi.fn(),
  detectPlatform: vi.fn()
}))

// Mock player data
const mockPlayers: Player[] = [
  {
    id: 'player-1',
    name: 'Josh Allen',
    position: 'QB',
    team: 'BUF',
    projectedPoints: 25.4
  },
  {
    id: 'player-2', 
    name: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    projectedPoints: 22.8
  }
]

// Mock draft pick data
const mockDraftPicks: DraftPick[] = [
  {
    id: 'pick-1',
    playerId: 'player-1',
    teamId: 'team-1',
    round: 1,
    pick: 1,
    timestamp: new Date('2024-01-15T10:00:00Z')
  }
]

// Mock draft room connection implementation
class MockDraftRoomConnection implements DraftRoomConnection {
  public id: string = 'mock-connection-1'
  public platform: DraftPlatform = 'ESPN'
  public status: ConnectionStatus = 'disconnected'
  public url: DraftRoomURL = {
    original: 'https://fantasy.espn.com/draft',
    platform: 'ESPN',
    leagueId: 'league-123',
    isValid: true
  }
  public credentials?: DraftRoomCredentials
  public session?: AuthSession
  public lastSync?: Date
  public syncMode: SyncMode = 'real-time'
  public errorHistory: DraftRoomError[] = []

  private eventCallbacks: Map<DraftEventType, DraftEventCallback[]> = new Map()
  private statusCallbacks: ConnectionStatusCallback[] = []

  async connect(credentials?: DraftRoomCredentials): Promise<ConnectionResult> {
    this.credentials = credentials
    this.status = 'connecting'
    this.notifyStatusChange()

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100))

    this.status = 'connected'
    this.session = {
      id: 'session-123',
      userId: 'user-456',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      platform: this.platform,
      permissions: ['read', 'write']
    }
    this.notifyStatusChange()

    return {
      success: true,
      connection: this,
      session: this.session
    }
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected'
    this.session = undefined
    this.notifyStatusChange()
  }

  async authenticate(credentials: DraftRoomCredentials): Promise<AuthResult> {
    this.credentials = credentials
    
    // Simulate auth
    if (credentials.username === 'testuser' && credentials.password === 'testpass') {
      this.session = {
        id: 'auth-session-123',
        userId: 'user-456',
        expiresAt: new Date(Date.now() + 3600000),
        platform: this.platform,
        permissions: ['read', 'write']
      }
      
      return {
        success: true,
        session: this.session,
        status: 'authenticated'
      }
    }

    return {
      success: false,
      status: 'failed',
      error: 'Invalid credentials'
    }
  }

  async syncDraftData(): Promise<NormalizedDraftData> {
    if (this.status !== 'connected') {
      throw new Error('Not connected to draft room')
    }

    const mockData: NormalizedDraftData = {
      draftId: 'draft-123',
      leagueId: 'league-123',
      platform: this.platform,
      players: mockPlayers,
      picks: mockDraftPicks,
      teams: [{
        id: 'team-1',
        name: 'Team 1',
        ownerId: 'user-456',
        picks: [1, 24],
        roster: []
      }],
      currentTurn: {
        teamId: 'team-1',
        round: 1,
        pick: 2,
        timeRemaining: 90,
        isAutoSelected: false
      },
      settings: {
        totalRounds: 16,
        pickTimeLimit: 90,
        draftType: 'snake'
      },
      lastUpdated: new Date(),
      syncTimestamp: new Date()
    }

    this.lastSync = new Date()
    return mockData
  }

  async getLiveDraftBoard(): Promise<LiveDraftBoard> {
    const data = await this.syncDraftData()
    
    return {
      ...data,
      availablePlayers: mockPlayers.filter(p => 
        !data.picks.some(pick => pick.playerId === p.id)
      ),
      recentPicks: data.picks.slice(-5),
      upcomingPicks: [{
        round: 1,
        pick: 2,
        teamId: 'team-1',
        projected: null
      }],
      draftStatistics: {
        totalPicks: data.picks.length,
        averagePickTime: 45,
        timeElapsed: 300,
        estimatedTimeRemaining: 2700
      },
      isLive: true,
      streamQuality: 'good'
    }
  }

  async makePick(playerId: string, teamId?: string): Promise<DraftPickResult> {
    if (this.status !== 'connected') {
      return {
        success: false,
        error: 'Not connected to draft room'
      }
    }

    const player = mockPlayers.find(p => p.id === playerId)
    if (!player) {
      return {
        success: false,
        error: 'Player not found'
      }
    }

    const pick: DraftPick = {
      id: `pick-${Date.now()}`,
      playerId,
      teamId: teamId || 'team-1',
      round: 1,
      pick: 2,
      timestamp: new Date()
    }

    // Simulate pick processing
    await new Promise(resolve => setTimeout(resolve, 50))

    // Emit draft event
    this.emitEvent({
      id: `event-${Date.now()}`,
      type: 'pick-made',
      timestamp: new Date(),
      data: { pick, player }
    })

    return {
      success: true,
      pick,
      updatedBoard: await this.getLiveDraftBoard()
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const isHealthy = this.status === 'connected'
    
    return {
      isHealthy,
      status: this.status,
      lastSync: this.lastSync,
      latency: Math.random() * 100 + 50, // Mock latency
      issues: isHealthy ? [] : ['Connection lost']
    }
  }

  onEvent(eventType: DraftEventType, callback: DraftEventCallback): UnsubscribeFunction {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, [])
    }
    
    this.eventCallbacks.get(eventType)!.push(callback)
    
    return () => {
      const callbacks = this.eventCallbacks.get(eventType)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  onStatusChange(callback: ConnectionStatusCallback): UnsubscribeFunction {
    this.statusCallbacks.push(callback)
    
    return () => {
      const index = this.statusCallbacks.indexOf(callback)
      if (index > -1) {
        this.statusCallbacks.splice(index, 1)
      }
    }
  }

  private emitEvent(event: DraftEvent): void {
    const callbacks = this.eventCallbacks.get(event.type)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error('Error in event callback:', error)
        }
      })
    }
  }

  private notifyStatusChange(): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.status, this.session)
      } catch (error) {
        console.error('Error in status callback:', error)
      }
    })
  }
}

// Mock platform service
class MockDraftPlatformService implements DraftPlatformService {
  public platform: DraftPlatform = 'ESPN'
  public capabilities: PlatformCapabilities = {
    supportsRealTime: true,
    supportsWebSocket: true,
    supportsAuthentication: true,
    supportsPickSubmission: true,
    supportsChatMessages: false,
    maxConcurrentConnections: 5
  }

  async createConnection(url: DraftRoomURL, credentials?: DraftRoomCredentials): Promise<DraftRoomConnection> {
    const connection = new MockDraftRoomConnection()
    connection.url = url
    connection.platform = this.platform
    
    if (credentials) {
      await connection.authenticate(credentials)
    }
    
    return connection
  }

  async parseURL(url: string): Promise<DraftRoomURL> {
    return {
      original: url,
      platform: this.platform,
      leagueId: 'league-123',
      isValid: url.includes('espn.com')
    }
  }

  async validateCredentials(credentials: DraftRoomCredentials): Promise<boolean> {
    return credentials.username === 'testuser' && credentials.password === 'testpass'
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      isHealthy: true,
      status: 'connected',
      latency: 75,
      issues: []
    }
  }
}

// Mock service factory
class MockDraftServiceFactory implements DraftServiceFactory {
  private services = new Map<DraftPlatform, DraftPlatformService>()

  constructor() {
    this.services.set('ESPN', new MockDraftPlatformService())
  }

  createService(platform: DraftPlatform): DraftPlatformService {
    const service = this.services.get(platform)
    if (!service) {
      throw new Error(`Unsupported platform: ${platform}`)
    }
    return service
  }

  getSupportedPlatforms(): DraftPlatform[] {
    return Array.from(this.services.keys())
  }

  detectPlatform(url: string): DraftPlatform | null {
    if (url.includes('espn.com')) return 'ESPN'
    if (url.includes('sleeper.app')) return 'Sleeper'
    if (url.includes('yahoo.com')) return 'Yahoo'
    return null
  }
}

// Mock draft room orchestrator
class MockDraftRoomOrchestrator implements DraftRoomOrchestrator {
  private connections = new Map<string, DraftRoomConnection>()
  private factory: DraftServiceFactory

  constructor() {
    this.factory = new MockDraftServiceFactory()
  }

  async connect(url: string, credentials?: DraftRoomCredentials): Promise<ConnectionResult> {
    const platform = this.factory.detectPlatform(url)
    if (!platform) {
      return {
        success: false,
        error: 'Unsupported platform'
      }
    }

    const service = this.factory.createService(platform)
    const parsedUrl = await service.parseURL(url)
    
    if (!parsedUrl.isValid) {
      return {
        success: false,
        error: 'Invalid URL'
      }
    }

    const connection = await service.createConnection(parsedUrl, credentials)
    const result = await connection.connect(credentials)

    if (result.success) {
      this.connections.set(connection.id, connection)
    }

    return result
  }

  async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (connection) {
      await connection.disconnect()
      this.connections.delete(connectionId)
    }
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.values()).map(conn => 
      conn.disconnect()
    )
    await Promise.all(disconnectPromises)
    this.connections.clear()
  }

  getConnections(): DraftRoomConnection[] {
    return Array.from(this.connections.values())
  }

  getConnection(id: string): DraftRoomConnection | null {
    return this.connections.get(id) || null
  }

  async healthCheckAll(): Promise<Record<string, HealthCheckResult>> {
    const results: Record<string, HealthCheckResult> = {}
    
    const healthPromises = Array.from(this.connections.entries()).map(async ([id, conn]) => {
      try {
        results[id] = await conn.healthCheck()
      } catch (error) {
        results[id] = {
          isHealthy: false,
          status: 'error',
          issues: [error instanceof Error ? error.message : 'Unknown error']
        }
      }
    })

    await Promise.all(healthPromises)
    return results
  }
}

describe('Draft Room Service Integration Tests', () => {
  let orchestrator: MockDraftRoomOrchestrator
  let mockCredentials: DraftRoomCredentials

  beforeEach(() => {
    vi.clearAllMocks()
    orchestrator = new MockDraftRoomOrchestrator()
    mockCredentials = {
      username: 'testuser',
      password: 'testpass',
      platform: 'ESPN'
    }
  })

  afterEach(async () => {
    await orchestrator.disconnectAll()
  })

  describe('Connection Management', () => {
    it('should successfully connect to ESPN draft room', async () => {
      const result = await orchestrator.connect(
        'https://fantasy.espn.com/draft',
        mockCredentials
      )

      expect(result.success).toBe(true)
      expect(result.connection).toBeDefined()
      expect(result.session).toBeDefined()
      
      if (result.connection) {
        expect(result.connection.status).toBe('connected')
        expect(result.connection.platform).toBe('ESPN')
      }
    })

    it('should fail to connect with invalid URL', async () => {
      const result = await orchestrator.connect('https://invalid-url.com')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle connection without credentials', async () => {
      const result = await orchestrator.connect('https://fantasy.espn.com/draft')

      expect(result.success).toBe(true)
      expect(result.connection).toBeDefined()
    })

    it('should manage multiple connections', async () => {
      const result1 = await orchestrator.connect('https://fantasy.espn.com/draft1')
      const result2 = await orchestrator.connect('https://fantasy.espn.com/draft2')

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      const connections = orchestrator.getConnections()
      expect(connections).toHaveLength(2)
    })

    it('should disconnect specific connection', async () => {
      const result = await orchestrator.connect('https://fantasy.espn.com/draft')
      expect(result.success).toBe(true)

      if (result.connection) {
        await orchestrator.disconnect(result.connection.id)
        const connection = orchestrator.getConnection(result.connection.id)
        expect(connection).toBeNull()
      }
    })

    it('should disconnect all connections', async () => {
      await orchestrator.connect('https://fantasy.espn.com/draft1')
      await orchestrator.connect('https://fantasy.espn.com/draft2')

      expect(orchestrator.getConnections()).toHaveLength(2)

      await orchestrator.disconnectAll()
      expect(orchestrator.getConnections()).toHaveLength(0)
    })
  })

  describe('Authentication', () => {
    it('should authenticate with valid credentials', async () => {
      const connection = new MockDraftRoomConnection()
      const result = await connection.authenticate(mockCredentials)

      expect(result.success).toBe(true)
      expect(result.session).toBeDefined()
      expect(result.status).toBe('authenticated')
    })

    it('should fail authentication with invalid credentials', async () => {
      const connection = new MockDraftRoomConnection()
      const invalidCredentials: DraftRoomCredentials = {
        username: 'invalid',
        password: 'wrong',
        platform: 'ESPN'
      }

      const result = await connection.authenticate(invalidCredentials)

      expect(result.success).toBe(false)
      expect(result.status).toBe('failed')
      expect(result.error).toBeDefined()
    })
  })

  describe('Real-time Draft Synchronization', () => {
    let connection: MockDraftRoomConnection

    beforeEach(async () => {
      const result = await orchestrator.connect(
        'https://fantasy.espn.com/draft',
        mockCredentials
      )
      expect(result.success).toBe(true)
      connection = result.connection as MockDraftRoomConnection
    })

    it('should sync draft data successfully', async () => {
      const draftData = await connection.syncDraftData()

      expect(draftData).toBeDefined()
      expect(draftData.draftId).toBe('draft-123')
      expect(draftData.leagueId).toBe('league-123')
      expect(draftData.platform).toBe('ESPN')
      expect(draftData.players).toHaveLength(2)
      expect(draftData.picks).toHaveLength(1)
      expect(draftData.teams).toHaveLength(1)
      expect(draftData.currentTurn).toBeDefined()
    })

    it('should get live draft board', async () => {
      const liveBoard = await connection.getLiveDraftBoard()

      expect(liveBoard).toBeDefined()
      expect(liveBoard.isLive).toBe(true)
      expect(liveBoard.availablePlayers).toBeDefined()
      expect(liveBoard.recentPicks).toBeDefined()
      expect(liveBoard.upcomingPicks).toBeDefined()
      expect(liveBoard.draftStatistics).toBeDefined()
      expect(liveBoard.streamQuality).toBe('good')
    })

    it('should make draft picks successfully', async () => {
      const result = await connection.makePick('player-2')

      expect(result.success).toBe(true)
      expect(result.pick).toBeDefined()
      expect(result.updatedBoard).toBeDefined()

      if (result.pick) {
        expect(result.pick.playerId).toBe('player-2')
        expect(result.pick.timestamp).toBeInstanceOf(Date)
      }
    })

    it('should fail to make pick when not connected', async () => {
      await connection.disconnect()
      const result = await connection.makePick('player-2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not connected to draft room')
    })

    it('should fail to make pick for non-existent player', async () => {
      const result = await connection.makePick('non-existent-player')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Player not found')
    })
  })

  describe('Event Handling', () => {
    let connection: MockDraftRoomConnection

    beforeEach(async () => {
      const result = await orchestrator.connect(
        'https://fantasy.espn.com/draft',
        mockCredentials
      )
      connection = result.connection as MockDraftRoomConnection
    })

    it('should register and trigger event callbacks', async () => {
      const mockCallback = vi.fn()
      const unsubscribe = connection.onEvent('pick-made', mockCallback)

      // Trigger event by making a pick
      await connection.makePick('player-2')

      expect(mockCallback).toHaveBeenCalledOnce()
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pick-made',
          data: expect.objectContaining({
            pick: expect.any(Object),
            player: expect.any(Object)
          })
        })
      )

      unsubscribe()
    })

    it('should handle multiple event subscribers', async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      connection.onEvent('pick-made', callback1)
      connection.onEvent('pick-made', callback2)

      await connection.makePick('player-2')

      expect(callback1).toHaveBeenCalledOnce()
      expect(callback2).toHaveBeenCalledOnce()
    })

    it('should unsubscribe from events', async () => {
      const mockCallback = vi.fn()
      const unsubscribe = connection.onEvent('pick-made', mockCallback)

      unsubscribe()
      await connection.makePick('player-2')

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should handle status change callbacks', async () => {
      const mockCallback = vi.fn()
      const unsubscribe = connection.onStatusChange(mockCallback)

      await connection.disconnect()

      expect(mockCallback).toHaveBeenCalled()
      expect(mockCallback).toHaveBeenCalledWith('disconnected', undefined)

      unsubscribe()
    })
  })

  describe('Health Monitoring', () => {
    let connection: MockDraftRoomConnection

    beforeEach(async () => {
      const result = await orchestrator.connect(
        'https://fantasy.espn.com/draft',
        mockCredentials
      )
      connection = result.connection as MockDraftRoomConnection
    })

    it('should perform health check on connected connection', async () => {
      const health = await connection.healthCheck()

      expect(health.isHealthy).toBe(true)
      expect(health.status).toBe('connected')
      expect(health.latency).toBeGreaterThan(0)
      expect(health.issues).toHaveLength(0)
    })

    it('should report unhealthy status when disconnected', async () => {
      await connection.disconnect()
      const health = await connection.healthCheck()

      expect(health.isHealthy).toBe(false)
      expect(health.status).toBe('disconnected')
      expect(health.issues).toEqual(['Connection lost'])
    })

    it('should perform health check on all connections', async () => {
      const result1 = await orchestrator.connect('https://fantasy.espn.com/draft1')
      const result2 = await orchestrator.connect('https://fantasy.espn.com/draft2')

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      const healthResults = await orchestrator.healthCheckAll()

      expect(Object.keys(healthResults)).toHaveLength(3) // Original + 2 new connections
      Object.values(healthResults).forEach(health => {
        expect(health.isHealthy).toBe(true)
        expect(health.status).toBe('connected')
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle connection failures gracefully', async () => {
      // This would be testing actual network failures in a real scenario
      const connection = new MockDraftRoomConnection()
      
      // Simulate connection failure
      connection.status = 'error'
      
      const health = await connection.healthCheck()
      expect(health.isHealthy).toBe(false)
    })

    it('should maintain error history', async () => {
      const connection = new MockDraftRoomConnection()
      
      // Simulate errors
      connection.errorHistory.push({
        id: 'error-1',
        type: 'connection-lost',
        message: 'WebSocket connection lost',
        timestamp: new Date(),
        severity: 'warning'
      })

      expect(connection.errorHistory).toHaveLength(1)
      expect(connection.errorHistory[0].type).toBe('connection-lost')
    })

    it('should handle platform service creation errors', () => {
      const factory = new MockDraftServiceFactory()
      
      expect(() => {
        factory.createService('InvalidPlatform' as DraftPlatform)
      }).toThrow('Unsupported platform: InvalidPlatform')
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle multiple simultaneous connections', async () => {
      const connectionPromises = Array.from({ length: 5 }, (_, i) =>
        orchestrator.connect(`https://fantasy.espn.com/draft${i}`)
      )

      const results = await Promise.all(connectionPromises)
      
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      expect(orchestrator.getConnections()).toHaveLength(5)
    })

    it('should perform concurrent health checks efficiently', async () => {
      // Create multiple connections
      await Promise.all([
        orchestrator.connect('https://fantasy.espn.com/draft1'),
        orchestrator.connect('https://fantasy.espn.com/draft2'),
        orchestrator.connect('https://fantasy.espn.com/draft3')
      ])

      const startTime = Date.now()
      const healthResults = await orchestrator.healthCheckAll()
      const endTime = Date.now()

      expect(Object.keys(healthResults)).toHaveLength(3)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete quickly
    })
  })
})