# ESPN API Integration Example

This document demonstrates how to use the new ESPN API Service in your Fantasy Football Analyzer components.

## Quick Start

### 1. Using the ESPN Data Hook

```typescript
import { useESPNData } from '@/hooks/useESPNData';

function MyComponent() {
  const {
    players,
    projections,
    injuries,
    rankings,
    isLoading,
    error,
    refreshData
  } = useESPNData();

  if (isLoading) return <div>Loading ESPN data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>ESPN Player Data ({players.length} players)</h2>
      <button onClick={refreshData}>Refresh Data</button>
      
      {/* Your component content */}
      {players.map(player => (
        <div key={player.id}>
          {player.name} - {player.position} - {player.team}
          <br />
          PPR: {player.ppr} | Standard: {player.standard}
        </div>
      ))}
    </div>
  );
}
```

### 2. Using the ESPN Service Directly

```typescript
import { espnAPIService } from '@/services/ESPNAPIService';

// Initialize the service
await espnAPIService.initialize();

// Get all players
const players = await espnAPIService.getAllPlayers();

// Get players by position
const quarterbacks = await espnAPIService.getPlayersByPosition('QB');

// Get comprehensive data (combines multiple endpoints)
const comprehensiveData = await espnAPIService.getComprehensivePlayerData();

// Get fantasy projections
const projections = await espnAPIService.getFantasyProjections();

// Get injury reports
const injuries = await espnAPIService.getInjuryReports();
```

### 3. Integration with Existing Context

```typescript
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { useESPNData } from '@/hooks/useESPNData';

function EnhancedDraftBoard() {
  const { state, dispatch } = useFantasyFootball();
  const espnData = useESPNData();

  // Merge ESPN data with existing players
  const enhancedPlayers = useMemo(() => {
    return state.players.map(player => {
      const espnPlayer = espnData.players.find(p => p.name === player.name);
      const projection = espnData.projections.find(p => 
        p.playerName.toLowerCase().includes(player.name.toLowerCase())
      );
      
      return {
        ...player,
        ...espnPlayer,
        projectedPoints: projection?.projectedPoints || player.ppr
      };
    });
  }, [state.players, espnData.players, espnData.projections]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Draft Board (Enhanced with ESPN Data)</h2>
        <button 
          onClick={() => espnData.refreshData()}
          disabled={espnData.isLoading}
          className="btn btn-primary"
        >
          {espnData.isLoading ? 'Refreshing...' : 'Refresh ESPN Data'}
        </button>
      </div>
      
      {/* Render enhanced player list */}
      {enhancedPlayers.map(player => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  );
}
```

## Service Features

### Caching System
The ESPN service includes intelligent caching with different TTL values:
- Player data: 10 minutes
- Team data: 30 minutes
- Projections: 15 minutes
- Injuries: 5 minutes
- Rankings: 15 minutes

### Rate Limiting
Built-in rate limiting prevents API abuse:
- Maximum 100 requests per minute
- Exponential backoff on rate limit hits
- Automatic retry mechanism

### Error Handling
Graceful error handling with fallbacks:
- Network timeout handling
- API error recovery
- Fallback to Browser MCP service
- Graceful degradation to cached data

### Data Transformation
Automatic data transformation to match existing interfaces:
- ESPN player data → App Player interface
- ESPN projections → Fantasy projections
- ESPN injuries → Injury reports
- ESPN rankings → Player rankings

## Testing

Run the comprehensive test suite:

```typescript
import { runESPNAPITests } from '@/utils/espnApiTests';

// Run all tests
await runESPNAPITests();

// Or run specific test suite
const testSuite = new ESPNAPITestSuite();
const results = await testSuite.runAllTests();
```

## Configuration

### Cache TTL Configuration
```typescript
const ESPN_CONFIG = {
  CACHE_TTL: {
    PLAYERS: 10 * 60 * 1000, // 10 minutes
    TEAMS: 30 * 60 * 1000, // 30 minutes
    PROJECTIONS: 15 * 60 * 1000, // 15 minutes
    INJURIES: 5 * 60 * 1000, // 5 minutes
    RANKINGS: 15 * 60 * 1000, // 15 minutes
  }
};
```

### Rate Limiting Configuration
```typescript
const RATE_LIMITS = {
  REQUEST_WINDOW: 60 * 1000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 100,
  BACKOFF_MULTIPLIER: 2,
  MAX_BACKOFF_TIME: 30 * 1000, // 30 seconds
};
```

## Service Status Monitoring

```typescript
// Get service status
const status = espnAPIService.getServiceStatus();
console.log('Initialized:', status.initialized);
console.log('Cache size:', status.cacheSize);
console.log('Rate limits:', status.rateLimitStatus);

// Get cache statistics
const cacheStats = espnAPIService.getCacheStats();
console.log('Cache entries:', cacheStats.size);
console.log('Cache keys:', cacheStats.keys);
```

## Live Data View Integration

The ESPN service is fully integrated into the Live Data View:
- Real-time status monitoring
- Direct data refresh controls
- Cache management
- Error reporting
- Performance metrics

## Best Practices

1. **Use the hook for React components**: `useESPNData()` provides automatic state management
2. **Check service status**: Always verify `isInitialized` before relying on data
3. **Handle loading states**: Show loading indicators during data fetches
4. **Implement error boundaries**: Catch and handle API errors gracefully
5. **Monitor cache performance**: Clear cache when needed for fresh data
6. **Respect rate limits**: Don't make excessive manual refresh calls

## Data Flow

```
ESPN API Endpoints
       ↓
ESPNAPIService (caching, rate limiting, error handling)
       ↓
useESPNData Hook (React integration)
       ↓
React Components (UI rendering)
       ↓
FantasyFootballContext (state management)
```

## Endpoints Coverage

✅ **Players**: Complete player data with stats and biographical info  
✅ **Teams**: NFL team data and rosters  
✅ **Projections**: Fantasy point projections (PPR, Standard, Half-PPR)  
✅ **Injuries**: Real-time injury reports  
✅ **Rankings**: Expert consensus rankings  
✅ **ADP**: Average Draft Position data  

The service provides comprehensive coverage of all major fantasy football data needs with intelligent caching and error handling.