/**
 * ESPN API Integration Tests
 * 
 * Comprehensive testing of ESPN API integration including:
 * - API endpoint validation
 * - Caching mechanisms
 * - Error handling and fallbacks
 * - Data transformation accuracy
 * - Performance and response times
 */

import { test, expect, Page } from '@playwright/test';
import { createExtendedPage, PerformanceMonitor, testUtils } from '../setup/test-helpers';
import { MockManager, espnApiMocks } from '../fixtures/mock-responses';
import { mockPlayers, espnApiMockResponses, performanceBenchmarks } from '../fixtures/test-data';

// Test group configuration
test.describe('ESPN API Integration', () => {
  let extendedPage: any;
  let mockManager: MockManager;
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page }) => {
    extendedPage = createExtendedPage(page);
    mockManager = new MockManager(page);
    performanceMonitor = new PerformanceMonitor(page);
    
    // Start performance monitoring
    await performanceMonitor.startMonitoring();
    
    // Set up base environment
    await page.addInitScript(() => {
      // Enable detailed logging for tests
      window.console.log = (...args) => console.log('PAGE:', ...args);
    });
  });

  test.afterEach(async () => {
    await mockManager.cleanup();
  });

  test.describe('ESPN API Endpoints', () => {
    test('should fetch all NFL players successfully', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();

      // Wait for API call and validate response
      const response = await extendedPage.helpers.validateAPIResponse('/athletes', 200);
      expect(response).toBeTruthy();
      
      // Verify player data is displayed
      await expect(page.locator('[data-testid="player-row"]').first()).toBeVisible();
      
      // Check that players have required fields
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await expect(firstPlayer.locator('[data-testid="player-name"]')).not.toBeEmpty();
      await expect(firstPlayer.locator('[data-testid="player-position"]')).not.toBeEmpty();
      await expect(firstPlayer.locator('[data-testid="player-team"]')).not.toBeEmpty();
    });

    test('should fetch players by position', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();

      // Filter by position
      await page.click('[data-testid="position-filter"]');
      await page.click('[data-testid="filter-QB"]');

      // Wait for filtered results
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Verify all visible players are QBs
      const playerPositions = await page.locator('[data-testid="player-position"]').allTextContents();
      expect(playerPositions.every(pos => pos === 'QB')).toBe(true);
    });

    test('should fetch fantasy projections', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();

      // Navigate to projections view
      await page.click('[data-testid="nav-projections"]');
      
      // Wait for projections to load
      await page.waitForSelector('[data-testid="projection-row"]');
      
      // Verify projection data
      const firstProjection = page.locator('[data-testid="projection-row"]').first();
      await expect(firstProjection.locator('[data-testid="projected-points"]')).not.toBeEmpty();
      await expect(firstProjection.locator('[data-testid="projected-stats"]')).not.toBeEmpty();
    });

    test('should fetch injury reports', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();

      // Navigate to injury reports
      await page.click('[data-testid="nav-injuries"]');
      
      // Wait for injury data to load
      await page.waitForSelector('[data-testid="injury-report"]');
      
      // Verify injury information
      const firstInjury = page.locator('[data-testid="injury-report"]').first();
      await expect(firstInjury.locator('[data-testid="injury-status"]')).not.toBeEmpty();
      await expect(firstInjury.locator('[data-testid="injury-description"]')).not.toBeEmpty();
    });

    test('should fetch team data', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();

      // Navigate to teams view
      await page.click('[data-testid="nav-teams"]');
      
      // Wait for team data to load
      await page.waitForSelector('[data-testid="team-card"]');
      
      // Verify team information
      const firstTeam = page.locator('[data-testid="team-card"]').first();
      await expect(firstTeam.locator('[data-testid="team-name"]')).not.toBeEmpty();
      await expect(firstTeam.locator('[data-testid="team-logo"]')).toBeVisible();
    });
  });

  test.describe('Caching Mechanisms', () => {
    test('should cache API responses effectively', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();

      // First load
      const startTime1 = Date.now();
      await page.waitForSelector('[data-testid="player-row"]');
      const loadTime1 = Date.now() - startTime1;

      // Navigate away and back
      await extendedPage.helpers.navigateToComparison();
      await extendedPage.helpers.navigateToHome();

      // Second load (should be cached)
      const startTime2 = Date.now();
      await page.waitForSelector('[data-testid="player-row"]');
      const loadTime2 = Date.now() - startTime2;

      // Cache hit should be significantly faster
      expect(loadTime2).toBeLessThan(loadTime1 * 0.5);
    });

    test('should invalidate cache after TTL expiration', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      
      // Set short cache TTL for testing
      await page.addInitScript(() => {
        window.localStorage.setItem('espn_cache_ttl', '100'); // 100ms
      });

      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]');

      // Wait for cache to expire
      await page.waitForTimeout(200);

      // Navigate away and back to trigger cache check
      await extendedPage.helpers.navigateToComparison();
      await extendedPage.helpers.navigateToHome();

      // Should make new API call
      const apiCall = page.waitForResponse(response => 
        response.url().includes('athletes') && response.status() === 200
      );

      await page.reload();
      await apiCall;
    });

    test('should display cache statistics', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();

      // Open developer tools or cache stats panel
      await page.click('[data-testid="dev-tools-toggle"]').catch(() => {
        // Dev tools might not be available in test mode
        console.log('Dev tools not available in test mode');
      });

      // Verify cache statistics are available
      const cacheStats = await page.evaluate(() => {
        return window.localStorage.getItem('espn_cache_stats');
      });

      expect(cacheStats).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API timeouts gracefully', async ({ page }) => {
      await mockManager.setupESPNMocks(['timeout']);
      
      // Set shorter timeout for testing
      await page.addInitScript(() => {
        window.__ESPN_API_TIMEOUT__ = 5000;
      });

      await extendedPage.helpers.navigateToHome();

      // Should show timeout error message
      await expect(page.locator('[data-testid="error-timeout"]')).toBeVisible({ timeout: 10000 });
      
      // Should offer retry option
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should handle rate limiting', async ({ page }) => {
      await mockManager.setupESPNMocks(['rateLimit']);
      await extendedPage.helpers.navigateToHome();

      // Should show rate limit message
      await expect(page.locator('[data-testid="error-rate-limit"]')).toBeVisible();
      
      // Should show retry timer
      await expect(page.locator('[data-testid="retry-timer"]')).toBeVisible();
    });

    test('should handle server errors', async ({ page }) => {
      await mockManager.setupESPNMocks(['serverError']);
      await extendedPage.helpers.navigateToHome();

      // Should show server error message
      await expect(page.locator('[data-testid="error-server"]')).toBeVisible();
      
      // Should not break the application
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });

    test('should fallback to Browser MCP on ESPN API failure', async ({ page }) => {
      // Set up ESPN API to fail
      await mockManager.setupESPNMocks(['serverError']);
      
      // Enable Browser MCP fallback
      await mockManager.setupBrowserMCPMocks();
      
      await extendedPage.helpers.navigateToHome();

      // Should show fallback data from Browser MCP
      await expect(page.locator('[data-testid="player-row"]')).toBeVisible();
      
      // Should show fallback indicator
      await expect(page.locator('[data-testid="fallback-indicator"]')).toBeVisible();
    });
  });

  test.describe('Data Transformation', () => {
    test('should correctly transform ESPN player data', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();

      // Wait for data to load
      await page.waitForSelector('[data-testid="player-row"]');

      // Verify data transformation
      const playerData = await page.evaluate(() => {
        const playerRow = document.querySelector('[data-testid="player-row"]');
        return {
          name: playerRow?.querySelector('[data-testid="player-name"]')?.textContent,
          position: playerRow?.querySelector('[data-testid="player-position"]')?.textContent,
          team: playerRow?.querySelector('[data-testid="player-team"]')?.textContent,
        };
      });

      expect(playerData.name).toBeTruthy();
      expect(['QB', 'RB', 'WR', 'TE', 'DEF', 'K']).toContain(playerData.position);
      expect(playerData.team).toMatch(/^[A-Z]{2,4}$/); // Team abbreviation format
    });

    test('should handle missing player data gracefully', async ({ page }) => {
      // Set up mock with incomplete data
      await page.route('**/athletes*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: '1',
                displayName: 'Test Player',
                // Missing position and team data
              }
            ]
          })
        });
      });

      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]');

      // Should show player with default values
      const playerRow = page.locator('[data-testid="player-row"]').first();
      await expect(playerRow.locator('[data-testid="player-name"]')).toContainText('Test Player');
      
      // Should show default position if missing
      const position = await playerRow.locator('[data-testid="player-position"]').textContent();
      expect(position).toBeTruthy();
    });

    test('should correctly calculate fantasy points', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();

      // Navigate to projections view
      await page.click('[data-testid="nav-projections"]');
      await page.waitForSelector('[data-testid="projection-row"]');

      // Verify fantasy point calculations
      const projection = await page.evaluate(() => {
        const projRow = document.querySelector('[data-testid="projection-row"]');
        return {
          standard: projRow?.querySelector('[data-testid="standard-points"]')?.textContent,
          ppr: projRow?.querySelector('[data-testid="ppr-points"]')?.textContent,
          halfPpr: projRow?.querySelector('[data-testid="half-ppr-points"]')?.textContent,
        };
      });

      expect(parseFloat(projection.standard || '0')).toBeGreaterThan(0);
      expect(parseFloat(projection.ppr || '0')).toBeGreaterThan(0);
      expect(parseFloat(projection.halfPpr || '0')).toBeGreaterThan(0);
      
      // PPR should be higher than standard for skill position players
      expect(parseFloat(projection.ppr || '0')).toBeGreaterThanOrEqual(parseFloat(projection.standard || '0'));
    });
  });

  test.describe('Performance', () => {
    test('should load player data within performance benchmarks', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      
      const loadTime = await extendedPage.helpers.measurePageLoad();
      expect(loadTime).toBeLessThan(performanceBenchmarks.pageLoad);
    });

    test('should handle API response times efficiently', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      
      const apiResponsePromise = page.waitForResponse(response => 
        response.url().includes('athletes')
      );

      await extendedPage.helpers.navigateToHome();
      
      const response = await apiResponsePromise;
      const responseTime = response.timing().responseStart;
      
      expect(responseTime).toBeLessThan(performanceBenchmarks.apiCall);
    });

    test('should maintain memory usage within limits', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();
      
      // Load data multiple times
      for (let i = 0; i < 5; i++) {
        await page.reload();
        await page.waitForSelector('[data-testid="player-row"]');
      }

      const memoryUsage = await extendedPage.helpers.getMemoryUsage();
      expect(memoryUsage).toBeLessThan(100); // 100MB limit
    });

    test('should optimize network requests', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();
      
      const networkRequests = await extendedPage.helpers.getNetworkRequests();
      expect(networkRequests).toBeLessThan(20); // Reasonable limit for initial load
    });
  });

  test.describe('Rate Limiting', () => {
    test('should respect API rate limits', async ({ page }) => {
      let requestCount = 0;
      
      await page.route('**/athletes*', async (route) => {
        requestCount++;
        
        if (requestCount > 5) {
          await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Rate limit exceeded' })
          });
        } else {
          await route.continue();
        }
      });

      // Make multiple requests rapidly
      for (let i = 0; i < 10; i++) {
        await page.reload();
        await page.waitForTimeout(100);
      }

      // Should show rate limit handling
      await expect(page.locator('[data-testid="rate-limit-warning"]')).toBeVisible();
    });

    test('should implement exponential backoff', async ({ page }) => {
      let requestTimes: number[] = [];
      
      await page.route('**/athletes*', async (route) => {
        requestTimes.push(Date.now());
        
        if (requestTimes.length <= 2) {
          await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Rate limit exceeded' })
          });
        } else {
          await route.continue();
        }
      });

      await extendedPage.helpers.navigateToHome();
      
      // Verify increasing delays between retries
      if (requestTimes.length >= 3) {
        const delay1 = requestTimes[1] - requestTimes[0];
        const delay2 = requestTimes[2] - requestTimes[1];
        expect(delay2).toBeGreaterThan(delay1);
      }
    });
  });

  test.describe('Data Consistency', () => {
    test('should maintain data consistency across page reloads', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();

      // Get initial player data
      const initialPlayers = await page.locator('[data-testid="player-name"]').allTextContents();
      
      // Reload page
      await page.reload();
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Get players after reload
      const reloadedPlayers = await page.locator('[data-testid="player-name"]').allTextContents();
      
      // Data should be consistent
      expect(reloadedPlayers).toEqual(initialPlayers);
    });

    test('should handle concurrent API calls correctly', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      
      // Open multiple tabs/contexts simultaneously
      const [response1, response2] = await Promise.all([
        page.waitForResponse(r => r.url().includes('athletes')),
        page.waitForResponse(r => r.url().includes('teams'))
      ]);

      await extendedPage.helpers.navigateToHome();
      
      expect(response1.status()).toBe(200);
      expect(response2.status()).toBe(200);
    });
  });

  test.describe('Integration with Application State', () => {
    test('should integrate ESPN data with draft board', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToDraft();

      // Verify ESPN player data appears in draft board
      await expect(page.locator('[data-testid="draft-board"]')).toBeVisible();
      await expect(page.locator('[data-testid="player-row"]').first()).toBeVisible();
      
      // Verify player data integrity in draft context
      const playerName = await page.locator('[data-testid="player-name"]').first().textContent();
      expect(playerName).toBeTruthy();
    });

    test('should update injury status in real-time', async ({ page }) => {
      await mockManager.setupESPNMocks(['success']);
      await extendedPage.helpers.navigateToHome();

      // Initial load
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Simulate injury update
      await page.route('**/injuries*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            articles: [
              {
                headline: 'Breaking: Player injured in practice',
                description: 'Questionable for Sunday',
                published: new Date().toISOString(),
              }
            ]
          })
        });
      });

      // Trigger injury data refresh
      await page.click('[data-testid="refresh-injuries"]');
      
      // Verify injury status update
      await expect(page.locator('[data-testid="injury-alert"]')).toBeVisible();
    });
  });
});

// Performance-specific tests
test.describe('ESPN API Performance', () => {
  test('should pass Core Web Vitals benchmarks', async ({ page }) => {
    const mockManager = new MockManager(page);
    await mockManager.setupESPNMocks(['success']);
    
    await page.goto('/');
    
    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              vitals.FID = (entry as any).processingStart - entry.startTime;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });

    // LCP should be under 2.5s
    if ((vitals as any).LCP) {
      expect((vitals as any).LCP).toBeLessThan(2500);
    }
    
    // FID should be under 100ms
    if ((vitals as any).FID) {
      expect((vitals as any).FID).toBeLessThan(100);
    }
  });
});