/**
 * Basic Browser MCP Service Tests
 * 
 * Simple validation tests for the enhanced Browser MCP service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { browserMCPService } from '../BrowserMCPService';

describe('Browser MCP Service - Basic Tests', () => {
  beforeEach(() => {
    browserMCPService.clearCache();
  });

  it('should initialize successfully', async () => {
    const result = await browserMCPService.initialize();
    expect(result).toBe(true);
  });

  it('should provide scraping targets configuration', () => {
    const targets = browserMCPService.getScrapingTargets();
    
    expect(targets).toHaveProperty('nfl_injuries');
    expect(targets).toHaveProperty('fantasypros_rankings');
    expect(targets).toHaveProperty('sleeper_adp');
    expect(targets).toHaveProperty('espn_backup');
    
    // Validate structure
    expect(targets.nfl_injuries).toMatchObject({
      id: 'nfl_injuries',
      name: 'NFL.com Injury Reports',
      url: expect.stringContaining('nfl.com'),
      rateLimit: expect.any(Number)
    });
  });

  it('should perform health check', async () => {
    await browserMCPService.initialize();
    
    const health = await browserMCPService.healthCheck();
    
    expect(health).toHaveProperty('fantasypros');
    expect(health).toHaveProperty('espn');
    expect(health).toHaveProperty('nfl');
    expect(health).toHaveProperty('sleeper');
    
    // All should be boolean values
    Object.values(health).forEach(status => {
      expect(typeof status).toBe('boolean');
    });
  });

  it('should scrape NFL injuries with fallback data', async () => {
    await browserMCPService.initialize();
    
    const injuries = await browserMCPService.scrapeNFLInjuries();
    
    expect(Array.isArray(injuries)).toBe(true);
    if (injuries.length > 0) {
      expect(injuries[0]).toMatchObject({
        playerId: expect.any(String),
        playerName: expect.any(String),
        status: expect.any(String),
        source: 'NFL.com'
      });
    }
  });

  it('should scrape FantasyPros rankings with fallback data', async () => {
    await browserMCPService.initialize();
    
    const rankings = await browserMCPService.scrapeFantasyProRankings();
    
    expect(Array.isArray(rankings)).toBe(true);
    if (rankings.length > 0) {
      expect(rankings[0]).toMatchObject({
        playerId: expect.any(String),
        playerName: expect.any(String),
        rank: expect.any(Number),
        projectedPoints: expect.any(Number)
      });
    }
  });

  it('should provide service metrics', async () => {
    await browserMCPService.initialize();
    
    const metrics = browserMCPService.getServiceMetrics();
    
    expect(metrics).toMatchObject({
      totalRequests: expect.any(Number),
      successfulRequests: expect.any(Number),
      failedRequests: expect.any(Number),
      avgResponseTime: expect.any(Number),
      rateLimitHits: expect.any(Number),
      cacheHitRate: expect.any(Number),
      lastHealthCheck: expect.any(Date),
      cacheSize: expect.any(Number),
      activeSessions: expect.any(Number),
      uptime: expect.any(String)
    });
  });

  it('should provide cache statistics', async () => {
    await browserMCPService.initialize();
    
    const cacheStats = browserMCPService.getCacheStats();
    
    expect(cacheStats).toMatchObject({
      size: expect.any(Number),
      entries: expect.any(Array)
    });
    
    // oldestEntry is null when cache is empty, Date when cache has entries
    expect(cacheStats.oldestEntry === null || cacheStats.oldestEntry instanceof Date).toBe(true);
  });

  it('should support subscriber pattern', async () => {
    const mockData = [{ id: 'test', headline: 'Test News' }];
    
    return new Promise<void>((resolve) => {
      const unsubscribe = browserMCPService.subscribe('news', (data) => {
        expect(data).toEqual(mockData);
        unsubscribe();
        resolve();
      });
      
      // Trigger notification
      (browserMCPService as any).notify('news', mockData);
    });
  });

  it('should clear cache successfully', () => {
    expect(() => browserMCPService.clearCache()).not.toThrow();
  });
});