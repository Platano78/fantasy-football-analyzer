# Enhanced Browser MCP Service Integration

## Overview

The Enhanced Browser MCP Service (`BrowserMCPService.ts`) is a production-ready webscraping system that uses real Browser MCP integration with Playwright for comprehensive fantasy football data collection. This service provides seamless integration with existing ESPN API services and implements a robust fallback hierarchy.

## 🚀 Key Features

### Real Browser MCP Automation
- **Actual Playwright Integration**: Uses real Browser MCP tools (`mcp__playwright__browser_*`) for web automation
- **Smart Fallback System**: Gracefully degrades to enhanced simulation when Browser MCP is unavailable
- **Screenshot Debugging**: Automatic screenshot capture on failures for debugging

### Data Sources
- **NFL.com**: Official injury reports and player news
- **FantasyPros.com**: Expert consensus rankings and analysis  
- **Sleeper.app**: ADP (Average Draft Position) trends and data
- **ESPN.com**: Fantasy projections via scraping (backup to direct API)

### Production-Ready Features
- **Rate Limiting**: Intelligent rate limiting with configurable intervals per site
- **Error Handling**: Comprehensive error handling with retry logic and exponential backoff
- **Caching System**: Advanced caching with TTL and cache hit rate tracking
- **Health Monitoring**: Real-time health checks for all data sources
- **Performance Metrics**: Detailed metrics tracking including response times and success rates

## 📋 Implementation Details

### Service Architecture

```typescript
class BrowserMCPService {
  // Real Browser MCP integration points
  private SCRAPING_TARGETS: Record<string, ScrapingTarget>
  private browserSessions: Map<string, BrowserSession>
  private rateLimiters: Map<string, number>
  private metrics: ScrapingMetrics
}
```

### Scraping Targets Configuration

```typescript
const SCRAPING_TARGETS = {
  nfl_injuries: {
    url: 'https://www.nfl.com/news/injuries/',
    selectors: { container: '.nfl-c-custom-promo', ... },
    rateLimit: 5000 // 5 seconds
  },
  fantasypros_rankings: {
    url: 'https://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php',
    selectors: { container: '#ranking-table tbody tr', ... },
    rateLimit: 3000 // 3 seconds  
  },
  sleeper_adp: {
    url: 'https://sleeper.com/draft/create',
    selectors: { container: '[data-testid="player-row"]', ... },
    rateLimit: 4000 // 4 seconds
  },
  espn_backup: {
    url: 'https://www.espn.com/fantasy/football/story/_/id/39481863/...',
    selectors: { container: '.Table__TR', ... },
    rateLimit: 6000 // 6 seconds
  }
}
```

### Real Browser MCP Integration

The service uses actual Browser MCP tools when available:

```typescript
// Real browser navigation
await (globalThis as any).mcpBrowserNavigate(target.url);

// Wait for content loading
await this.waitForSelector(target.waitSelector, 10000);

// Capture page snapshot for data extraction
const snapshot = await (globalThis as any).mcpBrowserSnapshot();

// Take screenshots for debugging
await (globalThis as any).mcpBrowserTakeScreenshot(filename);
```

## 🔄 Fallback Hierarchy

The system implements a robust fallback hierarchy:

1. **ESPN API Direct** (Primary)
2. **Browser MCP Scraping** (Fallback)
3. **Enhanced Simulation** (Emergency fallback)
4. **Mock Data** (Development/offline)

### useESPNData Integration

Updated hook now includes Browser MCP fallback:

```typescript
const freshInjuries = await fetchWithRetry(
  () => espnAPIService.getInjuryReports(),        // Primary: ESPN API
  async () => {                                   // Fallback: Browser MCP
    const browserInjuries = await browserMCPService.scrapeNFLInjuries();
    return browserInjuries.map(injury => convertToESPNFormat(injury));
  },
  []                                              // Final fallback: empty array
);
```

## 📊 Available Methods

### Core Scraping Methods
- `scrapeNFLInjuries()`: NFL.com injury reports
- `scrapeFantasyProRankings()`: FantasyPros consensus rankings
- `scrapeSleeperADP()`: Sleeper ADP data
- `scrapeESPNBackup()`: ESPN projections via scraping

### Data Aggregation Methods
- `getConsolidatedNews()`: Combined news from all sources
- `getConsolidatedRankings()`: Merged rankings data
- `getAllInjuryReports()`: All injury data
- `getADPUpdates()`: ADP trend data

### Monitoring & Debugging
- `healthCheck()`: Comprehensive health check for all sources
- `getServiceMetrics()`: Performance and usage statistics
- `capturePageScreenshot()`: Manual screenshot capture
- `logPerformanceMetrics()`: Console logging of metrics

### Cache Management
- `clearCache()`: Clear all cached data
- `getCacheStats()`: Cache statistics and analysis
- `forceRefreshAll()`: Force refresh all data sources

## 🏥 Health Monitoring

The service provides comprehensive health monitoring:

```typescript
const healthStatus = await browserMCPService.healthCheck();
// Returns: { fantasypros: true, espn: true, nfl: false, sleeper: true }

const metrics = browserMCPService.getServiceMetrics();
// Returns detailed metrics including response times, success rates, cache performance
```

## 📈 Performance Metrics

Tracked metrics include:
- **Request Statistics**: Total, successful, failed requests
- **Response Times**: Average response time per source
- **Cache Performance**: Hit rate, size, oldest entry
- **Rate Limiting**: Rate limit hits and delays
- **Browser Sessions**: Active sessions, cleanup statistics
- **Uptime**: Service uptime tracking

## 🐛 Debugging Features

### Automatic Screenshot Capture
Failed scraping attempts automatically capture screenshots:
```
📷 Error screenshot saved: error-nfl_injuries-2024-01-15T10-30-45.png
```

### Enhanced Logging
```
🌐 Scraping NFL.com Injury Reports from https://www.nfl.com/news/injuries/
✅ Successfully scraped NFL.com Injury Reports (450ms)
⚠️ Rate limiting nfl_injuries: waiting 2000ms
```

### Manual Debugging
```typescript
// Capture manual screenshot
const filename = await browserMCPService.capturePageScreenshot('debug_session');

// Get detailed metrics
browserMCPService.logPerformanceMetrics();
```

## 🔧 Configuration

### Rate Limiting
Each scraping target has configurable rate limiting:
- NFL.com: 5 seconds between requests
- FantasyPros: 3 seconds between requests  
- Sleeper: 4 seconds between requests
- ESPN Backup: 6 seconds between requests

### Caching
- Default TTL: 5 minutes for most data
- Injury reports: 3 minutes TTL
- Rankings: 10 minutes TTL
- News: 2 minutes TTL

### Retry Logic
- Maximum retries: 3 attempts
- Exponential backoff: 1s, 2s, 4s delays
- Timeout handling: 10 second timeouts per request

## 🧪 Testing

Comprehensive test suite includes:
- Service initialization tests
- Real Browser MCP integration tests
- Fallback mechanism validation
- Health check system tests
- Performance metrics validation
- Error handling and recovery tests
- Screenshot debugging tests
- Cache management tests

Run tests:
```bash
npm test BrowserMCP.basic
```

## 🚀 Usage Examples

### Basic Usage
```typescript
import { browserMCPService } from '@/services/BrowserMCPService';

// Initialize service
await browserMCPService.initialize();

// Scrape injury data
const injuries = await browserMCPService.scrapeNFLInjuries();

// Get health status
const health = await browserMCPService.healthCheck();
```

### Integration with React Hook
```typescript
import { useESPNData } from '@/hooks/useESPNData';

function MyComponent() {
  const espnData = useESPNData(); // Now includes Browser MCP fallback
  
  return (
    <div>
      {espnData.serviceStatus.browserMCPStatus.initialized && (
        <span>Browser MCP Active</span>
      )}
    </div>
  );
}
```

### Live Data View Integration
The service is fully integrated with the LiveDataView component, providing:
- Real-time data source status
- Browser MCP health monitoring  
- Performance metrics display
- Manual refresh controls
- Cache management controls

## 🔒 Security & Best Practices

- **Rate Limiting**: Respectful scraping with proper delays
- **User Agent Rotation**: Planned for future implementation
- **Error Boundaries**: Graceful failure handling
- **Resource Cleanup**: Automatic session cleanup after 30 minutes
- **Screenshot Privacy**: Screenshots stored in secure temporary directory

## 📝 Future Enhancements

Planned improvements include:
- User agent rotation and stealth techniques
- Browser pool management for concurrent requests
- Advanced CSS selector strategies
- Machine learning for content extraction
- Real-time WebSocket integration
- Enhanced caching strategies

## 🔗 Integration Points

The Browser MCP Service integrates seamlessly with:
- **ESPN API Service**: Primary/fallback relationship
- **LiveDataView Component**: Real-time monitoring
- **Fantasy Football Context**: Data distribution
- **Caching System**: Unified cache management
- **Error Reporting**: Centralized error handling

## 📞 Support

For issues or questions about the Browser MCP Service:
1. Check the test suite for usage examples
2. Review performance metrics for debugging
3. Examine screenshot captures for failed operations
4. Use health check endpoints for status verification

---

*The Enhanced Browser MCP Service represents a production-ready solution for fantasy football data scraping with real Browser MCP integration, comprehensive fallback systems, and robust monitoring capabilities.*