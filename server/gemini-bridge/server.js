// Local Gemini Advanced Bridge Server
// Production-ready Express.js server for Fantasy Football Analyzer
// Provides unlimited token AI coaching through local Gemini Advanced MCP

const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const http = require('http');
const axios = require('axios');
const { EventEmitter } = require('events');
const config = require('./config');

class GeminiAdvancedBridge extends EventEmitter {
  constructor() {
    super();
    this.app = express();
    this.server = null;
    this.wss = null;
    this.clients = new Map();
    this.geminiEndpoints = new Map();
    this.healthStatus = {
      server: false,
      gemini: false,
      lastCheck: null
    };
    this.requestCounter = 0;
    this.activeConnections = 0;
    this.messageQueue = [];
    this.processingQueue = false;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.initializeDiscovery();
  }

  // Setup Express middleware
  setupMiddleware() {
    // CORS configuration for React frontend
    this.app.use(cors({
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      credentials: true
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging and correlation
    this.app.use((req, res, next) => {
      req.requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      req.startTime = Date.now();
      
      console.log(`📥 [${req.requestId}] ${req.method} ${req.path} from ${req.ip}`);
      
      res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        console.log(`📤 [${req.requestId}] ${res.statusCode} ${res.statusMessage} (${duration}ms)`);
      });
      
      next();
    });

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error(`❌ [${req.requestId}] Error:`, err);
      
      res.status(err.status || 500).json({
        success: false,
        error: {
          message: err.message || 'Internal Server Error',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    });
  }

  // Setup HTTP routes
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const health = {
        server: true,
        gemini: this.healthStatus.gemini,
        endpoints: Array.from(this.geminiEndpoints.keys()),
        uptime: process.uptime(),
        connections: this.activeConnections,
        requestCount: this.requestCounter,
        timestamp: new Date().toISOString()
      };
      
      res.json(health);
    });

    // Discovery endpoint
    this.app.get('/api/discover', (req, res) => {
      const endpoints = Array.from(this.geminiEndpoints.entries()).map(([url, data]) => ({
        url,
        status: data.status,
        lastCheck: data.lastCheck,
        models: data.models || [],
        version: data.version || 'unknown'
      }));

      res.json({
        success: true,
        endpoints,
        timestamp: new Date().toISOString()
      });
    });

    // Fantasy Football AI endpoint
    this.app.post('/api/fantasy-ai', async (req, res) => {
      try {
        this.requestCounter++;
        const { prompt, context, analysisType, playerData } = req.body;

        if (!prompt || typeof prompt !== 'string') {
          return res.status(400).json({
            success: false,
            error: { message: 'Invalid prompt provided' }
          });
        }

        const result = await this.processFantasyQuery({
          prompt,
          context: context || {},
          analysisType: analysisType || 'general',
          playerData: playerData || [],
          requestId: req.requestId
        });

        res.json({
          success: true,
          data: result,
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(`❌ Fantasy AI error:`, error);
        res.status(500).json({
          success: false,
          error: { message: error.message },
          requestId: req.requestId
        });
      }
    });

    // Batch analysis endpoint
    this.app.post('/api/fantasy-batch', async (req, res) => {
      try {
        const { queries } = req.body;
        
        if (!Array.isArray(queries)) {
          return res.status(400).json({
            success: false,
            error: { message: 'Queries must be an array' }
          });
        }

        const results = await Promise.all(
          queries.map(query => this.processFantasyQuery({
            ...query,
            requestId: `${req.requestId}-batch-${query.id || Math.random()}`
          }))
        );

        res.json({
          success: true,
          data: results,
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(`❌ Batch analysis error:`, error);
        res.status(500).json({
          success: false,
          error: { message: error.message },
          requestId: req.requestId
        });
      }
    });

    // Status endpoint
    this.app.get('/api/status', (req, res) => {
      res.json({
        success: true,
        data: {
          server: {
            status: 'running',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            connections: this.activeConnections
          },
          gemini: {
            status: this.healthStatus.gemini ? 'connected' : 'disconnected',
            endpoints: this.geminiEndpoints.size,
            lastCheck: this.healthStatus.lastCheck
          },
          stats: {
            totalRequests: this.requestCounter,
            queueSize: this.messageQueue.length,
            activeClients: this.clients.size
          }
        },
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: { message: 'Endpoint not found' },
        requestId: req.requestId
      });
    });
  }

  // Setup WebSocket server
  setupWebSocket() {
    this.server = http.createServer(this.app);
    
    this.wss = new WebSocket.Server({
      server: this.server,
      path: '/ws',
      verifyClient: (info) => {
        // Basic origin verification
        const origin = info.origin;
        return config.corsOrigins.includes('*') || config.corsOrigins.some(allowed => 
          origin === allowed || origin?.endsWith(allowed.replace('*', ''))
        );
      }
    });

    this.wss.on('connection', (ws, request) => {
      const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const clientInfo = {
        id: clientId,
        ws,
        connected: new Date(),
        lastActivity: new Date(),
        subscriptions: new Set(),
        ip: request.socket.remoteAddress
      };

      this.clients.set(clientId, clientInfo);
      this.activeConnections++;
      
      console.log(`🔌 WebSocket client connected: ${clientId} (${this.activeConnections} total)`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'welcome',
        data: {
          clientId,
          server: 'gemini-bridge',
          version: '1.0.0',
          capabilities: [
            'fantasy-analysis',
            'real-time-coaching',
            'draft-strategy',
            'player-valuation'
          ]
        }
      });

      // Setup message handlers
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(clientId, message);
        } catch (error) {
          console.error(`❌ WebSocket message error from ${clientId}:`, error);
          this.sendToClient(clientId, {
            type: 'error',
            data: { message: 'Invalid message format' }
          });
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(clientId);
        this.activeConnections--;
        console.log(`🔌 WebSocket client disconnected: ${clientId} (${this.activeConnections} remaining)`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for ${clientId}:`, error);
        this.clients.delete(clientId);
        this.activeConnections--;
      });

      // Heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          this.sendToClient(clientId, { type: 'ping', timestamp: Date.now() });
        } else {
          clearInterval(heartbeat);
        }
      }, config.heartbeatInterval);
    });
  }

  // Handle WebSocket messages
  async handleWebSocketMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    switch (message.type) {
      case 'pong':
        // Client heartbeat response
        break;

      case 'subscribe':
        if (message.channel) {
          client.subscriptions.add(message.channel);
          this.sendToClient(clientId, {
            type: 'subscribed',
            channel: message.channel
          });
        }
        break;

      case 'unsubscribe':
        if (message.channel) {
          client.subscriptions.delete(message.channel);
          this.sendToClient(clientId, {
            type: 'unsubscribed',
            channel: message.channel
          });
        }
        break;

      case 'fantasy-query':
        await this.handleRealtimeFantasyQuery(clientId, message);
        break;

      case 'draft-analysis':
        await this.handleDraftAnalysis(clientId, message);
        break;

      case 'player-evaluation':
        await this.handlePlayerEvaluation(clientId, message);
        break;

      default:
        this.sendToClient(clientId, {
          type: 'error',
          data: { message: `Unknown message type: ${message.type}` }
        });
    }
  }

  // Handle real-time fantasy queries
  async handleRealtimeFantasyQuery(clientId, message) {
    try {
      const { query, context } = message.data || {};
      
      // Send acknowledgment
      this.sendToClient(clientId, {
        type: 'query-received',
        messageId: message.id,
        status: 'processing'
      });

      const result = await this.processFantasyQuery({
        prompt: query,
        context,
        analysisType: 'realtime',
        requestId: `ws-${clientId}-${message.id}`
      });

      this.sendToClient(clientId, {
        type: 'query-result',
        messageId: message.id,
        data: result
      });

    } catch (error) {
      console.error(`❌ Real-time query error:`, error);
      this.sendToClient(clientId, {
        type: 'query-error',
        messageId: message.id,
        error: error.message
      });
    }
  }

  // Handle draft analysis
  async handleDraftAnalysis(clientId, message) {
    try {
      const { draftData, position, availablePlayers } = message.data || {};

      const analysisPrompt = config.fantasyPrompts.draftStrategy
        .replace('{position}', position || 'unknown')
        .replace('{availablePlayers}', JSON.stringify(availablePlayers || []));

      const result = await this.processFantasyQuery({
        prompt: analysisPrompt,
        context: { draftData, position, availablePlayers },
        analysisType: 'draft',
        requestId: `draft-${clientId}-${message.id}`
      });

      this.sendToClient(clientId, {
        type: 'draft-analysis-result',
        messageId: message.id,
        data: result
      });

    } catch (error) {
      console.error(`❌ Draft analysis error:`, error);
      this.sendToClient(clientId, {
        type: 'draft-analysis-error',
        messageId: message.id,
        error: error.message
      });
    }
  }

  // Handle player evaluation
  async handlePlayerEvaluation(clientId, message) {
    try {
      const { players, week, scoringSystem } = message.data || {};

      const evaluationPrompt = config.fantasyPrompts.playerValuation
        .replace('{players}', JSON.stringify(players || []))
        .replace('{week}', week || 'current')
        .replace('{scoring}', scoringSystem || 'PPR');

      const result = await this.processFantasyQuery({
        prompt: evaluationPrompt,
        context: { players, week, scoringSystem },
        analysisType: 'evaluation',
        requestId: `eval-${clientId}-${message.id}`
      });

      this.sendToClient(clientId, {
        type: 'player-evaluation-result',
        messageId: message.id,
        data: result
      });

    } catch (error) {
      console.error(`❌ Player evaluation error:`, error);
      this.sendToClient(clientId, {
        type: 'player-evaluation-error',
        messageId: message.id,
        error: error.message
      });
    }
  }

  // Send message to specific client
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString(),
          clientId
        }));
      } catch (error) {
        console.error(`❌ Failed to send message to ${clientId}:`, error);
        this.clients.delete(clientId);
        this.activeConnections--;
      }
    }
  }

  // Broadcast to all clients or specific channel
  broadcast(message, channel = null) {
    for (const [clientId, client] of this.clients.entries()) {
      if (!channel || client.subscriptions.has(channel)) {
        this.sendToClient(clientId, message);
      }
    }
  }

  // Initialize Gemini MCP discovery
  async initializeDiscovery() {
    console.log('🔍 Initializing Gemini Advanced MCP discovery...');
    
    // Start discovery process
    await this.discoverGeminiEndpoints();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Start queue processing
    this.startMessageQueueProcessing();
  }

  // Discover available Gemini MCP endpoints
  async discoverGeminiEndpoints() {
    const discoveryTargets = config.discovery.endpoints;
    const discoveryPromises = discoveryTargets.map(endpoint => 
      this.checkGeminiEndpoint(endpoint)
    );

    try {
      const results = await Promise.allSettled(discoveryPromises);
      
      let foundEndpoints = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          foundEndpoints++;
          console.log(`✅ Discovered Gemini endpoint: ${discoveryTargets[index]}`);
        } else {
          console.log(`❌ Failed to connect to: ${discoveryTargets[index]}`);
        }
      });

      this.healthStatus.gemini = foundEndpoints > 0;
      this.healthStatus.lastCheck = new Date();
      
      console.log(`🔍 Discovery complete: ${foundEndpoints}/${discoveryTargets.length} endpoints available`);
      
    } catch (error) {
      console.error('❌ Discovery error:', error);
      this.healthStatus.gemini = false;
    }
  }

  // Check individual Gemini endpoint
  async checkGeminiEndpoint(endpoint) {
    try {
      const response = await axios.get(`${endpoint}/health`, {
        timeout: config.discovery.timeout,
        headers: { 'User-Agent': 'Fantasy-Football-Analyzer/1.0' }
      });

      if (response.status === 200) {
        const endpointInfo = {
          status: 'available',
          lastCheck: new Date(),
          models: response.data.models || [],
          version: response.data.version || 'unknown',
          capabilities: response.data.capabilities || []
        };

        this.geminiEndpoints.set(endpoint, endpointInfo);
        return true;
      }
      
      return false;
    } catch (error) {
      // Remove failed endpoint
      this.geminiEndpoints.delete(endpoint);
      return false;
    }
  }

  // Process fantasy football queries
  async processFantasyQuery(options) {
    const { prompt, context, analysisType, playerData, requestId } = options;

    // Get available Gemini endpoint
    const endpoint = this.getAvailableEndpoint();
    if (!endpoint) {
      throw new Error('No Gemini Advanced MCP endpoints available');
    }

    try {
      // Enhance prompt with fantasy football context
      const enhancedPrompt = this.enhanceFantasyPrompt(prompt, {
        context,
        analysisType,
        playerData,
        scoringSystem: context?.scoringSystem || 'PPR'
      });

      // Send request to Gemini MCP
      const response = await axios.post(`${endpoint}/api/query`, {
        prompt: enhancedPrompt,
        task_type: 'game_dev', // Fantasy sports gaming
        context: JSON.stringify({
          sport: 'nfl',
          season: '2024',
          analysisType,
          requestId,
          ...context
        })
      }, {
        timeout: config.requestTimeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Fantasy-Football-Analyzer/1.0'
        }
      });

      if (response.status === 200) {
        return {
          analysis: response.data.response || response.data.result,
          confidence: response.data.confidence || 0.85,
          endpoint: endpoint,
          processingTime: response.data.processing_time || 0,
          model: response.data.model || 'unknown',
          requestId
        };
      } else {
        throw new Error(`Gemini MCP returned status: ${response.status}`);
      }

    } catch (error) {
      console.error(`❌ Query processing error:`, error);
      
      // Mark endpoint as potentially unavailable
      const endpointData = this.geminiEndpoints.get(endpoint);
      if (endpointData) {
        endpointData.status = 'error';
        endpointData.lastError = error.message;
      }
      
      throw new Error(`Fantasy analysis failed: ${error.message}`);
    }
  }

  // Enhance prompts with fantasy football intelligence
  enhanceFantasyPrompt(originalPrompt, options) {
    const { context, analysisType, playerData, scoringSystem } = options;
    
    let enhancedPrompt = `${config.fantasyPrompts.systemContext}\n\n`;
    
    // Add scoring system context
    enhancedPrompt += `SCORING SYSTEM: ${scoringSystem} (Points Per Reception)\n`;
    enhancedPrompt += `ANALYSIS TYPE: ${analysisType}\n`;
    enhancedPrompt += `CURRENT WEEK: ${this.getCurrentNFLWeek()}\n\n`;

    // Add player data context if available
    if (playerData && playerData.length > 0) {
      enhancedPrompt += `RELEVANT PLAYERS:\n`;
      playerData.slice(0, 10).forEach(player => {
        enhancedPrompt += `- ${player.name} (${player.position}, ${player.team}) - Rank: ${player.rank || 'N/A'}\n`;
      });
      enhancedPrompt += '\n';
    }

    // Add draft context if available
    if (context?.currentRound) {
      enhancedPrompt += `DRAFT CONTEXT:\n`;
      enhancedPrompt += `- Round: ${context.currentRound}\n`;
      enhancedPrompt += `- Pick: ${context.currentPick || 'N/A'}\n`;
      enhancedPrompt += `- Position: ${context.draftPosition || 'N/A'}\n\n`;
    }

    // Add the original prompt
    enhancedPrompt += `USER QUERY: ${originalPrompt}\n\n`;
    
    // Add analysis instructions
    enhancedPrompt += config.fantasyPrompts.analysisInstructions;

    return enhancedPrompt;
  }

  // Get available Gemini endpoint
  getAvailableEndpoint() {
    const availableEndpoints = Array.from(this.geminiEndpoints.entries())
      .filter(([_, data]) => data.status === 'available')
      .map(([endpoint, _]) => endpoint);

    if (availableEndpoints.length === 0) {
      return null;
    }

    // Simple round-robin selection
    const index = this.requestCounter % availableEndpoints.length;
    return availableEndpoints[index];
  }

  // Get current NFL week
  getCurrentNFLWeek() {
    const now = new Date();
    const seasonStart = new Date('2024-09-05'); // NFL Week 1 2024
    const weekDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(18, weekDiff + 1));
  }

  // Start health monitoring
  startHealthMonitoring() {
    console.log('💓 Starting health monitoring...');
    
    setInterval(async () => {
      await this.discoverGeminiEndpoints();
      
      // Broadcast status to subscribed clients
      this.broadcast({
        type: 'health-update',
        data: {
          gemini: this.healthStatus.gemini,
          endpoints: this.geminiEndpoints.size,
          lastCheck: this.healthStatus.lastCheck
        }
      }, 'health');
      
    }, config.healthCheckInterval);
  }

  // Start message queue processing
  startMessageQueueProcessing() {
    console.log('📨 Starting message queue processing...');
    
    setInterval(async () => {
      if (!this.processingQueue && this.messageQueue.length > 0) {
        this.processingQueue = true;
        
        try {
          const message = this.messageQueue.shift();
          if (message) {
            await this.processQueuedMessage(message);
          }
        } catch (error) {
          console.error('❌ Queue processing error:', error);
        } finally {
          this.processingQueue = false;
        }
      }
    }, config.queueProcessingInterval);
  }

  // Process queued message
  async processQueuedMessage(message) {
    // Implementation for processing queued messages
    console.log('📨 Processing queued message:', message.type);
  }

  // Start the server
  async start() {
    try {
      this.server.listen(config.server.port, config.server.host, () => {
        console.log(`🚀 Gemini Advanced Bridge Server running on ${config.server.host}:${config.server.port}`);
        console.log(`📡 WebSocket server available at ws://${config.server.host}:${config.server.port}/ws`);
        console.log(`🏥 Health endpoint: http://${config.server.host}:${config.server.port}/health`);
        
        this.healthStatus.server = true;
      });

      // Graceful shutdown handling
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  // Graceful shutdown
  async shutdown() {
    console.log('\n🛑 Initiating graceful shutdown...');
    
    // Close WebSocket connections
    if (this.wss) {
      this.broadcast({ type: 'server-shutdown' });
      this.wss.close();
    }
    
    // Close HTTP server
    if (this.server) {
      this.server.close();
    }
    
    console.log('✅ Server shutdown complete');
    process.exit(0);
  }

  // Get server statistics
  getStats() {
    return {
      uptime: process.uptime(),
      connections: this.activeConnections,
      totalRequests: this.requestCounter,
      queueSize: this.messageQueue.length,
      memoryUsage: process.memoryUsage(),
      endpoints: this.geminiEndpoints.size,
      healthStatus: this.healthStatus
    };
  }
}

// Create and start server
const bridge = new GeminiAdvancedBridge();
bridge.start();

module.exports = GeminiAdvancedBridge;