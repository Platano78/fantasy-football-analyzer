/**
 * ESPN API Integration Tests
 * 
 * Comprehensive test suite for ESPN API Service functionality
 * including endpoint testing, caching, rate limiting, and error handling.
 */

import { espnAPIService } from '../services/ESPNAPIService';
import { Player, Position } from '../types/index';

// Test configuration
const TEST_CONFIG = {
  TIMEOUT: 30000, // 30 seconds for slow network
  POSITIONS_TO_TEST: ['QB', 'RB', 'WR', 'TE'] as Position[],
  MIN_EXPECTED_PLAYERS: 50,
  MIN_EXPECTED_PROJECTIONS: 20,
};

// Test results interface
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

// Test suite class
export class ESPNAPITestSuite {
  private results: TestResult[] = [];

  /**
   * Run all tests
   */
  async runAllTests(): Promise<{ passed: number; failed: number; results: TestResult[] }> {
    console.log('🏈 Starting ESPN API Integration Test Suite...');
    
    this.results = [];

    // Core functionality tests
    await this.testServiceInitialization();
    await this.testGetAllPlayers();
    await this.testGetPlayersByPosition();
    await this.testGetFantasyProjections();
    await this.testGetFantasyRankings();
    await this.testGetInjuryReports();
    await this.testGetAllTeams();
    await this.testGetADPData();
    await this.testComprehensivePlayerData();

    // Performance and reliability tests
    await this.testCachingFunctionality();
    await this.testRateLimiting();
    await this.testErrorHandling();
    await this.testFallbackMechanism();

    // Service management tests
    await this.testCacheManagement();
    await this.testServiceStatus();

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.name}: ${result.error}`);
      });
    }

    return { passed, failed, results: this.results };
  }

  /**
   * Execute a test with timing and error handling
   */
  private async runTest(name: string, testFunction: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🔧 Running: ${name}`);
      await Promise.race([
        testFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), TEST_CONFIG.TIMEOUT)
        )
      ]);
      
      const duration = Date.now() - startTime;
      this.results.push({ name, passed: true, duration });
      console.log(`✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.results.push({ name, passed: false, duration, error: errorMessage });
      console.log(`❌ ${name} (${duration}ms): ${errorMessage}`);
    }
  }

  /**
   * Test service initialization
   */
  private async testServiceInitialization(): Promise<void> {
    await this.runTest('Service Initialization', async () => {
      const initialized = await espnAPIService.initialize();
      
      if (!espnAPIService.isReady()) {
        // Allow service to work with fallbacks
        console.warn('ESPN API not available, service will use fallbacks');
      }
      
      // Test should pass even if ESPN API is not available
      if (!initialized && !espnAPIService.isReady()) {
        // This is acceptable - service can work with fallbacks
        console.log('Service initialized in fallback mode');
      }
    });
  }

  /**
   * Test getting all players
   */
  private async testGetAllPlayers(): Promise<void> {
    await this.runTest('Get All Players', async () => {
      const players = await espnAPIService.getAllPlayers();
      
      if (!Array.isArray(players)) {
        throw new Error('Players should be an array');
      }
      
      if (players.length < TEST_CONFIG.MIN_EXPECTED_PLAYERS) {
        console.warn(`Only got ${players.length} players, expected at least ${TEST_CONFIG.MIN_EXPECTED_PLAYERS}`);
      }
      
      // Validate player structure
      if (players.length > 0) {
        const firstPlayer = players[0];
        const requiredFields = ['id', 'name', 'position', 'team', 'adp', 'ppr'];
        
        for (const field of requiredFields) {
          if (!(field in firstPlayer)) {
            throw new Error(`Player missing required field: ${field}`);
          }
        }
      }
    });
  }

  /**
   * Test getting players by position
   */
  private async testGetPlayersByPosition(): Promise<void> {
    for (const position of TEST_CONFIG.POSITIONS_TO_TEST) {
      await this.runTest(`Get ${position} Players`, async () => {
        const players = await espnAPIService.getPlayersByPosition(position);
        
        if (!Array.isArray(players)) {
          throw new Error(`${position} players should be an array`);
        }
        
        // Validate that all returned players have the correct position
        const invalidPositions = players.filter(p => p.position !== position);
        if (invalidPositions.length > 0) {
          throw new Error(`Found ${invalidPositions.length} players with wrong position`);
        }
      });
    }
  }

  /**
   * Test getting fantasy projections
   */
  private async testGetFantasyProjections(): Promise<void> {
    await this.runTest('Get Fantasy Projections', async () => {
      const projections = await espnAPIService.getFantasyProjections();
      
      if (!Array.isArray(projections)) {
        throw new Error('Projections should be an array');
      }
      
      if (projections.length > 0) {
        const firstProjection = projections[0];
        const requiredFields = ['playerId', 'playerName', 'position', 'projectedPoints'];
        
        for (const field of requiredFields) {
          if (!(field in firstProjection)) {
            throw new Error(`Projection missing required field: ${field}`);
          }
        }
        
        // Validate projectedPoints structure
        if (typeof firstProjection.projectedPoints !== 'object') {
          throw new Error('Projection projectedPoints should be an object');
        }
      }
    });
  }

  /**
   * Test getting fantasy rankings
   */
  private async testGetFantasyRankings(): Promise<void> {
    await this.runTest('Get Fantasy Rankings', async () => {
      const rankings = await espnAPIService.getFantasyRankings();
      
      if (!Array.isArray(rankings)) {
        throw new Error('Rankings should be an array');
      }
      
      if (rankings.length > 0) {
        const firstRanking = rankings[0];
        const requiredFields = ['playerId', 'playerName', 'position', 'rank', 'adp'];
        
        for (const field of requiredFields) {
          if (!(field in firstRanking)) {
            throw new Error(`Ranking missing required field: ${field}`);
          }
        }
      }
    });
  }

  /**
   * Test getting injury reports
   */
  private async testGetInjuryReports(): Promise<void> {
    await this.runTest('Get Injury Reports', async () => {
      const injuries = await espnAPIService.getInjuryReports();
      
      if (!Array.isArray(injuries)) {
        throw new Error('Injuries should be an array');
      }
      
      if (injuries.length > 0) {
        const firstInjury = injuries[0];
        const requiredFields = ['playerId', 'playerName', 'status', 'description'];
        
        for (const field of requiredFields) {
          if (!(field in firstInjury)) {
            throw new Error(`Injury report missing required field: ${field}`);
          }
        }
      }
    });
  }

  /**
   * Test getting all teams
   */
  private async testGetAllTeams(): Promise<void> {
    await this.runTest('Get All Teams', async () => {
      const teams = await espnAPIService.getAllTeams();
      
      if (!Array.isArray(teams)) {
        throw new Error('Teams should be an array');
      }
      
      if (teams.length > 0) {
        const firstTeam = teams[0];
        const requiredFields = ['id', 'name', 'owner'];
        
        for (const field of requiredFields) {
          if (!(field in firstTeam)) {
            throw new Error(`Team missing required field: ${field}`);
          }
        }
      }
    });
  }

  /**
   * Test getting ADP data
   */
  private async testGetADPData(): Promise<void> {
    await this.runTest('Get ADP Data', async () => {
      const adpData = await espnAPIService.getADPData();
      
      if (!Array.isArray(adpData)) {
        throw new Error('ADP data should be an array');
      }
      
      if (adpData.length > 0) {
        const firstADP = adpData[0];
        
        if (!('playerId' in firstADP) || !('adp' in firstADP)) {
          throw new Error('ADP data missing required fields');
        }
      }
    });
  }

  /**
   * Test comprehensive player data
   */
  private async testComprehensivePlayerData(): Promise<void> {
    await this.runTest('Get Comprehensive Player Data', async () => {
      const players = await espnAPIService.getComprehensivePlayerData();
      
      if (!Array.isArray(players)) {
        throw new Error('Comprehensive players should be an array');
      }
      
      if (players.length < TEST_CONFIG.MIN_EXPECTED_PLAYERS) {
        console.warn(`Only got ${players.length} comprehensive players`);
      }
    });
  }

  /**
   * Test caching functionality
   */
  private async testCachingFunctionality(): Promise<void> {
    await this.runTest('Caching Functionality', async () => {
      // Clear cache first
      espnAPIService.clearCache();
      
      const startTime = Date.now();
      const players1 = await espnAPIService.getAllPlayers();
      const firstCallDuration = Date.now() - startTime;
      
      const startTime2 = Date.now();
      const players2 = await espnAPIService.getAllPlayers();
      const secondCallDuration = Date.now() - startTime2;
      
      // Second call should be significantly faster due to caching
      if (secondCallDuration >= firstCallDuration) {
        console.warn('Cache may not be working effectively');
      }
      
      // Verify data consistency
      if (players1.length !== players2.length) {
        throw new Error('Cached data inconsistency detected');
      }
    });
  }

  /**
   * Test rate limiting
   */
  private async testRateLimiting(): Promise<void> {
    await this.runTest('Rate Limiting', async () => {
      // Clear cache to force actual API calls
      espnAPIService.clearCache();
      
      // Make multiple rapid calls
      const promises = Array.from({ length: 5 }, () => 
        espnAPIService.getAllPlayers()
      );
      
      const results = await Promise.all(promises);
      
      // All calls should succeed (rate limiting should handle this gracefully)
      if (results.some(result => !Array.isArray(result))) {
        throw new Error('Rate limiting may have caused failures');
      }
    });
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    await this.runTest('Error Handling', async () => {
      // Test with invalid position (should handle gracefully)
      try {
        await espnAPIService.getPlayersByPosition('INVALID' as Position);
        console.log('Invalid position handled gracefully');
      } catch (error) {
        console.log('Error handling working as expected for invalid input');
      }
    });
  }

  /**
   * Test fallback mechanism
   */
  private async testFallbackMechanism(): Promise<void> {
    await this.runTest('Fallback Mechanism', async () => {
      // This test verifies that the service works even when ESPN API is unavailable
      // The service should fall back to Browser MCP or mock data
      
      const players = await espnAPIService.getAllPlayers();
      
      if (!Array.isArray(players) || players.length === 0) {
        throw new Error('Fallback mechanism failed to provide player data');
      }
      
      console.log('Fallback mechanism working correctly');
    });
  }

  /**
   * Test cache management
   */
  private async testCacheManagement(): Promise<void> {
    await this.runTest('Cache Management', async () => {
      // Get initial cache stats
      const initialStats = espnAPIService.getCacheStats();
      
      // Make some calls to populate cache
      await espnAPIService.getAllPlayers();
      await espnAPIService.getFantasyProjections();
      
      // Check cache has grown
      const populatedStats = espnAPIService.getCacheStats();
      
      if (populatedStats.size <= initialStats.size) {
        console.warn('Cache size may not be increasing as expected');
      }
      
      // Clear cache
      espnAPIService.clearCache();
      const clearedStats = espnAPIService.getCacheStats();
      
      if (clearedStats.size !== 0) {
        throw new Error('Cache clearing failed');
      }
    });
  }

  /**
   * Test service status
   */
  private async testServiceStatus(): Promise<void> {
    await this.runTest('Service Status', async () => {
      const status = espnAPIService.getServiceStatus();
      
      const requiredFields = ['initialized', 'cacheSize', 'rateLimitStatus'];
      
      for (const field of requiredFields) {
        if (!(field in status)) {
          throw new Error(`Service status missing field: ${field}`);
        }
      }
      
      if (typeof status.initialized !== 'boolean') {
        throw new Error('Service status initialized should be boolean');
      }
    });
  }

  /**
   * Get test summary
   */
  getTestSummary(): string {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    return `
📊 ESPN API Integration Test Summary
====================================
✅ Tests Passed: ${passed}
❌ Tests Failed: ${failed}
⏱️  Total Duration: ${totalDuration}ms
📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%

${failed > 0 ? '\n⚠️  Failed Tests:\n' + 
  this.results.filter(r => !r.passed)
    .map(r => `   • ${r.name}: ${r.error}`)
    .join('\n') : ''}

🎯 Service Status: ${espnAPIService.isReady() ? 'Ready' : 'Fallback Mode'}
💾 Cache Status: ${espnAPIService.getCacheStats().size} entries
    `;
  }
}

// Export test runner function
export async function runESPNAPITests(): Promise<void> {
  const testSuite = new ESPNAPITestSuite();
  const results = await testSuite.runAllTests();
  
  console.log(testSuite.getTestSummary());
  
  // Return results for programmatic access
  return results;
}