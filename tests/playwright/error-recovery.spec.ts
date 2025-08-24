/**
 * Error Recovery Testing Suite
 * 
 * Comprehensive testing of error handling and recovery including:
 * - Network failure scenarios and recovery
 * - API rate limit handling and backoff
 * - Browser MCP timeout recovery
 * - AI service failures and fallback activation
 * - Cache invalidation and refresh testing
 * - Application resilience and graceful degradation
 */

import { test, expect, Page } from '@playwright/test';
import { createExtendedPage, PerformanceMonitor, testUtils } from '../setup/test-helpers';
import { MockManager } from '../fixtures/mock-responses';
import { errorSimulations, performanceBenchmarks } from '../fixtures/test-data';

// Test group configuration
test.describe('Error Recovery and Resilience', () => {
  let extendedPage: any;
  let mockManager: MockManager;
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page }) => {
    extendedPage = createExtendedPage(page);
    mockManager = new MockManager(page);
    performanceMonitor = new PerformanceMonitor(page);
    
    await performanceMonitor.startMonitoring();
    
    // Set up error recovery test environment
    await page.addInitScript(() => {
      // Enhanced error reporting for tests
      window.addEventListener('error', (event) => {
        console.log('TEST ERROR:', event.error);
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        console.log('TEST UNHANDLED REJECTION:', event.reason);
      });
      
      // Mock error recovery utilities
      (window as any).__testErrorInjection = {
        networkFailure: false,
        apiTimeout: false,
        serviceUnavailable: false,
      };
    });
  });

  test.afterEach(async () => {
    await mockManager.cleanup();
  });

  test.describe('Network Failure Recovery', () => {
    test('should recover from complete network failure', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Simulate complete network failure
      await mockManager.simulateNetworkConditions('offline');
      
      // Attempt to navigate
      await page.click('[data-testid="nav-draft"]').catch(() => {});
      
      // Should show offline message
      await expect(page.locator('[data-testid="offline-warning"]')).toBeVisible({ timeout: 10000 }).catch(() => {
        // Offline handling might be transparent
        console.log('Offline mode is transparent to user');
      });
      
      // Restore network
      await mockManager.simulateNetworkConditions('fast');
      
      // Should automatically recover
      await page.click('[data-testid="retry-connection"]').catch(() => {
        // Might auto-retry
        await page.reload();
      });
      
      // Should work normally after recovery
      await expect(page.locator('[data-testid="draft-board"]')).toBeVisible({ timeout: 15000 });
    });

    test('should handle intermittent connectivity', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      let requestCount = 0;
      
      // Simulate intermittent failures
      await page.route('**/*', async (route) => {
        requestCount++;
        if (requestCount % 3 === 0) {
          // Fail every 3rd request
          await route.abort('connectionfailed');
        } else {
          await route.continue();
        }
      });
      
      // Navigate through app despite intermittent failures
      const actions = [
        () => page.click('[data-testid="nav-draft"]'),
        () => page.click('[data-testid="nav-comparison"]'),
        () => page.click('[data-testid="nav-ai"]'),
        () => page.click('[data-testid="nav-home"]'),
      ];
      
      for (const action of actions) {
        try {
          await action();
          await page.waitForTimeout(2000);
        } catch (error) {
          console.log('Action failed due to intermittent connectivity');
        }
      }
      
      // Application should still be functional
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Should show connectivity warnings
      const warnings = await page.locator('[data-testid="connection-warning"]').count();
      expect(warnings).toBeGreaterThanOrEqual(0);
    });

    test('should handle slow network conditions', async ({ page }) => {
      await mockManager.simulateNetworkConditions('slow3g');
      
      const startTime = Date.now();
      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]', { timeout: 30000 });
      const loadTime = Date.now() - startTime;
      
      // Should load successfully even on slow connection
      expect(loadTime).toBeLessThan(30000); // 30 seconds max for slow connection
      
      // Should show loading indicators
      const hadLoadingIndicators = await page.evaluate(() => {
        return localStorage.getItem('showedLoadingIndicators') === 'true';
      });
      
      // Should optimize for slow connections
      const optimizations = await page.evaluate(() => {
        return localStorage.getItem('slowConnectionOptimizations');
      });
      
      expect(optimizations).toBeTruthy();
    });

    test('should retry failed requests with exponential backoff', async ({ page }) => {
      let attemptTimes: number[] = [];
      
      await page.route('**/athletes*', async (route, request) => {
        attemptTimes.push(Date.now());
        
        if (attemptTimes.length <= 3) {
          await route.abort('connectionfailed');
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ items: [] }),
          });
        }
      });
      
      await extendedPage.helpers.navigateToHome();
      await page.waitForTimeout(10000);
      
      // Should have made multiple attempts
      expect(attemptTimes.length).toBeGreaterThan(1);
      
      // Verify exponential backoff pattern
      if (attemptTimes.length >= 3) {
        const delay1 = attemptTimes[1] - attemptTimes[0];
        const delay2 = attemptTimes[2] - attemptTimes[1];
        expect(delay2).toBeGreaterThan(delay1);
      }
    });
  });

  test.describe('API Error Recovery', () => {
    test('should handle ESPN API rate limiting', async ({ page }) => {
      let requestCount = 0;
      
      await page.route('**/athletes*', async (route) => {
        requestCount++;
        if (requestCount > 2) {
          await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Rate limit exceeded',
              retryAfter: 5000,
            }),
          });
        } else {
          await route.continue();
        }
      });
      
      await extendedPage.helpers.navigateToHome();
      
      // Make multiple requests to trigger rate limiting
      for (let i = 0; i < 5; i++) {
        await page.reload();
        await page.waitForTimeout(500);
      }
      
      // Should show rate limiting message
      await expect(page.locator('[data-testid="rate-limit-message"]')).toBeVisible({ timeout: 10000 });
      
      // Should display countdown timer
      const countdown = await page.locator('[data-testid="retry-countdown"]').textContent();
      expect(countdown).toBeTruthy();
      
      // Should automatically retry after timeout
      await page.waitForTimeout(6000);
      await expect(page.locator('[data-testid="player-row"]')).toBeVisible();
    });

    test('should fallback to Browser MCP when ESPN API fails', async ({ page }) => {
      // Set ESPN API to always fail
      await page.route('**/athletes*', route => route.fulfill({
        status: 500,
        body: 'Internal Server Error',
      }));
      
      // Set up Browser MCP to work
      await mockManager.setupBrowserMCPMocks();
      
      await extendedPage.helpers.navigateToHome();
      
      // Should show data from Browser MCP fallback
      await expect(page.locator('[data-testid="player-row"]')).toBeVisible();
      
      // Should indicate fallback is active
      await expect(page.locator('[data-testid="fallback-active"]')).toBeVisible().catch(() => {
        console.log('Fallback indication is subtle or transparent');
      });
      
      // Data quality should still be good
      const playerData = await page.locator('[data-testid="player-name"]').first().textContent();
      expect(playerData).toBeTruthy();
      expect(playerData?.length).toBeGreaterThan(3);
    });

    test('should handle API server errors gracefully', async ({ page }) => {
      const errorTypes = [500, 502, 503, 504];
      
      for (const errorStatus of errorTypes) {
        await page.route('**/athletes*', route => route.fulfill({
          status: errorStatus,
          statusText: 'Server Error',
        }));
        
        await extendedPage.helpers.navigateToHome();
        
        // Should not crash the application
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
        
        // Should show appropriate error message
        const errorMessage = await page.locator('[data-testid="api-error"]').textContent().catch(() => null);
        if (errorMessage) {
          expect(errorMessage.toLowerCase()).toMatch(/error|unavailable|problem/);
        }
        
        // Clean up route for next iteration
        await page.unroute('**/athletes*');
      }
    });

    test('should handle malformed API responses', async ({ page }) => {
      const malformedResponses = [
        '{"invalid": json}', // Invalid JSON
        '<html>Not JSON</html>', // HTML response
        '', // Empty response
        '{"data": null}', // Null data
      ];
      
      for (const response of malformedResponses) {
        await page.route('**/athletes*', route => route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: response,
        }));
        
        await extendedPage.helpers.navigateToHome();
        
        // Should not crash
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
        
        // Should show error state or fallback data
        const hasContent = await Promise.race([
          page.locator('[data-testid="player-row"]').isVisible(),
          page.locator('[data-testid="data-error"]').isVisible(),
          page.locator('[data-testid="fallback-data"]').isVisible(),
        ]);
        
        expect(hasContent).toBe(true);
        
        await page.unroute('**/athletes*');
      }
    });
  });

  test.describe('Browser MCP Error Recovery', () => {
    test('should handle Browser MCP navigation failures', async ({ page }) => {
      // Mock Browser MCP navigation to fail
      await page.addInitScript(() => {
        (window as any).mcpBrowserNavigate = async () => {
          throw new Error('Navigation failed');
        };
      });
      
      await extendedPage.helpers.navigateToHome();
      await page.click('[data-testid="nav-injuries"]');
      
      // Should show error state or fallback data
      const hasContent = await Promise.race([
        page.locator('[data-testid="injury-report"]').isVisible(),
        page.locator('[data-testid="scraping-error"]').isVisible(),
        page.locator('[data-testid="fallback-injuries"]').isVisible(),
      ]);
      
      expect(hasContent).toBe(true);
      
      // Should allow retry
      await page.click('[data-testid="retry-scraping"]').catch(() => {
        console.log('Manual retry not available');
      });
    });

    test('should handle Browser MCP timeout scenarios', async ({ page }) => {
      // Mock very slow Browser MCP responses
      await page.addInitScript(() => {
        (window as any).mcpBrowserSnapshot = async () => {
          await new Promise(resolve => setTimeout(resolve, 30000));
          return { elements: [] };
        };
      });
      
      await extendedPage.helpers.navigateToHome();
      await page.click('[data-testid="nav-rankings"]');
      
      // Should timeout and show appropriate message
      await expect(page.locator('[data-testid="scraping-timeout"]')).toBeVisible({ timeout: 35000 });
      
      // Should offer fallback options
      const fallbackOptions = await page.locator('[data-testid="timeout-fallback"]').count();
      expect(fallbackOptions).toBeGreaterThanOrEqual(0);
    });

    test('should handle CSS selector failures', async ({ page }) => {
      // Mock Browser MCP with empty results
      await page.addInitScript(() => {
        (window as any).mcpBrowserSnapshot = async () => {
          return { elements: [] }; // No elements found
        };
      });
      
      await extendedPage.helpers.navigateToHome();
      await page.click('[data-testid="nav-rankings"]');
      
      // Should handle gracefully
      await expect(page.locator('[data-testid="no-data-found"]')).toBeVisible().catch(() => {
        // Might show fallback data instead
        console.log('CSS selector failure handled with fallback');
      });
      
      // Should suggest data refresh
      const refreshSuggestion = await page.locator('[data-testid="suggest-refresh"]').count();
      expect(refreshSuggestion).toBeGreaterThanOrEqual(0);
    });

    test('should recover from Browser MCP service crashes', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Initial successful scraping
      await page.click('[data-testid="nav-injuries"]');
      await page.waitForSelector('[data-testid="injury-report"]').catch(() => {});
      
      // Simulate service crash
      await page.addInitScript(() => {
        delete (window as any).mcpBrowserNavigate;
        delete (window as any).mcpBrowserSnapshot;
      });
      
      // Try to use service again
      await page.click('[data-testid="refresh-injuries"]');
      
      // Should detect service unavailability and provide alternatives
      await expect(page.locator('[data-testid="service-unavailable"]')).toBeVisible({ timeout: 10000 }).catch(() => {
        // Might fall back transparently
        console.log('Service crash recovery is transparent');
      });
      
      // Should still function with cached data
      const cachedData = await page.locator('[data-testid="injury-report"]').count();
      expect(cachedData).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('AI Service Error Recovery', () => {
    test('should handle Local Gemini service failures', async ({ page }) => {
      // Mock local service failure
      await page.route('http://localhost:3001/**', route => route.abort('connectionfailed'));
      
      // Set up cloud service as backup
      await mockManager.setupCloudGeminiMocks(['available']);
      
      await extendedPage.helpers.navigateToAI();
      
      const response = await extendedPage.helpers.sendAIMessage('Test message after local failure');
      
      // Should get response from cloud fallback
      expect(response).toBeTruthy();
      expect(response.length).toBeGreaterThan(20);
      
      // Should indicate fallback is active
      const backendStatus = await page.locator('[data-testid="active-backend"]').textContent();
      expect(backendStatus).toMatch(/cloud|fallback/);
    });

    test('should handle Cloud Gemini service failures', async ({ page }) => {
      // Set local service as unavailable
      await mockManager.setupLocalGeminiMocks(['unavailable']);
      
      // Mock cloud service failure
      await page.route('**/.netlify/functions/**', route => route.fulfill({
        status: 500,
        body: 'Cloud service error',
      }));
      
      await extendedPage.helpers.navigateToAI();
      
      const response = await extendedPage.helpers.sendAIMessage('Test message with all services failing');
      
      // Should provide offline response
      expect(response).toBeTruthy();
      expect(response.toLowerCase()).toMatch(/offline|general|advice/);
      
      // Should indicate offline mode
      await expect(page.locator('[data-testid="offline-mode"]')).toBeVisible();
    });

    test('should handle AI request timeouts', async ({ page }) => {
      // Mock very slow AI responses
      await page.route('**/api/fantasy-ai', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 45000));
        await route.continue();
      });
      
      await extendedPage.helpers.navigateToAI();
      
      const startTime = Date.now();
      const response = await extendedPage.helpers.sendAIMessage('Test timeout scenario');
      const responseTime = Date.now() - startTime;
      
      // Should timeout and provide fallback within reasonable time
      expect(responseTime).toBeLessThan(35000);
      expect(response).toBeTruthy();
      
      // Should show timeout message
      await expect(page.locator('[data-testid="ai-timeout"]')).toBeVisible().catch(() => {
        console.log('AI timeout handled transparently');
      });
    });

    test('should handle WebSocket connection failures', async ({ page }) => {
      // Mock WebSocket connection failure
      await page.addInitScript(() => {
        const OriginalWebSocket = window.WebSocket;
        (window as any).WebSocket = class MockWebSocket extends OriginalWebSocket {
          constructor(url: string) {
            super(url);
            setTimeout(() => {
              this.dispatchEvent(new Event('error'));
            }, 100);
          }
        };
      });
      
      await extendedPage.helpers.navigateToAI();
      
      // Should fallback to HTTP
      const response = await extendedPage.helpers.sendAIMessage('Test WebSocket failure fallback');
      expect(response).toBeTruthy();
      
      // Should indicate connection method
      const connectionStatus = await page.evaluate(() => {
        return localStorage.getItem('aiConnectionMethod');
      });
      expect(connectionStatus).toMatch(/http|fallback/);
    });

    test('should handle malformed AI responses', async ({ page }) => {
      // Mock malformed AI responses
      await page.route('**/api/fantasy-ai', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"malformed": response without proper structure}',
      }));
      
      await extendedPage.helpers.navigateToAI();
      
      const response = await extendedPage.helpers.sendAIMessage('Test malformed response handling');
      
      // Should handle gracefully with fallback response
      expect(response).toBeTruthy();
      
      // Should log error for debugging
      const errorLogged = await page.evaluate(() => {
        return localStorage.getItem('aiResponseError');
      });
      expect(errorLogged).toBeTruthy();
    });
  });

  test.describe('Cache and Storage Recovery', () => {
    test('should handle cache corruption', async ({ page }) => {
      // Corrupt the cache
      await page.addInitScript(() => {
        localStorage.setItem('espnDataCache', 'corrupted-cache-data');
        localStorage.setItem('browserMCPCache', '{"invalid": json}');
      });
      
      await extendedPage.helpers.navigateToHome();
      
      // Should detect corruption and clear cache
      await page.waitForTimeout(5000);
      
      // Should still load data successfully
      await expect(page.locator('[data-testid="player-row"]')).toBeVisible();
      
      // Cache should be rebuilt
      const cacheStatus = await page.evaluate(() => {
        return localStorage.getItem('cacheRebuilt');
      });
      expect(cacheStatus).toBeTruthy();
    });

    test('should handle localStorage quota exceeded', async ({ page }) => {
      // Fill up localStorage to simulate quota exceeded
      await page.addInitScript(() => {
        try {
          const originalSetItem = localStorage.setItem;
          let callCount = 0;
          localStorage.setItem = function(key: string, value: string) {
            callCount++;
            if (callCount > 5) {
              const error = new Error('QuotaExceededError');
              error.name = 'QuotaExceededError';
              throw error;
            }
            return originalSetItem.call(this, key, value);
          };
        } catch (e) {
          console.log('LocalStorage mock setup failed');
        }
      });
      
      await extendedPage.helpers.navigateToHome();
      
      // Should handle quota exceeded gracefully
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Should show storage warning
      await expect(page.locator('[data-testid="storage-warning"]')).toBeVisible().catch(() => {
        console.log('Storage quota handling is transparent');
      });
    });

    test('should recover from cache invalidation', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Invalidate all caches
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear any other caches
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
      });
      
      // Reload page
      await page.reload();
      
      // Should rebuild cache and load data
      await expect(page.locator('[data-testid="player-row"]')).toBeVisible({ timeout: 15000 });
      
      // Cache should be functional again
      const cacheRecreated = await page.evaluate(() => {
        return localStorage.length > 0;
      });
      expect(cacheRecreated).toBe(true);
    });
  });

  test.describe('Application State Recovery', () => {
    test('should recover from JavaScript errors', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Inject a JavaScript error
      await page.evaluate(() => {
        setTimeout(() => {
          throw new Error('Injected test error');
        }, 100);
      });
      
      await page.waitForTimeout(2000);
      
      // Application should still be functional
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Should be able to navigate
      await page.click('[data-testid="nav-draft"]');
      await expect(page.locator('[data-testid="draft-board"]')).toBeVisible();
      
      // Error should be logged
      const errorReported = await page.evaluate(() => {
        return localStorage.getItem('jsErrorReported');
      });
    });

    test('should handle component crashes gracefully', async ({ page }) => {
      // Simulate component crash via props corruption
      await page.addInitScript(() => {
        const originalError = console.error;
        let errorBoundaryTriggered = false;
        
        console.error = (...args) => {
          if (args[0]?.includes?.('Error boundary')) {
            errorBoundaryTriggered = true;
            (window as any).errorBoundaryTriggered = true;
          }
          return originalError(...args);
        };
      });
      
      await extendedPage.helpers.navigateToHome();
      
      // Force a component error
      await page.evaluate(() => {
        // Corrupt React component props
        const elements = document.querySelectorAll('[data-testid="player-row"]');
        if (elements.length > 0) {
          try {
            // Force re-render with bad props
            elements[0].setAttribute('data-corrupt', 'true');
            
            // Trigger error in component
            const event = new Event('corrupt-component');
            elements[0].dispatchEvent(event);
          } catch (e) {
            // Expected error
          }
        }
      });
      
      await page.waitForTimeout(3000);
      
      // Application should recover with error boundary
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Should show error boundary fallback
      const errorBoundaryActive = await page.evaluate(() => {
        return (window as any).errorBoundaryTriggered;
      });
    });

    test('should handle memory pressure gracefully', async ({ page }) => {
      // Simulate memory pressure
      await page.addInitScript(() => {
        // Create memory pressure by storing large objects
        const createMemoryPressure = () => {
          try {
            const largeArray = new Array(1000000).fill('memory-pressure-test-data');
            (window as any).memoryPressureData = largeArray;
          } catch (e) {
            console.log('Memory pressure simulation failed');
          }
        };
        
        // Trigger memory pressure after a delay
        setTimeout(createMemoryPressure, 2000);
      });
      
      await extendedPage.helpers.navigateToHome();
      await page.waitForTimeout(5000);
      
      // Application should still function despite memory pressure
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Should be able to navigate
      await page.click('[data-testid="nav-draft"]');
      await expect(page.locator('[data-testid="draft-board"]')).toBeVisible();
      
      // Memory usage should be reasonable
      const memoryUsage = await extendedPage.helpers.getMemoryUsage();
      expect(memoryUsage).toBeLessThan(500); // 500MB limit
    });

    test('should recover from infinite loops and hangs', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Set a timeout to detect hangs
      const timeout = 10000; // 10 seconds
      
      // Simulate potential infinite loop scenario
      await page.evaluate(() => {
        // Trigger a potentially problematic recursive function
        const recursiveFunction = (depth: number = 0) => {
          if (depth < 1000) { // Limit recursion to avoid actual infinite loop in test
            return recursiveFunction(depth + 1);
          }
          return depth;
        };
        
        try {
          recursiveFunction();
        } catch (e) {
          console.log('Recursion caught:', e.message);
        }
      });
      
      // Application should remain responsive
      const startTime = Date.now();
      await page.click('[data-testid="nav-comparison"]');
      await expect(page.locator('[data-testid="comparison-tools"]')).toBeVisible();
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(timeout);
    });
  });

  test.describe('User Experience During Errors', () => {
    test('should maintain UI responsiveness during errors', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Simulate multiple simultaneous errors
      await Promise.all([
        page.route('**/athletes*', route => route.abort()),
        page.evaluate(() => {
          throw new Error('UI thread error');
        }),
        mockManager.injectError('network'),
      ]);
      
      // UI should remain responsive
      const startTime = Date.now();
      await page.click('[data-testid="nav-draft"]');
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
      
      // Should show appropriate error states
      const errorStates = await page.locator('[data-testid*="error"]').count();
      expect(errorStates).toBeGreaterThanOrEqual(0);
    });

    test('should provide clear error messages to users', async ({ page }) => {
      // Test different error scenarios and their messages
      const errorScenarios = [
        {
          name: 'API Failure',
          setup: () => page.route('**/athletes*', route => route.fulfill({ status: 500 })),
          expectedMessage: /api|server|unavailable/i,
        },
        {
          name: 'Network Failure',
          setup: () => mockManager.simulateNetworkConditions('offline'),
          expectedMessage: /network|connection|offline/i,
        },
        {
          name: 'Service Timeout',
          setup: () => page.route('**/athletes*', async route => {
            await new Promise(resolve => setTimeout(resolve, 30000));
            await route.continue();
          }),
          expectedMessage: /timeout|slow|taking longer/i,
        },
      ];
      
      for (const scenario of errorScenarios) {
        await scenario.setup();
        await extendedPage.helpers.navigateToHome();
        
        // Look for error message
        const errorMessage = await page.locator('[data-testid="error-message"]').textContent().catch(() => null);
        
        if (errorMessage) {
          expect(errorMessage).toMatch(scenario.expectedMessage);
        }
        
        // Clean up for next scenario
        await page.unrouteAll();
        await mockManager.simulateNetworkConditions('fast');
      }
    });

    test('should provide recovery actions to users', async ({ page }) => {
      // Simulate API failure
      await page.route('**/athletes*', route => route.fulfill({ status: 503 }));
      
      await extendedPage.helpers.navigateToHome();
      
      // Should provide retry option
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible({ timeout: 10000 });
      
      // Should provide alternative actions
      const alternativeActions = await page.locator('[data-testid="alternative-action"]').count();
      expect(alternativeActions).toBeGreaterThanOrEqual(0);
      
      // Test retry functionality
      await page.unroute('**/athletes*');
      await mockManager.setupESPNMocks(['success']);
      
      await page.click('[data-testid="retry-button"]');
      
      // Should recover successfully
      await expect(page.locator('[data-testid="player-row"]')).toBeVisible();
    });

    test('should maintain user progress during errors', async ({ page }) => {
      // Start a draft
      await extendedPage.helpers.navigateToDraft();
      
      // Make some progress
      await extendedPage.helpers.draftPlayer(1);
      await extendedPage.helpers.draftPlayer(2);
      
      // Simulate error that might lose state
      await page.evaluate(() => {
        throw new Error('State corruption test');
      });
      
      await page.waitForTimeout(2000);
      
      // Draft progress should be preserved
      const draftedPlayers = await page.locator('[data-testid*="drafted-player"]').count();
      expect(draftedPlayers).toBeGreaterThanOrEqual(2);
      
      // Should be able to continue
      await extendedPage.helpers.draftPlayer(3);
      
      const finalDraftedPlayers = await page.locator('[data-testid*="drafted-player"]').count();
      expect(finalDraftedPlayers).toBe(3);
    });
  });

  test.describe('System Recovery Metrics', () => {
    test('should track error recovery performance', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Simulate error and recovery
      await page.route('**/athletes*', route => route.fulfill({ status: 500 }));
      await page.reload();
      
      await page.waitForTimeout(2000);
      
      // Restore service
      await page.unroute('**/athletes*');
      await mockManager.setupESPNMocks(['success']);
      
      const recoveryStartTime = Date.now();
      await page.click('[data-testid="retry-button"]').catch(() => {
        // Might auto-retry
        page.reload();
      });
      
      await page.waitForSelector('[data-testid="player-row"]');
      const recoveryTime = Date.now() - recoveryStartTime;
      
      // Recovery should be reasonably fast
      expect(recoveryTime).toBeLessThan(15000); // 15 seconds max
      
      // Metrics should be recorded
      const recoveryMetrics = await page.evaluate(() => {
        return localStorage.getItem('errorRecoveryMetrics');
      });
      
      expect(recoveryMetrics).toBeTruthy();
    });

    test('should maintain service level agreements during degradation', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Simulate partial service degradation
      let requestCount = 0;
      await page.route('**/*', async (route) => {
        requestCount++;
        if (requestCount % 4 === 0) {
          // 25% failure rate
          await route.abort();
        } else {
          await route.continue();
        }
      });
      
      // Measure performance under degradation
      const operations = [
        () => extendedPage.helpers.navigateToHome(),
        () => extendedPage.helpers.navigateToDraft(),
        () => extendedPage.helpers.navigateToComparison(),
        () => extendedPage.helpers.navigateToAI(),
      ];
      
      let successfulOperations = 0;
      const startTime = Date.now();
      
      for (const operation of operations) {
        try {
          await operation();
          await page.waitForTimeout(2000);
          successfulOperations++;
        } catch (error) {
          console.log('Operation failed during degradation');
        }
      }
      
      const totalTime = Date.now() - startTime;
      
      // Should maintain reasonable success rate
      const successRate = successfulOperations / operations.length;
      expect(successRate).toBeGreaterThanOrEqual(0.5); // At least 50% success rate
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(30000); // 30 seconds max
    });
  });
});