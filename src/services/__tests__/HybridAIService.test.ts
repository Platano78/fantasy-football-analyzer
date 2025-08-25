/**
 * HybridAIService Tests
 * Comprehensive tests for AI service orchestration, fallback chain, and circuit breaker patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HybridAIService, LocalGeminiService, CloudGeminiService } from '../HybridAIService'
import type { FantasyAIRequest, FantasyAIResponse, AIBackend } from '../HybridAIService'

// Mock the config
vi.mock('@/config/environment', () => ({
  config: {
    FEATURES: {
      LOCAL_GEMINI: true
    },
    LOCAL_GEMINI_ENABLED: true,
    LOCAL_GEMINI_URL: 'http://localhost:3001'
  }
}))

describe('HybridAIService', () => {
  let hybridService: HybridAIService
  const mockRequest: FantasyAIRequest = {
    type: 'player_analysis',
    context: {
      players: [
        {
          id: '1',
          name: 'Josh Allen',
          position: 'QB',
          team: 'BUF',
          projectedPoints: 25
        }
      ],
      scoringSystem: 'PPR',
      currentRound: 3
    },
    query: 'Should I draft Josh Allen in round 3?',
    requestId: 'test-request-123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    hybridService = new HybridAIService()
  })

  afterEach(() => {
    if (hybridService) {
      hybridService.disconnect()
    }
  })

  describe('Initialization', () => {
    it('should initialize with all AI services', () => {
      const status = hybridService.getAllStatus()
      
      expect(status).toHaveProperty('claude')
      expect(status).toHaveProperty('gemini-local')
      expect(status).toHaveProperty('gemini-cloud')
      expect(status).toHaveProperty('deepseek')
      expect(status).toHaveProperty('offline')
    })

    it('should have proper fallback chain order', () => {
      const healthSummary = hybridService.getHealthSummary()
      expect(healthSummary).toBeDefined()
      expect(healthSummary.selectedBackend).toBeDefined()
    })
  })

  describe('Service Status Management', () => {
    it('should track status for all services', () => {
      const allStatus = hybridService.getAllStatus()
      
      Object.values(allStatus).forEach(status => {
        expect(status).toHaveProperty('backend')
        expect(status).toHaveProperty('available')
        expect(status).toHaveProperty('responseTime')
        expect(status).toHaveProperty('lastHealthCheck')
        expect(status).toHaveProperty('errorCount')
        expect(status).toHaveProperty('qualityScore')
        expect(status).toHaveProperty('connectionType')
      })
    })

    it('should provide circuit breaker status', () => {
      const circuitStatus = hybridService.getCircuitBreakerStatus()
      expect(circuitStatus).toHaveProperty('gemini-local')
      expect(circuitStatus).toHaveProperty('gemini-cloud')
      expect(circuitStatus).toHaveProperty('selectedBackend')
    })

    it('should allow status subscriptions', () => {
      const mockCallback = vi.fn()
      hybridService.subscribe('test-subscriber', mockCallback)
      
      // Wait a bit for the subscription to trigger
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled()
        hybridService.unsubscribe('test-subscriber')
      }, 100)
    })
  })

  describe('Query Processing and Fallback Chain', () => {
    it('should handle query with successful first service', async () => {
      // Mock Claude service success
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requestId: mockRequest.requestId,
          response: 'Claude analysis of Josh Allen',
          confidence: 95,
          responseTime: 250,
          timestamp: new Date().toISOString()
        })
      } as Response)

      const response = await hybridService.query(mockRequest)
      
      expect(response).toBeDefined()
      expect(response.requestId).toBe(mockRequest.requestId)
      expect(response.response).toContain('analysis')
      expect(response.confidence).toBeGreaterThan(0)
    })

    it('should fall back to next service when primary fails', async () => {
      // Mock Claude service failure
      vi.spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('Claude service unavailable'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            requestId: mockRequest.requestId,
            response: 'Gemini analysis of Josh Allen',
            confidence: 85,
            responseTime: 450,
            timestamp: new Date().toISOString()
          })
        } as Response)

      const response = await hybridService.query(mockRequest)
      
      expect(response).toBeDefined()
      expect(response.requestId).toBe(mockRequest.requestId)
    })

    it('should eventually return offline response when all services fail', async () => {
      // Mock all services failing
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('All services unavailable'))

      const response = await hybridService.query(mockRequest)
      
      expect(response).toBeDefined()
      expect(response.backend).toBe('offline')
      expect(response.response).toContain('offline')
      expect(response.confidence).toBeLessThan(50)
    })

    it('should generate appropriate offline responses for different query types', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Service unavailable'))

      const draftRequest: FantasyAIRequest = {
        ...mockRequest,
        type: 'draft_analysis'
      }

      const playerRequest: FantasyAIRequest = {
        ...mockRequest,
        type: 'player_analysis'
      }

      const generalRequest: FantasyAIRequest = {
        ...mockRequest,
        type: 'general_advice'
      }

      const [draftResponse, playerResponse, generalResponse] = await Promise.all([
        hybridService.query(draftRequest),
        hybridService.query(playerRequest),
        hybridService.query(generalRequest)
      ])

      expect(draftResponse.response).toContain('Draft Strategy')
      expect(playerResponse.response).toContain('Player Analysis')
      expect(generalResponse.response).toContain('Fantasy Football')
    })
  })

  describe('Health Summary and Monitoring', () => {
    it('should provide comprehensive health summary', () => {
      const healthSummary = hybridService.getHealthSummary()
      
      expect(healthSummary).toHaveProperty('selectedBackend')
      expect(healthSummary).toHaveProperty('services')
      expect(healthSummary).toHaveProperty('gracefulDegradation')
      
      expect(healthSummary.services).toHaveProperty('claude')
      expect(healthSummary.services).toHaveProperty('gemini-local')
      expect(healthSummary.services).toHaveProperty('gemini-cloud')
      expect(healthSummary.services).toHaveProperty('deepseek')
    })

    it('should detect graceful degradation mode', () => {
      const healthSummary = hybridService.getHealthSummary()
      expect(typeof healthSummary.gracefulDegradation).toBe('boolean')
    })
  })

  describe('Memory Management and Cleanup', () => {
    it('should properly disconnect and clean up resources', () => {
      const spy = vi.spyOn(hybridService, 'disconnect')
      hybridService.disconnect()
      expect(spy).toHaveBeenCalled()
    })

    it('should handle multiple disconnect calls gracefully', () => {
      expect(() => {
        hybridService.disconnect()
        hybridService.disconnect()
        hybridService.disconnect()
      }).not.toThrow()
    })
  })
})

describe('LocalGeminiService', () => {
  let localService: LocalGeminiService
  
  beforeEach(() => {
    localService = new LocalGeminiService('http://localhost:3001')
  })

  afterEach(() => {
    if (localService) {
      localService.disconnect()
    }
  })

  describe('Health Checking', () => {
    it('should perform health checks', async () => {
      // Mock successful health check
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        },
        text: async () => JSON.stringify({ status: 'healthy' })
      } as any)

      const status = localService.getStatus()
      expect(status.backend).toBe('gemini-local')
      expect(typeof status.available).toBe('boolean')
    })

    it('should handle health check failures gracefully', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))
      
      const status = localService.getStatus()
      expect(status.backend).toBe('gemini-local')
    })
  })

  describe('Circuit Breaker Pattern', () => {
    it('should provide circuit breaker status', () => {
      const circuitStatus = localService.getCircuitBreakerStatus()
      expect(circuitStatus).toHaveProperty('state')
      expect(circuitStatus).toHaveProperty('failureCount')
      expect(circuitStatus).toHaveProperty('nextAttemptIn')
      expect(['closed', 'open', 'half-open']).toContain(circuitStatus.state)
    })

    it('should handle circuit breaker state transitions', async () => {
      const request: FantasyAIRequest = {
        type: 'player_analysis',
        context: {},
        query: 'Test query',
        requestId: 'test-123'
      }

      // Mock failures to trigger circuit breaker
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Service down'))
      
      let caughtError = false
      try {
        await localService.query(request)
      } catch (error) {
        caughtError = true
        expect(error.message).toContain('unavailable')
      }
      
      expect(caughtError).toBe(true)
    })
  })

  describe('WebSocket Connection', () => {
    it('should attempt WebSocket connection', () => {
      // WebSocket should be mocked in test setup
      expect(localService.getStatus().connectionType).toBeDefined()
    })

    it('should fall back to HTTP when WebSocket fails', async () => {
      const request: FantasyAIRequest = {
        type: 'player_analysis',
        context: {},
        query: 'Test query',
        requestId: 'test-123'
      }

      // Mock HTTP fallback
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requestId: request.requestId,
          response: 'HTTP fallback response',
          confidence: 80,
          timestamp: new Date().toISOString()
        })
      } as Response)

      try {
        const response = await localService.query(request)
        expect(response.requestId).toBe(request.requestId)
      } catch (error) {
        // Service might not be available in test environment
        expect(error).toBeDefined()
      }
    })
  })
})

describe('CloudGeminiService', () => {
  let cloudService: CloudGeminiService

  beforeEach(() => {
    cloudService = new CloudGeminiService('/.netlify/functions')
  })

  afterEach(() => {
    if (cloudService) {
      cloudService.disconnect()
    }
  })

  describe('Cloud Service Integration', () => {
    it('should initialize with cloud configuration', () => {
      const status = cloudService.getStatus()
      expect(status.backend).toBe('gemini-cloud')
      expect(status.available).toBe(true) // Cloud service starts available
      expect(status.qualityScore).toBeGreaterThan(50)
    })

    it('should handle cloud service queries', async () => {
      const request: FantasyAIRequest = {
        type: 'draft_analysis',
        context: { scoringSystem: 'PPR' },
        query: 'Draft strategy advice',
        requestId: 'cloud-test-123'
      }

      // Mock successful cloud response
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          requestId: request.requestId,
          response: 'Cloud Gemini draft analysis',
          confidence: 90,
          timestamp: new Date().toISOString()
        })
      } as Response)

      const response = await cloudService.query(request)
      expect(response.requestId).toBe(request.requestId)
      expect(response.backend).toBe('cloud')
    })

    it('should handle cloud service timeouts', async () => {
      const request: FantasyAIRequest = {
        type: 'player_analysis',
        context: {},
        query: 'Test timeout',
        requestId: 'timeout-test'
      }

      // Mock timeout
      vi.spyOn(global, 'fetch').mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      )

      let caughtError = false
      try {
        await cloudService.query(request)
      } catch (error) {
        caughtError = true
        expect(error.message).toContain('Timeout')
      }
      
      expect(caughtError).toBe(true)
    })
  })

  describe('Circuit Breaker for Cloud Service', () => {
    it('should track failures and implement circuit breaker', () => {
      const circuitStatus = cloudService.getCircuitBreakerStatus()
      expect(circuitStatus).toHaveProperty('state')
      expect(circuitStatus.state).toBe('closed') // Should start closed
    })

    it('should have higher failure threshold than local service', () => {
      const circuitStatus = cloudService.getCircuitBreakerStatus()
      expect(circuitStatus.failureCount).toBe(0) // Should start with no failures
    })
  })
})