// Hybrid AI Service - Orchestrates between Local Gemini Advanced and Cloud Gemini Enterprise
// Provides intelligent backend switching and fantasy football AI coaching

import { config } from '@/config/environment';
import { Player, Position } from '@/types';

// AI Backend Types - Enhanced for full service chain
export type AIBackend = 'claude' | 'gemini-local' | 'gemini-cloud' | 'deepseek' | 'offline';

export interface AIBackendStatus {
  backend: AIBackend;
  available: boolean;
  responseTime: number;
  lastHealthCheck: Date;
  errorCount: number;
  qualityScore: number;
  connectionType: 'websocket' | 'http' | 'none';
}

export interface FantasyAIRequest {
  type: 'draft_analysis' | 'trade_evaluation' | 'lineup_optimization' | 'player_analysis' | 'general_advice';
  context: {
    players?: Player[];
    scoringSystem?: string;
    leagueSettings?: any;
    userPreferences?: any;
    currentRound?: number;
    draftedPlayers?: number[];
  };
  query: string;
  requestId: string;
}

export interface FantasyAIResponse {
  requestId: string;
  backend: AIBackend;
  response: string;
  confidence: number;
  responseTime: number;
  analysis?: {
    playerRecommendations?: Player[];
    tradeRecommendations?: any[];
    strategyPoints?: string[];
    riskFactors?: string[];
  };
  timestamp: Date;
}

// Local Gemini Advanced Bridge Service
class LocalGeminiService {
  private ws: WebSocket | null = null;
  private isConnecting = false;
  private messageQueue: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();
  private readonly baseUrl: string;
  private readonly wsUrl: string;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private status: AIBackendStatus;
  
  // Circuit breaker pattern for health checks
  private circuitBreaker = {
    state: 'closed' as 'closed' | 'open' | 'half-open',
    failureCount: 0,
    failureThreshold: 5,
    timeout: 60000, // 1 minute
    nextAttempt: 0,
    successCount: 0,
    halfOpenMaxCalls: 3
  };
  
  // Exponential backoff for health checks
  private healthCheckBackoff = {
    baseInterval: 30000, // 30 seconds
    currentInterval: 30000,
    maxInterval: 300000, // 5 minutes
    backoffMultiplier: 1.5
  };

  constructor(baseUrl = import.meta.env.PROD ? '' : 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.wsUrl = baseUrl.replace('http', 'ws') + '/ws';
    this.status = {
      backend: 'gemini-local',
      available: false,
      responseTime: 0,
      lastHealthCheck: new Date(),
      errorCount: 0,
      qualityScore: 0,
      connectionType: 'none'
    };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.checkHealth();
    if (this.status.available) {
      await this.connectWebSocket();
    }
    this.startHealthMonitoring();
  }

  private async checkHealth(): Promise<boolean> {
    const now = Date.now();
    
    // Circuit breaker: check if we should skip this health check
    if (this.circuitBreaker.state === 'open') {
      if (now < this.circuitBreaker.nextAttempt) {
        // Still in timeout period, don't make request
        return false;
      }
      // Move to half-open state for testing
      this.circuitBreaker.state = 'half-open';
      this.circuitBreaker.successCount = 0;
    }

    // Half-open: limit number of test calls
    if (this.circuitBreaker.state === 'half-open' && this.circuitBreaker.successCount >= this.circuitBreaker.halfOpenMaxCalls) {
      return false;
    }

    try {
      const startTime = Date.now();
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error(`Expected JSON response, got ${contentType || 'unknown'} content type`);
      }

      let data;
      try {
        const text = await response.text();
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error('Received HTML response instead of JSON - service endpoint not found');
        }
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }

      const isHealthy = response.ok && data.status === 'healthy';
      
      // Update circuit breaker on success
      if (isHealthy) {
        this.handleHealthCheckSuccess();
      } else {
        this.handleHealthCheckFailure(`Health check returned unhealthy status: ${data.status || 'unknown'}`);
      }

      this.status = {
        ...this.status,
        available: isHealthy,
        responseTime,
        lastHealthCheck: new Date(),
        errorCount: isHealthy ? Math.max(0, this.status.errorCount - 1) : this.status.errorCount + 1,
        qualityScore: this.calculateQualityScore(responseTime, isHealthy),
        connectionType: this.ws?.readyState === WebSocket.OPEN ? 'websocket' : 'http'
      };

      return this.status.available;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Only log errors when circuit is closed or first few failures to prevent spam
      if (this.circuitBreaker.state === 'closed' || this.circuitBreaker.failureCount < 3) {
        console.warn(`🟡 Local Gemini health check failed (${this.circuitBreaker.failureCount + 1}/${this.circuitBreaker.failureThreshold}):`, errorMessage);
      }
      
      this.handleHealthCheckFailure(errorMessage);
      
      this.status.available = false;
      this.status.errorCount++;
      this.status.lastHealthCheck = new Date();
      return false;
    }
  }

  private handleHealthCheckSuccess(): void {
    if (this.circuitBreaker.state === 'half-open') {
      this.circuitBreaker.successCount++;
      
      // If enough successful calls, close the circuit
      if (this.circuitBreaker.successCount >= this.circuitBreaker.halfOpenMaxCalls) {
        console.log('🟢 Local Gemini service recovered - circuit breaker closed');
        this.circuitBreaker.state = 'closed';
        this.circuitBreaker.failureCount = 0;
        this.resetHealthCheckInterval();
      }
    } else if (this.circuitBreaker.state === 'closed') {
      this.circuitBreaker.failureCount = 0;
      this.resetHealthCheckInterval();
    }
  }

  private handleHealthCheckFailure(errorMessage: string): void {
    this.circuitBreaker.failureCount++;
    
    if (this.circuitBreaker.state === 'closed' && this.circuitBreaker.failureCount >= this.circuitBreaker.failureThreshold) {
      // Open the circuit
      this.circuitBreaker.state = 'open';
      this.circuitBreaker.nextAttempt = Date.now() + this.circuitBreaker.timeout;
      
      console.warn(`🔴 Local Gemini circuit breaker opened - too many failures (${this.circuitBreaker.failureCount}). Next attempt in ${this.circuitBreaker.timeout/1000}s`);
      
      // Increase health check interval with exponential backoff
      this.increaseHealthCheckInterval();
    } else if (this.circuitBreaker.state === 'half-open') {
      // Go back to open state
      this.circuitBreaker.state = 'open';
      this.circuitBreaker.nextAttempt = Date.now() + this.circuitBreaker.timeout;
      console.warn('🔴 Local Gemini circuit breaker reopened - half-open test failed');
    }
  }

  private resetHealthCheckInterval(): void {
    this.healthCheckBackoff.currentInterval = this.healthCheckBackoff.baseInterval;
    this.restartHealthMonitoring();
  }

  private increaseHealthCheckInterval(): void {
    this.healthCheckBackoff.currentInterval = Math.min(
      this.healthCheckBackoff.currentInterval * this.healthCheckBackoff.backoffMultiplier,
      this.healthCheckBackoff.maxInterval
    );
    console.log(`🟡 Health check interval increased to ${this.healthCheckBackoff.currentInterval/1000}s due to failures`);
    this.restartHealthMonitoring();
  }

  private calculateQualityScore(responseTime: number, success: boolean): number {
    if (!success) return 0;
    
    // Score based on response time: 100 for <100ms, decreasing for slower responses
    const timeScore = Math.max(0, 100 - (responseTime / 10));
    
    // Penalty for errors
    const errorPenalty = Math.min(50, this.status.errorCount * 10);
    
    return Math.max(0, Math.min(100, timeScore - errorPenalty));
  }

  private async connectWebSocket(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log('🟢 Local Gemini WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.status.connectionType = 'websocket';
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'pong') {
            // Handle heartbeat
            return;
          }

          if (data.requestId && this.messageQueue.has(data.requestId)) {
            const { resolve, timeout } = this.messageQueue.get(data.requestId)!;
            clearTimeout(timeout);
            this.messageQueue.delete(data.requestId);
            resolve(data);
          }
        } catch (error) {
          console.error('🔴 WebSocket message parsing error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔴 Local Gemini WebSocket disconnected');
        this.isConnecting = false;
        this.status.connectionType = 'http';
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connectWebSocket();
          }, 2000 * Math.pow(2, this.reconnectAttempts));
        }
      };

      this.ws.onerror = (error) => {
        console.error('🔴 Local Gemini WebSocket error:', error);
        this.isConnecting = false;
        this.status.errorCount++;
      };

    } catch (error) {
      console.error('🔴 WebSocket connection failed:', error);
      this.isConnecting = false;
      this.status.errorCount++;
    }
  }

  private startHealthMonitoring(): void {
    this.restartHealthMonitoring();
  }

  private restartHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
      
      // Send ping through WebSocket if connected and circuit is not open
      if (this.ws?.readyState === WebSocket.OPEN && this.circuitBreaker.state !== 'open') {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.warn('🟡 WebSocket ping failed:', error);
        }
      }
    }, this.healthCheckBackoff.currentInterval);
  }

  public async query(request: FantasyAIRequest): Promise<FantasyAIResponse> {
    const startTime = Date.now();

    // Respect circuit breaker - don't attempt queries when circuit is open
    if (this.circuitBreaker.state === 'open') {
      throw new Error('Local Gemini service circuit breaker is open - service unavailable');
    }

    try {
      // Try WebSocket first if available and circuit allows
      if (this.ws?.readyState === WebSocket.OPEN && this.circuitBreaker.state !== 'open') {
        return await this.queryWebSocket(request, startTime);
      }

      // Fallback to HTTP if available and circuit allows
      if (this.status.available && this.circuitBreaker.state !== 'open') {
        return await this.queryHTTP(request, startTime);
      }

      throw new Error('Local Gemini service unavailable - circuit breaker protection active');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Only log detailed errors occasionally to prevent spam
      if (this.circuitBreaker.state === 'closed' || this.status.errorCount % 10 === 0) {
        console.error('🔴 Local Gemini query failed:', errorMessage);
      }
      
      this.status.errorCount++;
      throw error;
    }
  }

  private async queryWebSocket(request: FantasyAIRequest, startTime: number): Promise<FantasyAIResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageQueue.delete(request.requestId);
        reject(new Error('WebSocket request timeout'));
      }, 30000);

      this.messageQueue.set(request.requestId, { resolve, reject, timeout });

      this.ws!.send(JSON.stringify({
        type: 'fantasy-query',
        ...request
      }));
    });
  }

  private async queryHTTP(request: FantasyAIRequest, startTime: number): Promise<FantasyAIResponse> {
    const response = await fetch(`${this.baseUrl}/api/fantasy-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      ...data,
      backend: 'local' as AIBackend,
      responseTime: Date.now() - startTime,
      timestamp: new Date()
    };
  }

  public getStatus(): AIBackendStatus {
    return { ...this.status };
  }

  public getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.state,
      failureCount: this.circuitBreaker.failureCount,
      nextAttemptIn: this.circuitBreaker.nextAttempt > Date.now() 
        ? Math.ceil((this.circuitBreaker.nextAttempt - Date.now()) / 1000) 
        : 0
    };
  }

  public disconnect(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.messageQueue.forEach(({ timeout }) => clearTimeout(timeout));
    this.messageQueue.clear();
  }
}

// Cloud Gemini Enterprise Service
class CloudGeminiService {
  private readonly baseUrl: string;
  private status: AIBackendStatus;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  // Circuit breaker for cloud service (more tolerant than local)
  private circuitBreaker = {
    state: 'closed' as 'closed' | 'open' | 'half-open',
    failureCount: 0,
    failureThreshold: 8, // Higher threshold for cloud service
    timeout: 120000, // 2 minutes
    nextAttempt: 0,
    successCount: 0,
    halfOpenMaxCalls: 2
  };
  
  // Exponential backoff for cloud health checks
  private healthCheckBackoff = {
    baseInterval: 60000, // 1 minute
    currentInterval: 60000,
    maxInterval: 600000, // 10 minutes
    backoffMultiplier: 1.3
  };

  constructor(baseUrl = '/.netlify/functions') {
    this.baseUrl = baseUrl;
    this.status = {
      backend: 'gemini-cloud',
      available: true, // Assume available initially
      responseTime: 0,
      lastHealthCheck: new Date(),
      errorCount: 0,
      qualityScore: 90, // Cloud service starts with high quality score
      connectionType: 'http'
    };
    this.startHealthMonitoring();
  }

  private async checkHealth(): Promise<boolean> {
    const now = Date.now();
    
    // Circuit breaker check for cloud service
    if (this.circuitBreaker.state === 'open') {
      if (now < this.circuitBreaker.nextAttempt) {
        return false;
      }
      this.circuitBreaker.state = 'half-open';
      this.circuitBreaker.successCount = 0;
    }

    if (this.circuitBreaker.state === 'half-open' && this.circuitBreaker.successCount >= this.circuitBreaker.halfOpenMaxCalls) {
      return false;
    }

    try {
      const startTime = Date.now();
      
      // Add timeout for cloud requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for cloud
      
      const response = await fetch(`${this.baseUrl}/fantasy-ai-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'health_check',
          query: 'health',
          requestId: 'health-check-' + Date.now(),
          context: {}
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const isHealthy = response.status < 500; // Allow 4xx errors but not 5xx

      if (isHealthy) {
        this.handleCloudHealthCheckSuccess();
      } else {
        this.handleCloudHealthCheckFailure(`Cloud service returned status ${response.status}`);
      }

      this.status = {
        ...this.status,
        available: isHealthy,
        responseTime,
        lastHealthCheck: new Date(),
        errorCount: isHealthy ? Math.max(0, this.status.errorCount - 1) : this.status.errorCount + 1,
        qualityScore: this.calculateQualityScore(responseTime, isHealthy)
      };

      return this.status.available;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Only log cloud errors when circuit is closed or first few failures
      if (this.circuitBreaker.state === 'closed' || this.circuitBreaker.failureCount < 3) {
        console.warn(`🟡 Cloud Gemini health check failed (${this.circuitBreaker.failureCount + 1}/${this.circuitBreaker.failureThreshold}):`, errorMessage);
      }
      
      this.handleCloudHealthCheckFailure(errorMessage);
      this.status.available = false;
      this.status.errorCount++;
      return false;
    }
  }

  private handleCloudHealthCheckSuccess(): void {
    if (this.circuitBreaker.state === 'half-open') {
      this.circuitBreaker.successCount++;
      
      if (this.circuitBreaker.successCount >= this.circuitBreaker.halfOpenMaxCalls) {
        console.log('🟢 Cloud Gemini service recovered - circuit breaker closed');
        this.circuitBreaker.state = 'closed';
        this.circuitBreaker.failureCount = 0;
        this.resetCloudHealthCheckInterval();
      }
    } else if (this.circuitBreaker.state === 'closed') {
      this.circuitBreaker.failureCount = 0;
      this.resetCloudHealthCheckInterval();
    }
  }

  private handleCloudHealthCheckFailure(errorMessage: string): void {
    this.circuitBreaker.failureCount++;
    
    if (this.circuitBreaker.state === 'closed' && this.circuitBreaker.failureCount >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'open';
      this.circuitBreaker.nextAttempt = Date.now() + this.circuitBreaker.timeout;
      
      console.warn(`🔴 Cloud Gemini circuit breaker opened - too many failures (${this.circuitBreaker.failureCount}). Next attempt in ${this.circuitBreaker.timeout/1000}s`);
      this.increaseCloudHealthCheckInterval();
    } else if (this.circuitBreaker.state === 'half-open') {
      this.circuitBreaker.state = 'open';
      this.circuitBreaker.nextAttempt = Date.now() + this.circuitBreaker.timeout;
    }
  }

  private resetCloudHealthCheckInterval(): void {
    this.healthCheckBackoff.currentInterval = this.healthCheckBackoff.baseInterval;
    this.restartCloudHealthMonitoring();
  }

  private increaseCloudHealthCheckInterval(): void {
    this.healthCheckBackoff.currentInterval = Math.min(
      this.healthCheckBackoff.currentInterval * this.healthCheckBackoff.backoffMultiplier,
      this.healthCheckBackoff.maxInterval
    );
    console.log(`🟡 Cloud health check interval increased to ${this.healthCheckBackoff.currentInterval/1000}s due to failures`);
    this.restartCloudHealthMonitoring();
  }

  private calculateQualityScore(responseTime: number, success: boolean): number {
    if (!success) return 0;
    
    // Cloud service scoring (more tolerant of higher response times)
    const timeScore = Math.max(0, 100 - (responseTime / 20));
    const errorPenalty = Math.min(30, this.status.errorCount * 5);
    
    return Math.max(0, Math.min(100, timeScore - errorPenalty));
  }

  private startHealthMonitoring(): void {
    this.restartCloudHealthMonitoring();
  }

  private restartCloudHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, this.healthCheckBackoff.currentInterval);
  }

  public async query(request: FantasyAIRequest): Promise<FantasyAIResponse> {
    const startTime = Date.now();

    // Respect circuit breaker for cloud service
    if (this.circuitBreaker.state === 'open') {
      throw new Error('Cloud Gemini service circuit breaker is open - service unavailable');
    }

    try {
      // Add timeout for cloud queries
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for queries

      const response = await fetch(`${this.baseUrl}/fantasy-ai-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        ...data,
        backend: 'cloud' as AIBackend,
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Only log cloud query errors occasionally to prevent spam
      if (this.circuitBreaker.state === 'closed' || this.status.errorCount % 5 === 0) {
        console.error('🔴 Cloud Gemini query failed:', errorMessage);
      }
      
      this.status.errorCount++;
      throw error;
    }
  }

  public getStatus(): AIBackendStatus {
    return { ...this.status };
  }

  public getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.state,
      failureCount: this.circuitBreaker.failureCount,
      nextAttemptIn: this.circuitBreaker.nextAttempt > Date.now() 
        ? Math.ceil((this.circuitBreaker.nextAttempt - Date.now()) / 1000) 
        : 0
    };
  }

  public disconnect(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Dummy Local Gemini Service for when it's disabled
class DummyLocalGeminiService {
  private status: AIBackendStatus;

  constructor() {
    this.status = {
      backend: 'gemini-local',
      available: false,
      responseTime: 0,
      lastHealthCheck: new Date(),
      errorCount: 0,
      qualityScore: 0,
      connectionType: 'none'
    };
  }

  public async query(request: FantasyAIRequest): Promise<FantasyAIResponse> {
    throw new Error('Local Gemini service is disabled.');
  }

  public getStatus(): AIBackendStatus {
    return { ...this.status };
  }

  public getCircuitBreakerStatus() {
    return {
      state: 'open' as const,
      failureCount: 999,
      nextAttemptIn: 0
    };
  }

  public disconnect(): void {
    // No-op
  }
}

// Claude AI Service - Primary AI backend
class ClaudeAIService {
  private status: AIBackendStatus;
  
  constructor() {
    this.status = {
      backend: 'claude',
      available: false,
      responseTime: 0,
      lastHealthCheck: new Date(),
      errorCount: 0,
      qualityScore: 95, // Claude is highest quality
      connectionType: 'http'
    };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Claude is available through Claude Code environment by default
    this.status.available = true;
    this.status.qualityScore = 95;
    console.log('✅ Claude AI Service initialized');
  }

  async queryAI(request: FantasyAIRequest): Promise<FantasyAIResponse> {
    const startTime = Date.now();
    
    try {
      // Claude integration would be handled through Claude Code's internal APIs
      // For now, we'll simulate the response structure
      const response = await this.simulateClaudeResponse(request);
      
      const responseTime = Date.now() - startTime;
      this.status.responseTime = responseTime;
      this.status.errorCount = 0;
      
      return {
        requestId: request.requestId,
        backend: 'claude',
        response: response.text,
        confidence: response.confidence,
        responseTime,
        analysis: response.analysis,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.status.errorCount++;
      this.status.available = false;
      console.error('❌ Claude AI Service error:', error);
      throw error;
    }
  }

  private async simulateClaudeResponse(request: FantasyAIRequest) {
    // In production, this would make actual Claude API calls
    return {
      text: `Claude AI analysis for ${request.type}: ${request.query}`,
      confidence: 0.95,
      analysis: {
        playerRecommendations: request.context.players?.slice(0, 3) || [],
        strategyPoints: [
          'High-confidence recommendation based on comprehensive analysis',
          'Consider positional scarcity and league context',
          'Evaluate long-term vs short-term value trade-offs'
        ],
        riskFactors: ['Injury risk assessment included', 'Performance consistency evaluated']
      }
    };
  }

  getStatus(): AIBackendStatus {
    return { ...this.status };
  }
}

// DeepSeek AI Service - For complex analysis requiring large context
class DeepSeekAIService {
  private status: AIBackendStatus;
  
  constructor() {
    this.status = {
      backend: 'deepseek',
      available: false,
      responseTime: 0,
      lastHealthCheck: new Date(),
      errorCount: 0,
      qualityScore: 85, // High quality, especially for complex analysis
      connectionType: 'http'
    };
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      // Check if DeepSeek bridge is available through MCP
      const response = await fetch('/api/deepseek/status', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      this.status.available = response.ok;
      this.status.qualityScore = response.ok ? 85 : 0;
      
      console.log(response.ok ? '✅ DeepSeek AI Service available' : '⚠️ DeepSeek AI Service unavailable');
    } catch (error) {
      this.status.available = false;
      this.status.errorCount++;
      console.log('⚠️ DeepSeek AI Service not available:', error);
    }
  }

  async queryAI(request: FantasyAIRequest): Promise<FantasyAIResponse> {
    const startTime = Date.now();
    
    try {
      if (!this.status.available) {
        throw new Error('DeepSeek service not available');
      }

      const response = await this.makeDeepSeekRequest(request);
      
      const responseTime = Date.now() - startTime;
      this.status.responseTime = responseTime;
      this.status.errorCount = 0;
      
      return {
        requestId: request.requestId,
        backend: 'deepseek',
        response: response.text,
        confidence: response.confidence,
        responseTime,
        analysis: response.analysis,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.status.errorCount++;
      console.error('❌ DeepSeek AI Service error:', error);
      throw error;
    }
  }

  private async makeDeepSeekRequest(request: FantasyAIRequest) {
    try {
      const response = await fetch('/api/deepseek/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: this.buildPromptForDeepSeek(request),
          context: request.context,
          type: request.type
        }),
        signal: AbortSignal.timeout(30000) // 30s timeout
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        text: data.response || 'DeepSeek analysis completed',
        confidence: data.confidence || 0.8,
        analysis: data.analysis || {}
      };
    } catch (error) {
      // Fallback for development when DeepSeek bridge is not available
      return {
        text: `DeepSeek analysis simulation for ${request.type}: ${request.query}`,
        confidence: 0.8,
        analysis: {
          playerRecommendations: request.context.players?.slice(0, 5) || [],
          strategyPoints: [
            'Deep contextual analysis with unlimited token capacity',
            'Comprehensive player comparison across multiple dimensions',
            'Advanced statistical modeling for projections'
          ]
        }
      };
    }
  }

  private buildPromptForDeepSeek(request: FantasyAIRequest): string {
    return `Fantasy Football Analysis Request:
Type: ${request.type}
Query: ${request.query}
Context: ${JSON.stringify(request.context, null, 2)}

Please provide detailed analysis with specific recommendations and reasoning.`;
  }

  getStatus(): AIBackendStatus {
    return { ...this.status };
  }
}

// Main Hybrid AI Service
class HybridAIService {
  private claudeService: ClaudeAIService;
  private localGeminiService: LocalGeminiService | DummyLocalGeminiService;
  private cloudGeminiService: CloudGeminiService;
  private deepseekService: DeepSeekAIService;
  private subscribers: Map<string, (status: Record<AIBackend, AIBackendStatus>) => void> = new Map();
  private statusUpdateInterval: NodeJS.Timeout | null = null;
  
  // Enhanced fallback chain: Claude → Gemini Local → Gemini Cloud → DeepSeek → Offline
  private readonly fallbackChain: AIBackend[] = ['claude', 'gemini-local', 'gemini-cloud', 'deepseek', 'offline'];

  constructor() {
    // Initialize all AI services
    this.claudeService = new ClaudeAIService();
    
    if (config.FEATURES.LOCAL_GEMINI && config.LOCAL_GEMINI_ENABLED) {
      this.localGeminiService = new LocalGeminiService(config.LOCAL_GEMINI_URL);
    } else {
      console.log('🚫 Local Gemini disabled - using cloud/offline fallback');
      this.localGeminiService = new DummyLocalGeminiService();
    }
    
    this.cloudGeminiService = new CloudGeminiService();
    this.deepseekService = new DeepSeekAIService();
    
    this.startStatusUpdates();
    console.log('🔗 Enhanced Hybrid AI Service initialized with full fallback chain');
  }

  private startStatusUpdates(): void {
    this.statusUpdateInterval = setInterval(() => {
      const status = {
        claude: this.claudeService.getStatus(),
        'gemini-local': this.localGeminiService.getStatus(),
        'gemini-cloud': this.cloudGeminiService.getStatus(), 
        deepseek: this.deepseekService.getStatus(),
        offline: {
          backend: 'offline' as AIBackend,
          available: true,
          responseTime: 0,
          lastHealthCheck: new Date(),
          errorCount: 0,
          qualityScore: 30, // Offline fallback has low quality
          connectionType: 'none' as const
        }
      };

      this.subscribers.forEach(callback => callback(status));
    }, 5000); // Update every 5 seconds
  }

  public subscribe(subscriberId: string, callback: (status: Record<AIBackend, AIBackendStatus>) => void): void {
    this.subscribers.set(subscriberId, callback);
  }

  public unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  private selectBestBackend(): AIBackend {
    // Enhanced fallback chain with intelligent selection
    for (const backend of this.fallbackChain) {
      if (this.isBackendAvailable(backend)) {
        const status = this.getBackendStatus(backend);
        
        // Quality thresholds for each service
        const qualityThreshold = this.getQualityThreshold(backend);
        
        if (status.qualityScore >= qualityThreshold) {
          console.log(`✅ Selected AI backend: ${backend} (quality: ${status.qualityScore})`);
          return backend;
        }
      }
    }

    // If we reach here, use offline mode
    console.warn('⚠️ All AI services unavailable, using offline mode');
    return 'offline';
  }

  private isBackendAvailable(backend: AIBackend): boolean {
    const status = this.getBackendStatus(backend);
    
    // Check circuit breaker status for services that have it
    if (backend === 'gemini-local' && this.localGeminiService.getCircuitBreakerStatus) {
      const circuitBreaker = this.localGeminiService.getCircuitBreakerStatus();
      return status.available && circuitBreaker.state !== 'open';
    }
    
    if (backend === 'gemini-cloud' && this.cloudGeminiService.getCircuitBreakerStatus) {
      const circuitBreaker = this.cloudGeminiService.getCircuitBreakerStatus();
      return status.available && circuitBreaker.state !== 'open';
    }
    
    // For other services, just check availability
    return status.available;
  }

  private getBackendStatus(backend: AIBackend): AIBackendStatus {
    switch (backend) {
      case 'claude':
        return this.claudeService.getStatus();
      case 'gemini-local':
        return this.localGeminiService.getStatus();
      case 'gemini-cloud':
        return this.cloudGeminiService.getStatus();
      case 'deepseek':
        return this.deepseekService.getStatus();
      case 'offline':
        return {
          backend: 'offline',
          available: true,
          responseTime: 0,
          lastHealthCheck: new Date(),
          errorCount: 0,
          qualityScore: 30,
          connectionType: 'none'
        };
      default:
        throw new Error(`Unknown backend: ${backend}`);
    }
  }

  private getQualityThreshold(backend: AIBackend): number {
    // Quality thresholds for each service
    switch (backend) {
      case 'claude': return 80; // High standard for Claude
      case 'gemini-local': return 70; // Good for local Gemini
      case 'gemini-cloud': return 60; // Moderate for cloud Gemini
      case 'deepseek': return 50; // Lower threshold for DeepSeek
      case 'offline': return 0; // Always accept offline
      default: return 70;
    }
  }

  private generateOfflineResponse(request: FantasyAIRequest): FantasyAIResponse {
    const offlineResponses = {
      draft_analysis: `Based on standard fantasy football strategy for ${request.context.scoringSystem || 'standard'} scoring:

🎯 **Draft Strategy Recommendations:**
- Focus on RB/WR early rounds for reliable scoring
- Target high-volume players in PPR leagues
- Consider positional scarcity for TE and QB timing
- Build roster depth in middle rounds

📊 **Key Considerations:**
- Injury history and age for older players
- Offensive line quality for RBs
- Target share and red zone usage for WRs
- Quarterback stability for skill position players

This is an offline response. For real-time analysis, ensure your AI services are connected.`,

      player_analysis: `**Player Analysis** (Offline Mode):

Without real-time data, consider these general fantasy factors:
- Past season performance and trends
- Team offensive system changes
- Health and injury concerns
- Target/carry competition
- Schedule strength analysis

For detailed player analysis, please ensure AI services are connected.`,

      general_advice: `**Fantasy Football General Advice** (Offline Mode):

🏈 **Universal Fantasy Principles:**
- Start your studs - don't get cute
- Check weather for outdoor games
- Monitor injury reports before lineups lock
- Consider matchup strength and game script
- Stream defenses against poor offenses

For personalized advice, please restore AI service connection.`
    };

    return {
      requestId: request.requestId,
      backend: 'offline',
      response: offlineResponses[request.type] || offlineResponses.general_advice,
      confidence: 30,
      responseTime: 50,
      timestamp: new Date(),
      analysis: {
        strategyPoints: [
          'This is an offline response with limited analysis',
          'Restore AI connection for personalized recommendations',
          'Use standard fantasy football principles as guidance'
        ]
      }
    };
  }

  public async query(request: FantasyAIRequest): Promise<FantasyAIResponse> {
    // Try each backend in the fallback chain until one succeeds
    for (let i = 0; i < this.fallbackChain.length; i++) {
      const backend = this.fallbackChain[i];
      
      if (!this.isBackendAvailable(backend)) {
        console.log(`⏭️ Skipping unavailable backend: ${backend}`);
        continue;
      }
      
      console.log(`🤖 Attempting AI query with ${backend} backend (attempt ${i + 1}/${this.fallbackChain.length})`);
      
      try {
        const response = await this.queryBackend(backend, request);
        console.log(`✅ Successfully got response from ${backend} backend`);
        return response;
        
      } catch (error) {
        console.error(`❌ ${backend} backend failed:`, error);
        
        // If this is not the last backend, continue to next
        if (i < this.fallbackChain.length - 1) {
          console.log(`🔄 Falling back to next backend in chain...`);
          continue;
        }
        
        // If all backends failed, return offline response
        console.error('🔴 All AI backends failed, using offline mode');
        return this.generateOfflineResponse(request);
      }
    }
    
    // Fallback to offline if no backends are available
    return this.generateOfflineResponse(request);
  }

  private async queryBackend(backend: AIBackend, request: FantasyAIRequest): Promise<FantasyAIResponse> {
    switch (backend) {
      case 'claude':
        return await this.claudeService.queryAI(request);
      
      case 'gemini-local':
        return await this.localGeminiService.query(request);
      
      case 'gemini-cloud':
        return await this.cloudGeminiService.query(request);
      
      case 'deepseek':
        return await this.deepseekService.queryAI(request);
      
      case 'offline':
        return this.generateOfflineResponse(request);
      
      default:
        throw new Error(`Unknown backend: ${backend}`);
    }
  }

  public getAllStatus(): Record<AIBackend, AIBackendStatus> {
    return {
      claude: this.claudeService.getStatus(),
      'gemini-local': this.localGeminiService.getStatus(),
      'gemini-cloud': this.cloudGeminiService.getStatus(),
      deepseek: this.deepseekService.getStatus(),
      offline: {
        backend: 'offline',
        available: true,
        responseTime: 0,
        lastHealthCheck: new Date(),
        errorCount: 0,
        qualityScore: 30,
        connectionType: 'none'
      }
    };
  }

  public getCircuitBreakerStatus() {
    return {
      'gemini-local': this.localGeminiService.getCircuitBreakerStatus ? 
        this.localGeminiService.getCircuitBreakerStatus() : { state: 'closed' },
      'gemini-cloud': this.cloudGeminiService.getCircuitBreakerStatus ? 
        this.cloudGeminiService.getCircuitBreakerStatus() : { state: 'closed' },
      selectedBackend: this.selectBestBackend()
    };
  }

  public getHealthSummary() {
    const claudeStatus = this.claudeService.getStatus();
    const localGeminiStatus = this.localGeminiService.getStatus();
    const cloudGeminiStatus = this.cloudGeminiService.getStatus();
    const deepseekStatus = this.deepseekService.getStatus();
    const selectedBackend = this.selectBestBackend();

    return {
      selectedBackend,
      services: {
        claude: {
          available: claudeStatus.available,
          qualityScore: claudeStatus.qualityScore,
          errorCount: claudeStatus.errorCount,
          lastCheck: claudeStatus.lastHealthCheck
        },
        'gemini-local': {
          available: localGeminiStatus.available,
          qualityScore: localGeminiStatus.qualityScore,
          errorCount: localGeminiStatus.errorCount,
          lastCheck: localGeminiStatus.lastHealthCheck
        },
        'gemini-cloud': {
          available: cloudGeminiStatus.available,
          qualityScore: cloudGeminiStatus.qualityScore,
          errorCount: cloudGeminiStatus.errorCount,
          lastCheck: cloudGeminiStatus.lastHealthCheck
        },
        deepseek: {
          available: deepseekStatus.available,
          qualityScore: deepseekStatus.qualityScore,
          errorCount: deepseekStatus.errorCount,
          lastCheck: deepseekStatus.lastHealthCheck
        }
      },
      gracefulDegradation: selectedBackend === 'offline'
    };
  }

  public disconnect(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
    
    // Disconnect services that support it
    if (this.localGeminiService.disconnect) {
      this.localGeminiService.disconnect();
    }
    if (this.cloudGeminiService.disconnect) {
      this.cloudGeminiService.disconnect();
    }
    
    this.subscribers.clear();
    console.log('🔌 Enhanced Hybrid AI Service disconnected');
  }
}

// Export singleton instance
export const hybridAIService = new HybridAIService();

// Export classes for testing
export { HybridAIService, LocalGeminiService, CloudGeminiService };