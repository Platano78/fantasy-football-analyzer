/**
 * Test Helper Utilities for Fantasy Football Analyzer
 * 
 * Common utilities, fixtures, and helper functions used across all tests
 */

import { Page, Locator, expect } from '@playwright/test';
import { Player, Team, Position } from '../../src/types';
import { MockManager } from '../fixtures/mock-responses';

// Extended Page interface with custom helpers
export interface ExtendedPage extends Page {
  helpers: TestHelpers;
}

/**
 * Test Helper Class with reusable methods
 */
export class TestHelpers {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateToHome(): Promise<void> {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  async navigateToDraft(): Promise<void> {
    await this.page.goto('/draft');
    await this.waitForPageLoad();
    await this.waitForDraftBoard();
  }

  async navigateToComparison(): Promise<void> {
    await this.page.goto('/comparison');
    await this.waitForPageLoad();
  }

  async navigateToLiveData(): Promise<void> {
    await this.page.goto('/live-data');
    await this.waitForPageLoad();
  }

  async navigateToAI(): Promise<void> {
    await this.page.goto('/ai');
    await this.waitForPageLoad();
    await this.waitForAIInterface();
  }

  // Wait helpers
  async waitForPageLoad(timeout = 10000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout });
    await this.page.waitForLoadState('networkidle', { timeout });
    
    // Wait for main content to be visible
    await this.page.waitForSelector('[data-testid="main-content"]', { timeout }).catch(() => {
      // Fallback if no main content marker
      console.log('No main-content marker found, proceeding...');
    });
  }

  async waitForDraftBoard(timeout = 15000): Promise<void> {
    await this.page.waitForSelector('[data-testid="draft-board"]', { timeout });
    
    // Wait for players to load
    await this.page.waitForSelector('[data-testid="player-row"]', { timeout });
    
    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout }).catch(() => {});
  }

  async waitForAIInterface(timeout = 10000): Promise<void> {
    await this.page.waitForSelector('[data-testid="ai-chat"]', { timeout });
    await this.page.waitForSelector('[data-testid="ai-input"]', { timeout });
  }

  // Player interaction helpers
  async searchForPlayer(playerName: string): Promise<void> {
    const searchInput = this.page.locator('[data-testid="player-search"]');
    await searchInput.fill(playerName);
    await this.page.waitForTimeout(300); // Wait for debounced search
  }

  async selectPlayer(playerId: string | number): Promise<void> {
    const playerRow = this.page.locator(`[data-testid="player-${playerId}"]`);
    await playerRow.click();
  }

  async draftPlayer(playerId: string | number): Promise<void> {
    const draftButton = this.page.locator(`[data-testid="draft-player-${playerId}"]`);
    await draftButton.click();
    
    // Wait for draft confirmation
    await this.page.waitForSelector('[data-testid="player-drafted"]', { timeout: 5000 });
  }

  async openPlayerComparison(player1Id: string | number, player2Id: string | number): Promise<void> {
    // Select first player
    await this.selectPlayer(player1Id);
    
    // Open comparison modal
    await this.page.click('[data-testid="compare-button"]');
    
    // Select second player in modal
    await this.page.click(`[data-testid="compare-player-${player2Id}"]`);
    
    // Wait for comparison to load
    await this.page.waitForSelector('[data-testid="comparison-chart"]');
  }

  // AI interaction helpers
  async sendAIMessage(message: string): Promise<string> {
    const aiInput = this.page.locator('[data-testid="ai-input"]');
    await aiInput.fill(message);
    await aiInput.press('Enter');
    
    // Wait for AI response
    await this.page.waitForSelector('[data-testid="ai-response"]:last-child', { timeout: 30000 });
    
    // Get the response text
    const response = await this.page.locator('[data-testid="ai-response"]:last-child').textContent();
    return response || '';
  }

  async waitForAIResponse(timeout = 30000): Promise<string> {
    await this.page.waitForSelector('[data-testid="ai-thinking"]', { state: 'visible' });
    await this.page.waitForSelector('[data-testid="ai-thinking"]', { state: 'hidden', timeout });
    
    const response = await this.page.locator('[data-testid="ai-response"]:last-child').textContent();
    return response || '';
  }

  // Data validation helpers
  async validatePlayerData(playerId: string | number, expectedData: Partial<Player>): Promise<void> {
    const playerRow = this.page.locator(`[data-testid="player-${playerId}"]`);
    
    if (expectedData.name) {
      await expect(playerRow.locator('[data-testid="player-name"]')).toContainText(expectedData.name);
    }
    
    if (expectedData.position) {
      await expect(playerRow.locator('[data-testid="player-position"]')).toContainText(expectedData.position);
    }
    
    if (expectedData.team) {
      await expect(playerRow.locator('[data-testid="player-team"]')).toContainText(expectedData.team);
    }
    
    if (expectedData.adp) {
      await expect(playerRow.locator('[data-testid="player-adp"]')).toContainText(expectedData.adp.toString());
    }
  }

  async validateDraftState(round: number, pick: number): Promise<void> {
    await expect(this.page.locator('[data-testid="current-round"]')).toContainText(round.toString());
    await expect(this.page.locator('[data-testid="current-pick"]')).toContainText(pick.toString());
  }

  async validateAPIResponse(endpoint: string, expectedStatus = 200): Promise<any> {
    const responsePromise = this.page.waitForResponse(response => 
      response.url().includes(endpoint) && response.status() === expectedStatus
    );
    
    const response = await responsePromise;
    return await response.json().catch(() => null);
  }

  // Performance helpers
  async measurePageLoad(): Promise<number> {
    const startTime = Date.now();
    await this.waitForPageLoad();
    return Date.now() - startTime;
  }

  async measureRenderTime(selector: string): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForSelector(selector);
    return Date.now() - startTime;
  }

  async getMemoryUsage(): Promise<number> {
    const metrics = await this.page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    return metrics / (1024 * 1024); // Convert to MB
  }

  async getNetworkRequests(): Promise<number> {
    const entries = await this.page.evaluate(() => 
      performance.getEntriesByType('navigation').length + 
      performance.getEntriesByType('resource').length
    );
    return entries;
  }

  // Error helpers
  async expectNoConsoleErrors(): Promise<void> {
    let consoleErrors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await this.page.waitForTimeout(1000); // Give time for any errors to appear
    expect(consoleErrors).toEqual([]);
  }

  async expectNoNetworkErrors(): Promise<void> {
    let networkErrors: string[] = [];
    
    this.page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    await this.page.waitForTimeout(2000); // Give time for network requests
    expect(networkErrors).toEqual([]);
  }

  // Mobile helpers
  async simulateMobileViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async simulateTabletViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async simulateDesktopViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  // Accessibility helpers
  async checkAccessibility(): Promise<void> {
    // Basic accessibility checks
    const missingAltImages = await this.page.locator('img:not([alt])').count();
    expect(missingAltImages).toBe(0);
    
    // Check for proper headings hierarchy
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for form labels
    const unlabeledInputs = await this.page.locator('input:not([aria-label]):not([aria-labelledby])').count();
    expect(unlabeledInputs).toBe(0);
  }

  async checkKeyboardNavigation(): Promise<void> {
    // Tab through interactive elements
    const interactiveElements = await this.page.locator('button, input, select, textarea, a[href]').all();
    
    for (let i = 0; i < Math.min(interactiveElements.length, 5); i++) {
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(100);
    }
  }

  // Visual helpers
  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  async compareScreenshot(name: string, threshold = 0.3): Promise<void> {
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      threshold,
      mode: 'only-on-failure',
    });
  }

  // Data helpers
  async injectMockData(data: any): Promise<void> {
    await this.page.addInitScript((mockData) => {
      (window as any).__TEST_MOCK_DATA__ = mockData;
    }, data);
  }

  async enableMockMode(): Promise<void> {
    await this.page.addInitScript(() => {
      localStorage.setItem('VITE_USE_MOCK_DATA', 'true');
    });
  }

  async disableMockMode(): Promise<void> {
    await this.page.addInitScript(() => {
      localStorage.removeItem('VITE_USE_MOCK_DATA');
    });
  }

  // Storage helpers
  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
  }

  async setLocalStorage(key: string, value: string): Promise<void> {
    await this.page.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: key, v: value });
  }

  async getLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  // Advanced helpers
  async waitForCondition(condition: () => Promise<boolean>, timeout = 10000): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await this.page.waitForTimeout(100);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  async retryOnFailure<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(1000 * (i + 1)); // Exponential backoff
      }
    }
    throw new Error('Max retries exceeded');
  }
}

// Page extension factory
export function createExtendedPage(page: Page): ExtendedPage {
  const extendedPage = page as ExtendedPage;
  extendedPage.helpers = new TestHelpers(page);
  return extendedPage;
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: any[] = [];
  
  constructor(private page: Page) {}

  async startMonitoring(): Promise<void> {
    await this.page.addInitScript(() => {
      (window as any).__performanceMetrics = [];
      
      // Monitor page load
      window.addEventListener('load', () => {
        (window as any).__performanceMetrics.push({
          type: 'pageLoad',
          timestamp: Date.now(),
          loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        });
      });
      
      // Monitor network requests
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const start = Date.now();
        try {
          const response = await originalFetch(...args);
          (window as any).__performanceMetrics.push({
            type: 'networkRequest',
            timestamp: Date.now(),
            duration: Date.now() - start,
            url: args[0],
            status: response.status,
          });
          return response;
        } catch (error) {
          (window as any).__performanceMetrics.push({
            type: 'networkError',
            timestamp: Date.now(),
            duration: Date.now() - start,
            url: args[0],
            error: error.message,
          });
          throw error;
        }
      };
    });
  }

  async collectMetrics(): Promise<any[]> {
    const pageMetrics = await this.page.evaluate(() => (window as any).__performanceMetrics || []);
    this.metrics.push(...pageMetrics);
    return this.metrics;
  }

  async generateReport(): Promise<any> {
    const allMetrics = await this.collectMetrics();
    
    return {
      totalRequests: allMetrics.filter(m => m.type === 'networkRequest').length,
      averageLoadTime: this.calculateAverage(allMetrics.filter(m => m.type === 'pageLoad').map(m => m.loadTime)),
      averageRequestTime: this.calculateAverage(allMetrics.filter(m => m.type === 'networkRequest').map(m => m.duration)),
      errorCount: allMetrics.filter(m => m.type === 'networkError').length,
      recommendations: this.generateRecommendations(allMetrics),
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private generateRecommendations(metrics: any[]): string[] {
    const recommendations: string[] = [];
    const avgLoadTime = this.calculateAverage(metrics.filter(m => m.type === 'pageLoad').map(m => m.loadTime));
    
    if (avgLoadTime > 3000) {
      recommendations.push('Page load time exceeds 3 seconds. Consider optimizing bundle size.');
    }
    
    const errorRate = metrics.filter(m => m.type === 'networkError').length / metrics.length;
    if (errorRate > 0.1) {
      recommendations.push('High network error rate detected. Check API reliability.');
    }
    
    return recommendations;
  }
}

// Export utilities
export const testUtils = {
  createExtendedPage,
  TestHelpers,
  PerformanceMonitor,
  
  // Common selectors
  selectors: {
    playerRow: '[data-testid="player-row"]',
    draftBoard: '[data-testid="draft-board"]',
    aiChat: '[data-testid="ai-chat"]',
    playerSearch: '[data-testid="player-search"]',
    loadingSpinner: '[data-testid="loading"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',
  },
  
  // Common timeouts
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    aiResponse: 30000,
  },
};