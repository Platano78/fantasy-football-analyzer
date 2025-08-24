# Local Gemini Advanced Bridge Server

Production-ready Express.js server that bridges the Fantasy Football Analyzer with local Gemini Advanced MCP for unlimited token AI coaching.

## 🎯 Overview

This server provides a WebSocket and HTTP API bridge between your Fantasy Football Analyzer React frontend and local Gemini Advanced MCP instances, enabling unlimited token AI coaching with specialized fantasy football intelligence.

## ⚡ Features

### Core Capabilities
- **Auto-Discovery**: Automatically discovers and connects to local Gemini Advanced MCP servers
- **WebSocket Real-time**: Bi-directional real-time communication with React frontend
- **Fantasy Intelligence**: Specialized fantasy football prompts and analysis
- **Health Monitoring**: Continuous health checks and connection status
- **Error Handling**: Robust error handling and logging
- **CORS Support**: Configurable CORS for React frontend integration

### Fantasy Football Intelligence
- **Advanced Draft Strategy**: AI-powered draft recommendations and tier analysis
- **Player Valuation**: Real-time player valuations and projections
- **Injury Impact Assessment**: Analysis of injury impacts on fantasy value
- **Trade Recommendations**: Fair trade analysis and counter-offers
- **Weekly Lineup Optimization**: Start/sit recommendations with confidence levels
- **Matchup Analysis**: Detailed opponent analysis and game script predictions
- **Waiver Wire Strategy**: Priority rankings and FAAB bid recommendations

### Technical Features
- **Rate Limiting**: Configurable rate limiting per IP
- **Message Queue**: Asynchronous message processing
- **Caching**: Intelligent caching for improved performance
- **Monitoring**: Comprehensive metrics and health monitoring
- **Docker Support**: Ready for containerized deployment
- **PM2 Support**: Production process management

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Local Gemini Advanced MCP server running (typically on port 8000)

### Installation

1. **Install Dependencies**
   ```bash
   cd server/gemini-bridge
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Create .env file (optional - uses defaults)
   cp .env.example .env
   
   # Edit configuration as needed
   nano .env
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3001` by default.

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
BRIDGE_HOST=localhost          # Server host
BRIDGE_PORT=3001              # Server port
NODE_ENV=development          # Environment

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Gemini MCP Endpoints (comma-separated)
GEMINI_ENDPOINTS=http://localhost:8000,http://localhost:8001

# Logging
LOG_LEVEL=info                # debug, info, warn, error

# Security (Production)
API_KEY=your-api-key          # Optional API key
REQUIRE_API_KEY=false         # Set to true for production
```

### Configuration File

The `config.js` file contains comprehensive configuration options:

- **Server settings**: Host, port, environment
- **Discovery settings**: MCP endpoint discovery and health checks
- **Fantasy prompts**: Specialized AI prompts for fantasy football analysis
- **NFL data**: Team information, scoring systems, positions
- **Security settings**: Rate limiting, IP restrictions
- **Feature flags**: Enable/disable specific features

## 📡 API Endpoints

### Health Check
```http
GET /health
```
Returns server and Gemini MCP connection status.

### Discovery
```http
GET /api/discover
```
Lists all discovered Gemini MCP endpoints and their status.

### Fantasy AI Analysis
```http
POST /api/fantasy-ai
Content-Type: application/json

{
  "prompt": "Should I start Josh Allen or Lamar Jackson this week?",
  "context": {
    "scoringSystem": "PPR",
    "week": 5
  },
  "analysisType": "weekly",
  "playerData": [
    {"name": "Josh Allen", "position": "QB", "team": "BUF"},
    {"name": "Lamar Jackson", "position": "QB", "team": "BAL"}
  ]
}
```

### Batch Analysis
```http
POST /api/fantasy-batch
Content-Type: application/json

{
  "queries": [
    {
      "id": "draft-analysis",
      "prompt": "Best value picks in round 3?",
      "analysisType": "draft"
    },
    {
      "id": "trade-evaluation", 
      "prompt": "Should I trade CMC for Tyreek Hill?",
      "analysisType": "trade"
    }
  ]
}
```

### Status
```http
GET /api/status
```
Detailed server statistics and performance metrics.

## 🔌 WebSocket API

Connect to: `ws://localhost:3001/ws`

### Message Types

#### Client to Server

**Subscribe to Updates**
```json
{
  "type": "subscribe",
  "channel": "health"
}
```

**Fantasy Query**
```json
{
  "type": "fantasy-query",
  "id": "query-1",
  "data": {
    "query": "Who should I target in round 4 of my draft?",
    "context": {
      "draftPosition": 6,
      "currentRound": 4,
      "scoringSystem": "PPR"
    }
  }
}
```

**Draft Analysis**
```json
{
  "type": "draft-analysis",
  "id": "draft-1",
  "data": {
    "position": 6,
    "availablePlayers": [...],
    "draftData": {...}
  }
}
```

**Player Evaluation**
```json
{
  "type": "player-evaluation",
  "id": "eval-1",
  "data": {
    "players": [...],
    "week": 5,
    "scoringSystem": "PPR"
  }
}
```

#### Server to Client

**Welcome Message**
```json
{
  "type": "welcome",
  "clientId": "client-123",
  "data": {
    "server": "gemini-bridge",
    "version": "1.0.0",
    "capabilities": ["fantasy-analysis", "real-time-coaching"]
  }
}
```

**Query Results**
```json
{
  "type": "query-result",
  "messageId": "query-1",
  "data": {
    "analysis": "Based on your draft position...",
    "confidence": 0.89,
    "processingTime": 1250
  }
}
```

**Health Updates**
```json
{
  "type": "health-update",
  "data": {
    "gemini": true,
    "endpoints": 2,
    "lastCheck": "2024-08-23T20:30:00Z"
  }
}
```

## 🏥 Health Monitoring

The server provides comprehensive health monitoring:

- **Endpoint Discovery**: Automatically discovers and monitors Gemini MCP endpoints
- **Connection Status**: Real-time status of all connections
- **Performance Metrics**: Request counts, response times, error rates
- **Resource Usage**: Memory usage, active connections, queue sizes

### Health Check Response
```json
{
  "server": true,
  "gemini": true,
  "endpoints": ["http://localhost:8000", "http://localhost:8001"],
  "uptime": 3600,
  "connections": 5,
  "requestCount": 1547,
  "timestamp": "2024-08-23T20:30:00Z"
}
```

## 🐳 Docker Deployment

### Build Image
```bash
npm run docker:build
```

### Run Container
```bash
npm run docker:run
```

### Docker Compose Example
```yaml
version: '3.8'
services:
  gemini-bridge:
    build: ./server/gemini-bridge
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - BRIDGE_PORT=3001
      - GEMINI_ENDPOINTS=http://gemini-mcp:8000
    depends_on:
      - gemini-mcp
    restart: unless-stopped
```

## 🔄 Production Deployment

### PM2 Process Manager
```bash
# Start with PM2
npm run pm2:start

# Monitor logs
npm run pm2:logs

# Restart
npm run pm2:restart

# Stop
npm run pm2:stop
```

### PM2 Ecosystem File (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'gemini-bridge',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      BRIDGE_PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      BRIDGE_PORT: 3001,
      REQUIRE_API_KEY: true
    }
  }]
};
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Health Check Test
```bash
npm run health-check
```

## 📊 Monitoring and Debugging

### Performance Metrics
The server tracks comprehensive metrics:
- Total requests processed
- Average response time
- Success/failure rates
- Active WebSocket connections
- Memory usage
- Queue sizes

### Logging
Structured logging with configurable levels:
- `debug`: Detailed debugging information
- `info`: General operational information
- `warn`: Warning conditions
- `error`: Error conditions

### Debug Endpoints
- `GET /health` - Server and connection health
- `GET /api/status` - Detailed performance metrics
- `GET /api/discover` - Endpoint discovery status

## 🔧 Troubleshooting

### Common Issues

**1. Gemini MCP Not Found**
```bash
# Check if Gemini MCP is running
curl http://localhost:8000/health

# Check server logs
npm run pm2:logs
```

**2. WebSocket Connection Failed**
- Verify CORS origins in configuration
- Check firewall settings
- Confirm WebSocket endpoint: `ws://localhost:3001/ws`

**3. High Memory Usage**
- Check cache size: `GET /api/status`
- Reduce cache TTL in configuration
- Restart server: `npm run pm2:restart`

**4. Rate Limit Exceeded**
- Check rate limit configuration
- Implement request queuing on client
- Consider increasing rate limits for development

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Monitor in real-time
tail -f logs/gemini-bridge.log
```

## 🤝 Integration with React Frontend

### HybridAIService Integration
The server integrates with the React frontend through the HybridAIService:

```typescript
// Connect to bridge server
const bridgeWS = new WebSocket('ws://localhost:3001/ws');

// Send fantasy query
bridgeWS.send(JSON.stringify({
  type: 'fantasy-query',
  id: 'query-1',
  data: {
    query: 'Should I start CMC this week?',
    context: { week: 5, scoringSystem: 'PPR' }
  }
}));
```

### AIBackendStatus Component
The server provides real-time status updates for the AIBackendStatus component:

```typescript
// Subscribe to health updates
bridgeWS.send(JSON.stringify({
  type: 'subscribe',
  channel: 'health'
}));

// Handle status updates
bridgeWS.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'health-update') {
    updateAIBackendStatus(message.data);
  }
};
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the README and inline code comments
- **Health Check**: Use `/health` endpoint for basic diagnostics

---

**Server Status**: Ready for production deployment with comprehensive fantasy football AI coaching capabilities.