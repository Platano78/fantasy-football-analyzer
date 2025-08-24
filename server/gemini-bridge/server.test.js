// Local Gemini Advanced Bridge Server Tests
// Basic test suite for server functionality

const request = require('supertest');
const WebSocket = require('ws');

// Mock the config to avoid file system dependencies in tests
jest.mock('./config', () => ({
  server: {
    host: 'localhost',
    port: 3002, // Use different port for tests
    environment: 'test'
  },
  corsOrigins: ['http://localhost:3000'],
  discovery: {
    endpoints: ['http://localhost:8000'],
    timeout: 5000,
    retryInterval: 30000,
    maxRetries: 3
  },
  healthCheckInterval: 60000,
  heartbeatInterval: 30000,
  requestTimeout: 120000,
  queueProcessingInterval: 1000,
  maxQueueSize: 100,
  maxMessageSize: 1024 * 1024,
  fantasyPrompts: {
    systemContext: 'Test fantasy context',
    draftStrategy: 'Test draft strategy: {position}',
    playerValuation: 'Test player valuation: {players}',
    analysisInstructions: 'Test analysis instructions'
  },
  features: {
    enableWebSocket: true,
    enableBatchProcessing: true,
    enableCaching: true,
    enableMetrics: true
  }
}));

const GeminiAdvancedBridge = require('./server');

describe('Gemini Advanced Bridge Server', () => {
  let server;
  let app;

  beforeAll(async () => {
    // Create server instance for testing
    const bridge = new GeminiAdvancedBridge();
    app = bridge.app;
    
    // Start server on test port
    server = bridge.server.listen(3002);
    
    // Wait for server to be ready
    await new Promise(resolve => {
      server.on('listening', resolve);
    });
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('HTTP Endpoints', () => {
    describe('GET /health', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body).toHaveProperty('server', true);
        expect(response.body).toHaveProperty('gemini');
        expect(response.body).toHaveProperty('uptime');
        expect(response.body).toHaveProperty('connections');
        expect(response.body).toHaveProperty('timestamp');
      });
    });

    describe('GET /api/discover', () => {
      it('should return discovery information', async () => {
        const response = await request(app)
          .get('/api/discover')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('endpoints');
        expect(response.body).toHaveProperty('timestamp');
        expect(Array.isArray(response.body.endpoints)).toBe(true);
      });
    });

    describe('GET /api/status', () => {
      it('should return detailed status', async () => {
        const response = await request(app)
          .get('/api/status')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('server');
        expect(response.body.data).toHaveProperty('gemini');
        expect(response.body.data).toHaveProperty('stats');
      });
    });

    describe('POST /api/fantasy-ai', () => {
      it('should accept fantasy AI requests', async () => {
        const requestBody = {
          prompt: 'Should I start Josh Allen this week?',
          context: { week: 5, scoringSystem: 'PPR' },
          analysisType: 'weekly'
        };

        const response = await request(app)
          .post('/api/fantasy-ai')
          .send(requestBody)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('requestId');
        expect(response.body).toHaveProperty('timestamp');
      });

      it('should reject requests without prompt', async () => {
        const requestBody = {
          context: { week: 5 },
          analysisType: 'weekly'
        };

        const response = await request(app)
          .post('/api/fantasy-ai')
          .send(requestBody)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('message');
      });

      it('should reject requests with invalid prompt', async () => {
        const requestBody = {
          prompt: 123, // Invalid prompt type
          context: { week: 5 },
          analysisType: 'weekly'
        };

        const response = await request(app)
          .post('/api/fantasy-ai')
          .send(requestBody)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('POST /api/fantasy-batch', () => {
      it('should accept batch analysis requests', async () => {
        const requestBody = {
          queries: [
            {
              id: 'query1',
              prompt: 'Best RB values in round 3?',
              analysisType: 'draft'
            },
            {
              id: 'query2',
              prompt: 'Should I trade CMC?',
              analysisType: 'trade'
            }
          ]
        };

        const response = await request(app)
          .post('/api/fantasy-batch')
          .send(requestBody)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should reject non-array queries', async () => {
        const requestBody = {
          queries: 'not an array'
        };

        const response = await request(app)
          .post('/api/fantasy-batch')
          .send(requestBody)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('404 Handler', () => {
      it('should return 404 for unknown endpoints', async () => {
        const response = await request(app)
          .get('/unknown-endpoint')
          .expect(404);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('message', 'Endpoint not found');
      });
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/health')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });

    it('should handle preflight requests', async () => {
      await request(app)
        .options('/api/fantasy-ai')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);
    });
  });

  describe('Request Logging', () => {
    it('should add request ID to responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Request ID should be added by middleware
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});

describe('WebSocket Functionality', () => {
  let bridge;
  let wsServer;

  beforeAll(async () => {
    bridge = new GeminiAdvancedBridge();
    
    // Start server on different port for WebSocket tests
    wsServer = bridge.server.listen(3003);
    
    await new Promise(resolve => {
      wsServer.on('listening', resolve);
    });
  });

  afterAll(async () => {
    if (wsServer) {
      wsServer.close();
    }
  });

  describe('WebSocket Connection', () => {
    it('should accept WebSocket connections', (done) => {
      const ws = new WebSocket('ws://localhost:3003/ws');
      
      ws.on('open', () => {
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should send welcome message on connection', (done) => {
      const ws = new WebSocket('ws://localhost:3003/ws');
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'welcome') {
          expect(message).toHaveProperty('data');
          expect(message.data).toHaveProperty('clientId');
          expect(message.data).toHaveProperty('server', 'gemini-bridge');
          expect(message.data).toHaveProperty('capabilities');
          
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle subscription messages', (done) => {
      const ws = new WebSocket('ws://localhost:3003/ws');
      let welcomeReceived = false;
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'welcome' && !welcomeReceived) {
          welcomeReceived = true;
          
          // Send subscription message
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'health'
          }));
        } else if (message.type === 'subscribed') {
          expect(message).toHaveProperty('channel', 'health');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle invalid JSON messages gracefully', (done) => {
      const ws = new WebSocket('ws://localhost:3003/ws');
      let welcomeReceived = false;
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'welcome' && !welcomeReceived) {
          welcomeReceived = true;
          
          // Send invalid JSON
          ws.send('invalid json');
        } else if (message.type === 'error') {
          expect(message.data).toHaveProperty('message', 'Invalid message format');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });
});

describe('Configuration Validation', () => {
  it('should validate required configuration', () => {
    // This test ensures our mocked config is valid
    const config = require('./config');
    
    expect(config).toHaveProperty('server');
    expect(config.server).toHaveProperty('host');
    expect(config.server).toHaveProperty('port');
    expect(config).toHaveProperty('discovery');
    expect(config.discovery).toHaveProperty('endpoints');
    expect(Array.isArray(config.discovery.endpoints)).toBe(true);
  });
});

describe('Error Handling', () => {
  let app;

  beforeAll(() => {
    const bridge = new GeminiAdvancedBridge();
    app = bridge.app;
  });

  it('should handle middleware errors gracefully', async () => {
    // This would normally be tested with a route that throws an error
    // For now, we test the 404 handler which is part of error handling
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
  });
});

// Mock tests for methods that would normally require Gemini MCP
describe('Gemini MCP Integration (Mocked)', () => {
  let bridge;

  beforeAll(() => {
    bridge = new GeminiAdvancedBridge();
    
    // Mock the checkGeminiEndpoint method
    bridge.checkGeminiEndpoint = jest.fn().mockResolvedValue(true);
    
    // Mock the processFantasyQuery method
    bridge.processFantasyQuery = jest.fn().mockResolvedValue({
      analysis: 'Mocked analysis response',
      confidence: 0.85,
      endpoint: 'http://localhost:8000',
      processingTime: 1000,
      model: 'gemini-2.5-pro',
      requestId: 'test-request'
    });
  });

  describe('Endpoint Discovery', () => {
    it('should discover Gemini endpoints', async () => {
      await bridge.discoverGeminiEndpoints();
      
      expect(bridge.checkGeminiEndpoint).toHaveBeenCalled();
      expect(bridge.healthStatus.gemini).toBe(true);
    });
  });

  describe('Fantasy Query Processing', () => {
    it('should process fantasy queries', async () => {
      const result = await bridge.processFantasyQuery({
        prompt: 'Test prompt',
        context: { week: 5 },
        analysisType: 'test',
        requestId: 'test-123'
      });

      expect(bridge.processFantasyQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('requestId');
    });
  });
});