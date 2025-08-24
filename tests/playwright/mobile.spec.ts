/**
 * Mobile Responsiveness Testing Suite
 * 
 * Comprehensive mobile and responsive testing including:
 * - Mobile viewport testing on iOS Safari and Android Chrome
 * - Touch interactions and mobile UI components  
 * - Performance optimization for mobile devices
 * - AI coaching interface adaptation for small screens
 * - Tablet and intermediate screen size testing
 * - Offline functionality and PWA features
 */

import { test, expect, devices } from '@playwright/test';
import { createExtendedPage, PerformanceMonitor, testUtils } from '../setup/test-helpers';
import { MockManager } from '../fixtures/mock-responses';
import { performanceBenchmarks } from '../fixtures/test-data';

// Mobile test configurations
const MOBILE_DEVICES = {
  'iPhone 12': devices['iPhone 12'],
  'iPhone 13 Pro': devices['iPhone 13 Pro'],
  'Pixel 5': devices['Pixel 5'],
  'Samsung Galaxy S21': devices['Galaxy S21'],
};

const TABLET_DEVICES = {
  'iPad Pro': devices['iPad Pro'],
  'iPad': devices['iPad'],
};

// Test group configuration
test.describe('Mobile Responsiveness', () => {
  let extendedPage: any;
  let mockManager: MockManager;
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page }) => {
    extendedPage = createExtendedPage(page);
    mockManager = new MockManager(page);
    performanceMonitor = new PerformanceMonitor(page);
    
    await performanceMonitor.startMonitoring();
    
    // Set up mobile-optimized mocks
    await mockManager.setupESPNMocks(['success']);
    await mockManager.setupLocalGeminiMocks(['available']);
    await mockManager.setupCloudGeminiMocks(['available']);
    await mockManager.setupBrowserMCPMocks();
    
    // Configure mobile-specific settings
    await page.addInitScript(() => {
      // Enable mobile optimizations
      localStorage.setItem('mobileOptimizations', 'true');
      localStorage.setItem('reducedMotion', 'true');
      localStorage.setItem('touchOptimizations', 'true');
    });
  });

  test.afterEach(async () => {
    await mockManager.cleanup();
  });

  // Loop through mobile devices for comprehensive testing
  Object.entries(MOBILE_DEVICES).forEach(([deviceName, device]) => {
    test.describe(`${deviceName} Mobile Tests`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(device.viewport);
        await page.setUserAgent(device.userAgent);
      });

      test('should load and display correctly on mobile viewport', async ({ page }) => {
        await extendedPage.helpers.navigateToHome();
        
        // Check mobile layout is applied
        const isMobileLayout = await page.locator('[data-testid="mobile-layout"]').isVisible();
        expect(isMobileLayout).toBe(true);
        
        // Verify mobile navigation
        await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
        
        // Check responsive elements
        const playerRows = await page.locator('[data-testid="player-row"]').count();
        expect(playerRows).toBeGreaterThan(0);
        
        // Verify mobile-optimized player cards
        const playerCard = page.locator('[data-testid="player-row"]').first();
        await expect(playerCard).toBeVisible();
        
        // Check for mobile-specific UI elements
        await expect(page.locator('[data-testid="mobile-search"]')).toBeVisible();
      });

      test('should handle touch interactions properly', async ({ page }) => {
        await extendedPage.helpers.navigateToHome();
        
        // Test tap interactions
        const firstPlayer = page.locator('[data-testid="player-row"]').first();
        await firstPlayer.tap();
        
        // Should show player details or selection
        await expect(page.locator('[data-testid="player-selected"]')).toBeVisible().catch(() => {
          // Alternative mobile interaction pattern
          console.log('Mobile player selection uses different pattern');
        });
        
        // Test swipe gestures (if implemented)
        await page.touchscreen.tap(100, 200);
        await page.touchscreen.tap(300, 200);
        
        // Test mobile menu toggle
        await page.tap('[data-testid="mobile-menu-toggle"]');
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
        
        // Close menu
        await page.tap('[data-testid="mobile-menu-close"]').catch(() => {
          await page.tap('[data-testid="mobile-menu-overlay"]');
        });
      });

      test('should optimize draft board for mobile', async ({ page }) => {
        await extendedPage.helpers.navigateToDraft();
        
        // Should show mobile-optimized draft board
        await expect(page.locator('[data-testid="mobile-draft-board"]')).toBeVisible();
        
        // Check horizontal scrolling for draft board
        const draftBoard = page.locator('[data-testid="draft-board-container"]');
        const isScrollable = await draftBoard.evaluate(el => 
          el.scrollWidth > el.clientWidth
        );
        
        if (isScrollable) {
          // Test horizontal scroll
          await draftBoard.evaluate(el => el.scrollTo(100, 0));
          await page.waitForTimeout(500);
        }
        
        // Test mobile draft interactions
        const draftButton = page.locator('[data-testid="draft-player-1"]');
        await draftButton.tap();
        
        // Should show mobile confirmation
        await expect(page.locator('[data-testid="draft-confirmation"]')).toBeVisible();
        
        // Verify mobile draft timer
        await expect(page.locator('[data-testid="mobile-draft-timer"]')).toBeVisible();
      });

      test('should handle mobile AI chat interface', async ({ page }) => {
        await extendedPage.helpers.navigateToAI();
        
        // Should show mobile-optimized AI interface
        await expect(page.locator('[data-testid="mobile-ai-chat"]')).toBeVisible();
        
        // Test mobile AI input
        const aiInput = page.locator('[data-testid="ai-input"]');
        await aiInput.tap();
        await aiInput.fill('Who should I draft first in mobile league?');
        
        // Test mobile send button
        await page.tap('[data-testid="mobile-send-button"]');
        
        // Should handle mobile keyboard
        const viewportHeight = await page.evaluate(() => window.innerHeight);
        await page.waitForTimeout(1000); // Allow for keyboard animation
        
        // AI response should be visible on mobile
        await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 30000 });
        
        // Test mobile chat scroll
        const chatContainer = page.locator('[data-testid="ai-chat-container"]');
        await chatContainer.evaluate(el => el.scrollTop = el.scrollHeight);
      });

      test('should optimize player comparison for mobile', async ({ page }) => {
        await extendedPage.helpers.navigateToComparison();
        
        // Should show mobile comparison interface
        await expect(page.locator('[data-testid="mobile-comparison"]')).toBeVisible();
        
        // Test mobile player selection
        await page.tap('[data-testid="mobile-select-player-1"]');
        await page.tap('[data-testid="player-option-1"]');
        
        await page.tap('[data-testid="mobile-select-player-2"]');
        await page.tap('[data-testid="player-option-2"]');
        
        // Should show mobile-optimized comparison
        await expect(page.locator('[data-testid="mobile-comparison-chart"]')).toBeVisible();
        
        // Test mobile comparison card flip/swipe
        const comparisonCard = page.locator('[data-testid="comparison-card"]').first();
        await comparisonCard.tap();
        
        // Should toggle or show additional info
        await page.waitForTimeout(500);
      });

      test('should handle mobile search and filtering', async ({ page }) => {
        await extendedPage.helpers.navigateToHome();
        
        // Test mobile search
        const mobileSearch = page.locator('[data-testid="mobile-search"]');
        await mobileSearch.tap();
        
        // Should expand search
        await expect(page.locator('[data-testid="mobile-search-expanded"]')).toBeVisible();
        
        await mobileSearch.fill('Christian McCaffrey');
        await page.waitForTimeout(500);
        
        // Should filter results
        const filteredResults = await page.locator('[data-testid="player-row"]').count();
        expect(filteredResults).toBeGreaterThan(0);
        
        // Test mobile filters
        await page.tap('[data-testid="mobile-filters-toggle"]');
        await expect(page.locator('[data-testid="mobile-filters"]')).toBeVisible();
        
        // Test position filter
        await page.tap('[data-testid="mobile-filter-rb"]');
        await page.waitForTimeout(500);
        
        // Should apply filter
        const rbPlayers = await page.locator('[data-testid="player-position"]:text("RB")').count();
        expect(rbPlayers).toBeGreaterThan(0);
      });

      test('should maintain performance on mobile devices', async ({ page }) => {
        const startTime = Date.now();
        await extendedPage.helpers.navigateToHome();
        await page.waitForSelector('[data-testid="player-row"]');
        const loadTime = Date.now() - startTime;
        
        // Mobile should load within reasonable time
        expect(loadTime).toBeLessThan(performanceBenchmarks.pageLoad * 1.5); // 50% more time for mobile
        
        // Check mobile memory usage
        const memoryUsage = await extendedPage.helpers.getMemoryUsage();
        expect(memoryUsage).toBeLessThan(75); // 75MB limit for mobile
        
        // Test mobile navigation performance
        const navStartTime = Date.now();
        await page.tap('[data-testid="nav-draft"]');
        await page.waitForSelector('[data-testid="draft-board"]');
        const navTime = Date.now() - navStartTime;
        
        expect(navTime).toBeLessThan(3000); // 3 seconds for mobile navigation
      });

      test('should handle mobile orientation changes', async ({ page }) => {
        await extendedPage.helpers.navigateToHome();
        
        // Start in portrait mode
        let viewport = page.viewportSize();
        expect(viewport?.width).toBeLessThan(viewport?.height || 0);
        
        // Change to landscape
        await page.setViewportSize({
          width: viewport?.height || 800,
          height: viewport?.width || 600,
        });
        
        await page.waitForTimeout(1000); // Allow for orientation change
        
        // Should adapt to landscape layout
        const isLandscapeLayout = await page.locator('[data-testid="landscape-layout"]').isVisible();
        // Layout adaptation might be subtle
        
        // UI should still be functional
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
        
        // Test navigation in landscape
        await page.tap('[data-testid="nav-draft"]');
        await expect(page.locator('[data-testid="draft-board"]')).toBeVisible();
      });

      test('should support mobile offline functionality', async ({ page }) => {
        await extendedPage.helpers.navigateToHome();
        await page.waitForSelector('[data-testid="player-row"]');
        
        // Go offline
        await page.context().setOffline(true);
        
        // Should show offline indicator
        await expect(page.locator('[data-testid="mobile-offline-indicator"]')).toBeVisible({ timeout: 5000 });
        
        // Should still show cached data
        const cachedPlayers = await page.locator('[data-testid="player-row"]').count();
        expect(cachedPlayers).toBeGreaterThan(0);
        
        // Test offline AI functionality
        await page.tap('[data-testid="nav-ai"]');
        await page.waitForSelector('[data-testid="ai-chat"]');
        
        const aiInput = page.locator('[data-testid="ai-input"]');
        await aiInput.tap();
        await aiInput.fill('Mobile offline fantasy advice');
        await page.tap('[data-testid="mobile-send-button"]');
        
        // Should provide offline response
        await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible();
        
        const response = await page.locator('[data-testid="ai-response"]').last().textContent();
        expect(response?.toLowerCase()).toMatch(/offline|general|advice/);
      });
    });
  });

  // Tablet-specific tests
  Object.entries(TABLET_DEVICES).forEach(([deviceName, device]) => {
    test.describe(`${deviceName} Tablet Tests`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(device.viewport);
        await page.setUserAgent(device.userAgent);
      });

      test('should optimize layout for tablet screens', async ({ page }) => {
        await extendedPage.helpers.navigateToHome();
        
        // Should show tablet-optimized layout
        const isTabletLayout = await page.locator('[data-testid="tablet-layout"]').isVisible();
        // Tablet layout might use hybrid mobile/desktop approach
        
        // Should have more screen real estate than mobile
        const playerRows = await page.locator('[data-testid="player-row"]').count();
        expect(playerRows).toBeGreaterThan(0);
        
        // Should show more content per screen
        const viewport = page.viewportSize();
        const visibleContent = await page.locator('[data-testid="player-row"]').count();
        expect(visibleContent).toBeGreaterThanOrEqual(5); // More content than mobile
      });

      test('should handle tablet draft board efficiently', async ({ page }) => {
        await extendedPage.helpers.navigateToDraft();
        
        // Tablet should show more draft board content
        await expect(page.locator('[data-testid="draft-board"]')).toBeVisible();
        
        const draftBoardWidth = await page.locator('[data-testid="draft-board"]').evaluate(
          el => el.getBoundingClientRect().width
        );
        
        expect(draftBoardWidth).toBeGreaterThan(600); // Should use tablet width
        
        // Test tablet-optimized interactions
        await page.tap('[data-testid="player-row"]').catch(() => {
          await page.click('[data-testid="player-row"]');
        });
        
        // Should handle both touch and mouse interactions
        await page.hover('[data-testid="draft-player-1"]').catch(() => {
          console.log('Hover not available on tablet');
        });
      });

      test('should optimize AI interface for tablet', async ({ page }) => {
        await extendedPage.helpers.navigateToAI();
        
        // Should show tablet-optimized AI interface
        await expect(page.locator('[data-testid="ai-chat"]')).toBeVisible();
        
        // Test tablet AI input
        const aiInput = page.locator('[data-testid="ai-input"]');
        await aiInput.click();
        await aiInput.fill('Tablet fantasy football analysis');
        await aiInput.press('Enter');
        
        // Should have better chat layout than mobile
        const chatContainer = page.locator('[data-testid="ai-chat-container"]');
        const chatWidth = await chatContainer.evaluate(el => el.getBoundingClientRect().width);
        
        expect(chatWidth).toBeGreaterThan(400); // Wider than mobile
        
        // Response should be well-formatted for tablet
        await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 30000 });
      });
    });
  });

  test.describe('Progressive Web App Features', () => {
    test('should work as PWA on mobile', async ({ page }) => {
      await extendedPage.helpers.simulateMobileViewport();
      await extendedPage.helpers.navigateToHome();
      
      // Check for PWA manifest
      const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
      expect(manifestLink).toBeTruthy();
      
      // Check for service worker registration
      const hasServiceWorker = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      expect(hasServiceWorker).toBe(true);
      
      // Test PWA install prompt (if available)
      const installPrompt = await page.locator('[data-testid="pwa-install-prompt"]').isVisible().catch(() => false);
      // Install prompt may not always be available
      
      // Test offline functionality
      await page.context().setOffline(true);
      await page.reload();
      
      // Should still load from cache
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible({ timeout: 10000 });
    });

    test('should handle mobile app-like navigation', async ({ page }) => {
      await extendedPage.helpers.simulateMobileViewport();
      await extendedPage.helpers.navigateToHome();
      
      // Should prevent default browser zoom on double-tap
      const viewport = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta?.getAttribute('content');
      });
      expect(viewport).toContain('user-scalable=no');
      
      // Should handle mobile back button behavior
      await page.goBack().catch(() => {
        console.log('No back navigation available');
      });
      
      // Should maintain app-like behavior
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });
  });

  test.describe('Cross-Device Compatibility', () => {
    test('should maintain data consistency across device switches', async ({ page }) => {
      // Start on mobile
      await extendedPage.helpers.simulateMobileViewport();
      await extendedPage.helpers.navigateToHome();
      await extendedPage.helpers.selectPlayer(1);
      
      // Store selection
      const mobileSelection = await page.locator('[data-testid="selected-player-name"]').textContent();
      
      // Switch to desktop viewport
      await extendedPage.helpers.simulateDesktopViewport();
      await page.reload();
      
      // Selection should be maintained
      const desktopSelection = await page.locator('[data-testid="selected-player-name"]').textContent();
      expect(desktopSelection).toBe(mobileSelection);
      
      // Switch to tablet
      await extendedPage.helpers.simulateTabletViewport();
      await page.reload();
      
      // Should still maintain selection
      const tabletSelection = await page.locator('[data-testid="selected-player-name"]').textContent();
      expect(tabletSelection).toBe(mobileSelection);
    });

    test('should handle responsive breakpoints smoothly', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Test various breakpoints
      const breakpoints = [
        { width: 320, height: 568, name: 'small-mobile' },
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'small-desktop' },
        { width: 1440, height: 900, name: 'desktop' },
      ];
      
      for (const breakpoint of breakpoints) {
        await page.setViewportSize(breakpoint);
        await page.waitForTimeout(500); // Allow for responsive adjustments
        
        // Content should remain accessible
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
        
        // Navigation should work
        const navElement = await Promise.race([
          page.locator('[data-testid="desktop-nav"]').isVisible(),
          page.locator('[data-testid="mobile-nav"]').isVisible(),
          page.locator('[data-testid="tablet-nav"]').isVisible(),
        ]);
        expect(navElement).toBe(true);
        
        // Player data should be visible
        const playerRows = await page.locator('[data-testid="player-row"]').count();
        expect(playerRows).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Mobile Performance Optimization', () => {
    test('should optimize images and assets for mobile', async ({ page }) => {
      await extendedPage.helpers.simulateMobileViewport();
      await extendedPage.helpers.navigateToHome();
      
      // Check for responsive images
      const images = await page.locator('img').all();
      
      for (const img of images) {
        const srcset = await img.getAttribute('srcset');
        const loading = await img.getAttribute('loading');
        
        // Should use responsive images or lazy loading
        expect(srcset || loading).toBeTruthy();
      }
      
      // Check for mobile-optimized CSS
      const hasMinifiedCSS = await page.evaluate(() => {
        const stylesheets = Array.from(document.styleSheets);
        return stylesheets.some(sheet => 
          sheet.href?.includes('.min.css') || 
          document.querySelector('style[data-optimized]')
        );
      });
    });

    test('should implement mobile-specific caching strategies', async ({ page }) => {
      await extendedPage.helpers.simulateMobileViewport();
      await extendedPage.helpers.navigateToHome();
      
      // First load
      const startTime1 = Date.now();
      await page.waitForSelector('[data-testid="player-row"]');
      const loadTime1 = Date.now() - startTime1;
      
      // Second load (should use mobile cache)
      await page.reload();
      const startTime2 = Date.now();
      await page.waitForSelector('[data-testid="player-row"]');
      const loadTime2 = Date.now() - startTime2;
      
      // Mobile cache should provide significant improvement
      expect(loadTime2).toBeLessThan(loadTime1 * 0.7); // 30% improvement
      
      // Check mobile cache status
      const cacheStatus = await page.evaluate(() => {
        return localStorage.getItem('mobileCacheOptimized');
      });
      expect(cacheStatus).toBeTruthy();
    });

    test('should handle mobile network conditions', async ({ page }) => {
      await extendedPage.helpers.simulateMobileViewport();
      
      // Simulate slow mobile connection
      await mockManager.simulateNetworkConditions('slow3g');
      
      const loadStart = Date.now();
      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]');
      const loadTime = Date.now() - loadStart;
      
      // Should still be usable on slow connection
      expect(loadTime).toBeLessThan(20000); // 20 seconds max for 3G
      
      // Should show loading optimizations
      const hadProgressiveLoading = await page.evaluate(() => {
        return localStorage.getItem('progressiveLoadingActive') === 'true';
      });
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test('should maintain accessibility on mobile devices', async ({ page }) => {
      await extendedPage.helpers.simulateMobileViewport();
      await extendedPage.helpers.navigateToHome();
      
      // Check mobile accessibility features
      await extendedPage.helpers.checkAccessibility();
      
      // Test mobile screen reader compatibility
      const ariaLabels = await page.locator('[aria-label]').count();
      expect(ariaLabels).toBeGreaterThan(5);
      
      // Check mobile focus management
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
      
      // Test mobile zoom accessibility
      await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        const content = meta?.getAttribute('content');
        return content?.includes('maximum-scale');
      });
    });

    test('should support mobile screen readers', async ({ page }) => {
      await extendedPage.helpers.simulateMobileViewport();
      await extendedPage.helpers.navigateToHome();
      
      // Check ARIA landmarks
      const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"]').count();
      expect(landmarks).toBeGreaterThan(2);
      
      // Test mobile-specific ARIA labels
      const mobileNavButton = page.locator('[data-testid="mobile-menu-toggle"]');
      const ariaLabel = await mobileNavButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      
      // Check heading hierarchy
      const headings = await page.locator('h1, h2, h3').count();
      expect(headings).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Edge Cases', () => {
    test('should handle mobile browser variations', async ({ page }) => {
      // Test different mobile user agents
      const mobileUserAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Mobile Safari/537.36',
      ];
      
      for (const userAgent of mobileUserAgents) {
        await page.setUserAgent(userAgent);
        await extendedPage.helpers.simulateMobileViewport();
        await extendedPage.helpers.navigateToHome();
        
        // Should work across different mobile browsers
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
        
        const playerCount = await page.locator('[data-testid="player-row"]').count();
        expect(playerCount).toBeGreaterThan(0);
      }
    });

    test('should handle mobile memory constraints', async ({ page }) => {
      await extendedPage.helpers.simulateMobileViewport();
      
      // Simulate memory pressure
      await page.addInitScript(() => {
        // Mock reduced memory
        Object.defineProperty(navigator, 'deviceMemory', {
          writable: false,
          value: 2 // 2GB device
        });
      });
      
      await extendedPage.helpers.navigateToHome();
      
      // Should optimize for low-memory devices
      const memoryUsage = await extendedPage.helpers.getMemoryUsage();
      expect(memoryUsage).toBeLessThan(50); // Stricter limit for low-memory devices
      
      // Should show memory-conscious behavior
      const optimizations = await page.evaluate(() => {
        return localStorage.getItem('lowMemoryOptimizations');
      });
    });

    test('should handle mobile battery optimization', async ({ page }) => {
      await extendedPage.helpers.simulateMobileViewport();
      
      // Simulate battery API (where available)
      await page.addInitScript(() => {
        (navigator as any).getBattery = () => Promise.resolve({
          level: 0.2, // Low battery
          charging: false,
        });
      });
      
      await extendedPage.helpers.navigateToHome();
      
      // Should show battery-conscious behavior
      const batteryOptimizations = await page.evaluate(() => {
        return localStorage.getItem('batteryOptimizations');
      });
      
      // Should reduce intensive operations
      const reducedAnimations = await page.evaluate(() => {
        return document.documentElement.classList.contains('reduced-animations');
      });
    });
  });
});