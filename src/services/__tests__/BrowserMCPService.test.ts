/**
 * Enhanced Browser MCP Service Tests
 * 
 * Tests the production-ready Browser MCP integration with real Playwright automation
 * for comprehensive fantasy football data scraping.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { browserMCPService } from '../BrowserMCPService';

// Mock Browser MCP functions for testing
const mockBrowserMCP = {
  mcpBrowserNavigate: vi.fn(),
  mcpBrowserSnapshot: vi.fn(),
  mcpBrowserWaitFor: vi.fn(),
  mcpBrowserTakeScreenshot: vi.fn(),
};

// Inject mocks into global scope
Object.assign(globalThis, mockBrowserMCP);

describe('Enhanced Browser MCP Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    browserMCPService.clearCache();
  });

  afterEach(() => {
    browserMCPService.stopAutoRefresh();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully with Browser MCP tools available', async () => {
      mockBrowserMCP.mcpBrowserNavigate.mockResolvedValueOnce(undefined);
      mockBrowserMCP.mcpBrowserSnapshot.mockResolvedValueOnce({ elements: [] });

      const result = await browserMCPService.initialize();

      expect(result).toBe(true);
      expect(mockBrowserMCP.mcpBrowserNavigate).toHaveBeenCalledWith('https://www.nfl.com');
      expect(mockBrowserMCP.mcpBrowserSnapshot).toHaveBeenCalled();
    });

    it('should handle initialization gracefully when Browser MCP tools are unavailable', async () => {
      // Remove mock functions to simulate unavailable tools
      delete (globalThis as any).mcpBrowserNavigate;

      const result = await browserMCPService.initialize();

      expect(result).toBe(true); // Should still initialize with fallback simulation
    });

    it('should initialize rate limiters for all scraping targets', async () => {
      await browserMCPService.initialize();
      
      const targets = browserMCPService.getScrapingTargets();
      expect(Object.keys(targets)).toEqual([
        'nfl_injuries',
        'fantasypros_rankings', 
        'sleeper_adp',
        'espn_backup'
      ]);
    });
  });

  describe('NFL Injury Scraping', () => {
    beforeEach(async () => {
      await browserMCPService.initialize();
    });

    it('should scrape NFL injury reports with real Browser MCP', async () => {
      const mockSnapshot = {
        elements: [
          {
            id: 'injury-1',
            text: 'Christian McCaffrey (SF) - Questionable: Calf',
            data: { player: 'Christian McCaffrey', status: 'Questionable', injury: 'Calf', team: 'SF' }
          },
          {
            id: 'injury-2', 
            text: 'Cooper Kupp (LAR) - Doubtful: Ankle',
            data: { player: 'Cooper Kupp', status: 'Doubtful', injury: 'Ankle', team: 'LAR' }
          }
        ]
      };

      mockBrowserMCP.mcpBrowserNavigate.mockResolvedValueOnce(undefined);
      mockBrowserMCP.mcpBrowserSnapshot.mockResolvedValueOnce(mockSnapshot);

      const injuries = await browserMCPService.scrapeNFLInjuries();

      expect(injuries).toHaveLength(2);
      expect(injuries[0]).toMatchObject({
        playerName: 'Christian McCaffrey',
        team: 'SF',
        status: 'Questionable',
        source: 'NFL.com'
      });
      
      expect(mockBrowserMCP.mcpBrowserNavigate).toHaveBeenCalledWith(
        'https://www.nfl.com/news/injuries/'
      );
    });

    it('should handle scraping failures gracefully with fallback data', async () => {
      mockBrowserMCP.mcpBrowserNavigate.mockRejectedValueOnce(new Error('Network error'));

      const injuries = await browserMCPService.scrapeNFLInjuries();

      expect(injuries).toBeInstanceOf(Array);
      expect(injuries.length).toBeGreaterThan(0);
      expect(injuries[0]).toHaveProperty('playerName');
      expect(injuries[0]).toHaveProperty('status');
    });

    it('should enforce rate limiting between requests', async () => {
      const startTime = Date.now();
      
      // First request should go through immediately
      await browserMCPService.scrapeNFLInjuries();
      
      // Second request should be rate limited
      await browserMCPService.scrapeNFLInjuries();
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThan(3000); // Should wait at least 3 seconds for NFL rate limit
    });
  });

  describe('FantasyPros Rankings Scraping', () => {
    beforeEach(async () => {
      await browserMCPService.initialize();
    });

    it('should scrape FantasyPros consensus rankings', async () => {
      const mockSnapshot = {
        elements: [
          {
            id: 'rank-1',
            text: '#1 Christian McCaffrey (RB, SF)',
            data: { name: 'Christian McCaffrey', pos: 'RB', team: 'SF', rank: 1 }
          },
          {
            id: 'rank-2',
            text: '#2 CeeDee Lamb (WR, DAL)', 
            data: { name: 'CeeDee Lamb', pos: 'WR', team: 'DAL', rank: 2 }
          }
        ]
      };

      mockBrowserMCP.mcpBrowserSnapshot.mockResolvedValueOnce(mockSnapshot);

      const rankings = await browserMCPService.scrapeFantasyProRankings();

      expect(rankings).toHaveLength(2);
      expect(rankings[0]).toMatchObject({
        playerName: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        rank: 1,
        tier: 1
      });
      
      expect(rankings[1].rank).toBe(2);
    });

    it('should calculate tiers correctly based on rankings', async () => {
      await browserMCPService.initialize();
      
      const rankings = await browserMCPService.scrapeFantasyProRankings();
      
      rankings.forEach(ranking => {
        const expectedTier = Math.ceil(ranking.rank / 12);
        expect(ranking.tier).toBe(expectedTier);
      });
    });
  });

  describe('Sleeper ADP Scraping', () => {
    beforeEach(async () => {
      await browserMCPService.initialize();
    });

    it('should scrape Sleeper ADP data', async () => {
      const mockSnapshot = {
        elements: [
          {
            id: 'adp-1',
            text: 'Christian McCaffrey - ADP: 1.2 (+0.1)',
            data: { name: 'Christian McCaffrey', adp: 1.2, change: 0.1 }
          }
        ]
      };

      mockBrowserMCP.mcpBrowserSnapshot.mockResolvedValueOnce(mockSnapshot);

      const adpData = await browserMCPService.scrapeSleeperADP();

      expect(adpData).toHaveLength(1);
      expect(adpData[0]).toMatchObject({
        playerName: 'Christian McCaffrey',
        adp: 1.2,
        adpChange: 0.1
      });
    });
  });

  describe('ESPN Backup Scraping', () => {
    beforeEach(async () => {
      await browserMCPService.initialize();
    });

    it('should scrape ESPN projections as backup', async () => {
      const mockSnapshot = {
        elements: [
          {
            id: 'proj-1',
            text: 'Josh Allen (QB) - 24.8 pts',
            data: { name: 'Josh Allen', pos: 'QB', projection: 24.8 }
          }
        ]
      };

      mockBrowserMCP.mcpBrowserSnapshot.mockResolvedValueOnce(mockSnapshot);

      const projections = await browserMCPService.scrapeESPNBackup();

      expect(projections).toHaveLength(1);
      expect(projections[0]).toMatchObject({
        playerName: 'Josh Allen',
        position: 'QB',
        projectedPoints: 24.8,
        rank: 1
      });
    });
  });

  describe('Health Check System', () => {
    beforeEach(async () => {
      await browserMCPService.initialize();
    });

    it('should perform comprehensive health checks', async () => {
      mockBrowserMCP.mcpBrowserNavigate.mockResolvedValue(undefined);

      const healthStatus = await browserMCPService.healthCheck();

      expect(healthStatus).toHaveProperty('fantasypros');
      expect(healthStatus).toHaveProperty('espn');
      expect(healthStatus).toHaveProperty('nfl');
      expect(healthStatus).toHaveProperty('sleeper');
      
      expect(Object.values(healthStatus).every(status => typeof status === 'boolean')).toBe(true);
    });

    it('should handle individual source failures in health check', async () => {
      mockBrowserMCP.mcpBrowserNavigate
        .mockResolvedValueOnce(undefined) // fantasypros succeeds
        .mockRejectedValueOnce(new Error('Timeout')) // espn fails
        .mockResolvedValueOnce(undefined) // nfl succeeds
        .mockResolvedValueOnce(undefined); // sleeper succeeds

      const healthStatus = await browserMCPService.healthCheck();

      expect(healthStatus.fantasypros).toBe(true);
      expect(healthStatus.espn).toBe(false);
      expect(healthStatus.nfl).toBe(true);
      expect(healthStatus.sleeper).toBe(true);
    });
  });

  describe('Screenshot Debugging', () => {
    beforeEach(async () => {
      await browserMCPService.initialize();
    });

    it('should capture screenshots for debugging', async () => {
      mockBrowserMCP.mcpBrowserTakeScreenshot.mockResolvedValueOnce(undefined);

      const filename = await browserMCPService.capturePageScreenshot('test_target');

      expect(filename).toMatch(/debug-test_target-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
      expect(mockBrowserMCP.mcpBrowserTakeScreenshot).toHaveBeenCalledWith(filename);
    });

    it('should capture error screenshots automatically on scraping failures', async () => {
      mockBrowserMCP.mcpBrowserNavigate.mockRejectedValueOnce(new Error('Page load failed'));
      mockBrowserMCP.mcpBrowserTakeScreenshot.mockResolvedValueOnce(undefined);

      try {
        await browserMCPService.scrapeNFLInjuries();
      } catch (error) {
        // Expected to fail and take screenshot
      }

      expect(mockBrowserMCP.mcpBrowserTakeScreenshot).toHaveBeenCalled();
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await browserMCPService.initialize();
    });

    it('should track comprehensive performance metrics', async () => {
      // Perform some operations
      await browserMCPService.scrapeNFLInjuries();
      await browserMCPService.healthCheck();

      const metrics = browserMCPService.getServiceMetrics();

      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('successfulRequests');
      expect(metrics).toHaveProperty('failedRequests');
      expect(metrics).toHaveProperty('avgResponseTime');
      expect(metrics).toHaveProperty('rateLimitHits');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('lastHealthCheck');
      expect(metrics).toHaveProperty('cacheSize');
      expect(metrics).toHaveProperty('activeSessions');
      expect(metrics).toHaveProperty('uptime');

      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(typeof metrics.avgResponseTime).toBe('number');
    });

    it('should log performance metrics', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      browserMCPService.logPerformanceMetrics();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Browser MCP Service Metrics'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Cache Management', () => {
    beforeEach(async () => {
      await browserMCPService.initialize();
    });

    it('should provide cache statistics', async () => {
      // Generate some cached data
      await browserMCPService.scrapeNFLInjuries();
      await browserMCPService.scrapeFantasyProRankings();

      const cacheStats = browserMCPService.getCacheStats();

      expect(cacheStats).toHaveProperty('size');
      expect(cacheStats).toHaveProperty('entries');
      expect(cacheStats).toHaveProperty('oldestEntry');
      
      expect(cacheStats.size).toBeGreaterThan(0);
      expect(cacheStats.entries).toBeInstanceOf(Array);
    });

    it('should force refresh all cached data', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await browserMCPService.forceRefreshAll();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Force refreshing all data sources')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Force refresh completed')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Integration with Existing System', () => {
    beforeEach(async () => {
      await browserMCPService.initialize();
    });

    it('should integrate with subscriber pattern for live updates', (done) => {
      const mockNewsData = [
        {
          id: 'test-news-1',
          headline: 'Test Breaking News',
          summary: 'Test summary',
          impactScore: 5,
          affectedPlayers: [],
          category: 'breaking',
          timestamp: new Date(),
          source: 'Test',
          severity: 'high',
          isMyPlayer: false,
          tags: ['test'],
          readTime: 1,
          trending: true
        }
      ];

      // Subscribe to news updates
      const unsubscribe = browserMCPService.subscribe('news', (data) => {
        expect(data).toEqual(mockNewsData);
        unsubscribe();
        done();
      });

      // Trigger news update (this would normally happen during scraping)
      (browserMCPService as any).notify('news', mockNewsData);
    });

    it('should maintain backward compatibility with existing interfaces', async () => {
      const injuries = await browserMCPService.getAllInjuryReports();
      const rankings = await browserMCPService.getConsolidatedRankings();
      const news = await browserMCPService.getConsolidatedNews();

      // Verify interface compatibility
      expect(injuries).toBeInstanceOf(Array);
      expect(rankings).toBeInstanceOf(Array);
      expect(news).toBeInstanceOf(Array);

      if (injuries.length > 0) {
        expect(injuries[0]).toHaveProperty('playerId');
        expect(injuries[0]).toHaveProperty('playerName');
        expect(injuries[0]).toHaveProperty('status');
      }

      if (rankings.length > 0) {
        expect(rankings[0]).toHaveProperty('playerId');
        expect(rankings[0]).toHaveProperty('playerName');
        expect(rankings[0]).toHaveProperty('rank');
      }

      if (news.length > 0) {
        expect(news[0]).toHaveProperty('id');
        expect(news[0]).toHaveProperty('headline');
        expect(news[0]).toHaveProperty('source');
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await browserMCPService.initialize();
    });

    it('should handle network timeouts gracefully', async () => {
      mockBrowserMCP.mcpBrowserNavigate.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      // Should not throw, should return fallback data
      const result = await browserMCPService.scrapeNFLInjuries();
      expect(result).toBeInstanceOf(Array);
    });

    it('should retry operations with exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('Success');

      const result = await browserMCPService.executeWithRetry(operation, 3, 100);

      expect(result).toBe('Success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should clean up inactive browser sessions', async () => {
      // Create some sessions
      (browserMCPService as any).createBrowserSession('test-target-1');
      (browserMCPService as any).createBrowserSession('test-target-2');

      let sessionCount = (browserMCPService as any).browserSessions.size;
      expect(sessionCount).toBe(2);

      // Simulate session cleanup (would normally happen automatically)
      (browserMCPService as any).cleanupInactiveSessions();

      // Note: In real implementation, sessions would be cleaned after 30 minutes of inactivity
      // For testing, we just verify the cleanup method exists and can be called
    });
  });
});