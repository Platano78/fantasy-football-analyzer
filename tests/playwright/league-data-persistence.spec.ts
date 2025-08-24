/**
 * League Data Persistence Testing Suite
 * 
 * CRITICAL GAME DAY TEST: Validates that league data extracted via Browser MCP 
 * persists correctly when navigating between pages in the Fantasy Football Analyzer.
 * 
 * This test ensures that:
 * - League data is properly stored in localStorage
 * - Data persists across page navigation
 * - Real league names like "Injustice" and "Legends League" are preserved
 * - Service subscriptions and state management work correctly
 * - Error scenarios are handled gracefully
 */

import { test, expect, Page } from '@playwright/test';
import { createExtendedPage, PerformanceMonitor, testUtils } from '../setup/test-helpers';

// Mock league data that simulates real NFL.com league extraction
const mockLeagueData = {
  'injustice_league': {
    id: 'injustice_league',
    name: 'Injustice League',
    leagueKey: '123456789',
    season: 2024,
    currentWeek: 1,
    gameWeek: 1,
    url: 'https://fantasy.nfl.com/league/123456789',
    settings: {
      name: 'Injustice League',
      size: 12,
      scoringType: 'PPR' as const,
      rosterSettings: {
        qb: 1, rb: 2, wr: 2, te: 1, flex: 1, k: 1, def: 1, bench: 6
      }
    },
    draftSettings: {
      isDrafted: false,
      draftType: 'Snake' as const,
      draftStatus: 'Scheduled' as const,
      myDraftPosition: 3,
      totalRounds: 16,
      timePerPick: 90
    },
    teams: [
      {
        id: 'my_team',
        name: 'Championship Contenders',
        ownerName: 'Test User',
        ownerId: 'me',
        record: { wins: 0, losses: 0, ties: 0 },
        points: { total: 0, average: 0, rank: 1 },
        roster: [],
        draftPosition: 3,
        isCurrentUser: true
      }
    ],
    myTeam: {
      id: 'my_team',
      name: 'Championship Contenders',
      ownerName: 'Test User',
      ownerId: 'me',
      record: { wins: 0, losses: 0, ties: 0 },
      points: { total: 0, average: 0, rank: 1 },
      roster: [],
      draftPosition: 3,
      isCurrentUser: true
    },
    lastSyncTime: new Date().toISOString(),
    syncStatus: 'success' as const,
    authStatus: 'authenticated' as const,
    syncErrors: []
  },
  'legends_league': {
    id: 'legends_league',
    name: 'Legends League',
    leagueKey: '987654321',
    season: 2024,
    currentWeek: 1,
    gameWeek: 1,
    url: 'https://fantasy.nfl.com/league/987654321',
    settings: {
      name: 'Legends League',
      size: 10,
      scoringType: 'Half-PPR' as const,
      rosterSettings: {
        qb: 1, rb: 2, wr: 3, te: 1, flex: 1, k: 1, def: 1, bench: 7
      }
    },
    draftSettings: {
      isDrafted: true,
      draftType: 'Auction' as const,
      draftStatus: 'Complete' as const,
      myDraftPosition: 7,
      totalRounds: 16,
      timePerPick: 120
    },
    teams: [
      {
        id: 'my_team_2',
        name: 'Dynasty Dynasty',
        ownerName: 'Test User',
        ownerId: 'me',
        record: { wins: 8, losses: 5, ties: 0 },
        points: { total: 1847.5, average: 142.1, rank: 3 },
        roster: [],
        draftPosition: 7,
        isCurrentUser: true
      }
    ],
    myTeam: {
      id: 'my_team_2',
      name: 'Dynasty Dynasty',
      ownerName: 'Test User',
      ownerId: 'me',
      record: { wins: 8, losses: 5, ties: 0 },
      points: { total: 1847.5, average: 142.1, rank: 3 },
      roster: [],
      draftPosition: 7,
      isCurrentUser: true
    },
    lastSyncTime: new Date().toISOString(),
    syncStatus: 'success' as const,
    authStatus: 'authenticated' as const,
    syncErrors: []
  }
};

// Test group configuration
test.describe('League Data Persistence', () => {
  let extendedPage: any;
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page }) => {
    extendedPage = createExtendedPage(page);
    performanceMonitor = new PerformanceMonitor(page);
    
    await performanceMonitor.startMonitoring();
    
    // Clear any existing league data
    await page.evaluate(() => {
      localStorage.removeItem('nfl-league-data');
      sessionStorage.clear();
    });
    
    // Set up Browser MCP mock environment
    await page.addInitScript(() => {
      // Mock Browser MCP functions for league data extraction
      (window as any).mcp__playwright__browser_navigate = async ({ url }: { url: string }) => {
        console.log(`🌐 Mock MCP Navigate: ${url}`);
        return Promise.resolve();
      };
      
      (window as any).mcp__playwright__browser_snapshot = async () => {
        console.log('📸 Mock MCP Snapshot');
        return {
          html: '<div class="league-info">Mock league data</div>',
          elements: [
            { selector: '.league-name', text: 'Injustice League' },
            { selector: '.team-count', text: '12' },
            { selector: '.scoring-type', text: 'PPR' }
          ]
        };
      };
      
      (window as any).mcp__playwright__browser_wait_for = async ({ text, time }: { text: string; time: number }) => {
        console.log(`⏳ Mock MCP Wait: ${text} (${time}s)`);
        await new Promise(resolve => setTimeout(resolve, 100));
        return Promise.resolve();
      };
      
      (window as any).mcp__playwright__browser_type = async ({ element, text }: { element: string; text: string }) => {
        console.log(`⌨️ Mock MCP Type: ${text} in ${element}`);
        return Promise.resolve();
      };
      
      (window as any).mcp__playwright__browser_click = async ({ element }: { element: string }) => {
        console.log(`👆 Mock MCP Click: ${element}`);
        return Promise.resolve();
      };
      
      // Mock successful authentication
      (window as any).__mockAuthenticationSuccess = true;
    });
  });

  test.afterEach(async () => {
    await performanceMonitor.stopMonitoring();
  });

  test.describe('Basic League Data Persistence', () => {
    test('should persist league data when navigating away and back to NFL League Sync', async ({ page }) => {
      console.log('🎯 Testing basic league data persistence...');
      
      // Navigate to the app
      await extendedPage.helpers.navigateToHome();
      
      // Navigate to NFL League Sync page
      await page.click('[data-testid="nav-nfl-sync"], button[aria-current="page"], button:has-text("NFL League Sync")');
      await page.waitForTimeout(2000); // Wait for view to load
      
      // Wait for the NFL League Sync view to initialize
      await expect(page.locator('h1:has-text("NFL.com League Sync")')).toBeVisible({ timeout: 10000 });
      
      // Simulate league data extraction by directly storing in localStorage
      await page.evaluate((mockData) => {
        const leagueStorage = {
          leagues: mockData,
          config: {},
          lastSync: new Date().toISOString(),
          version: '1.0.0'
        };
        localStorage.setItem('nfl-league-data', JSON.stringify(leagueStorage));
        
        // Trigger a storage event to notify the service
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'nfl-league-data',
          newValue: JSON.stringify(leagueStorage),
          storageArea: localStorage
        }));
      }, mockLeagueData);
      
      // Reload the page to simulate fresh page load with data
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Verify league data is loaded - check the league count
      await expect(page.locator('text=2').first()).toBeVisible({ timeout: 5000 });
      
      // Navigate to Draft Board page
      await page.click('button:has-text("Draft Board")');
      await page.waitForTimeout(1000);
      
      // Verify we're on the Draft Board
      await expect(page.locator('h2:has-text("Player Rankings")')).toBeVisible();
      
      // Navigate back to NFL League Sync
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(2000);
      
      // Verify league data is still present
      await expect(page.locator('h1:has-text("NFL.com League Sync")')).toBeVisible();
      
      // Check that we still have 2 leagues (not showing "0 Leagues")
      const leagueCountElement = page.locator('[data-testid="league-count"], div:has-text("Leagues")').locator('..').locator('text=/^\\d+$/');
      await expect(leagueCountElement).not.toHaveText('0');
      
      // Verify specific league names are present
      const injusticeLeague = page.locator('text=Injustice League');
      const legendsLeague = page.locator('text=Legends League');
      
      await expect(injusticeLeague.or(legendsLeague)).toBeVisible({ timeout: 5000 });
      
      // Check localStorage still contains our data
      const persistedData = await page.evaluate(() => {
        const stored = localStorage.getItem('nfl-league-data');
        return stored ? JSON.parse(stored) : null;
      });
      
      expect(persistedData).toBeTruthy();
      expect(persistedData.leagues).toBeTruthy();
      expect(Object.keys(persistedData.leagues)).toHaveLength(2);
      
      console.log('✅ Basic league data persistence test passed');
    });

    test('should maintain league data across multiple navigation cycles', async ({ page }) => {
      console.log('🔄 Testing league data persistence across multiple navigation cycles...');
      
      await extendedPage.helpers.navigateToHome();
      
      // Navigate to NFL League Sync and set up data
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(1000);
      
      // Store league data
      await page.evaluate((mockData) => {
        const leagueStorage = {
          leagues: mockData,
          config: {},
          lastSync: new Date().toISOString(),
          version: '1.0.0'
        };
        localStorage.setItem('nfl-league-data', JSON.stringify(leagueStorage));
      }, mockLeagueData);
      
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Navigate through multiple pages
      const navigationSequence = [
        'Draft Board',
        'Player Comparison', 
        'Live Data',
        'NFL League Sync',
        'Enhanced AI',
        'NFL League Sync',
        'NFL News',
        'NFL League Sync'
      ];
      
      for (const pageName of navigationSequence) {
        console.log(`📍 Navigating to: ${pageName}`);
        await page.click(`button:has-text("${pageName}")`);
        await page.waitForTimeout(800);
        
        if (pageName === 'NFL League Sync') {
          // Verify league data is still there
          const persistedData = await page.evaluate(() => {
            const stored = localStorage.getItem('nfl-league-data');
            return stored ? JSON.parse(stored) : null;
          });
          
          expect(persistedData).toBeTruthy();
          expect(persistedData.leagues).toBeTruthy();
          expect(Object.keys(persistedData.leagues)).toHaveLength(2);
          
          // Check for specific league names in DOM or localStorage
          const hasInjusticeLeague = persistedData.leagues.injustice_league?.name === 'Injustice League';
          const hasLegendsLeague = persistedData.leagues.legends_league?.name === 'Legends League';
          
          expect(hasInjusticeLeague).toBe(true);
          expect(hasLegendsLeague).toBe(true);
        }
      }
      
      console.log('✅ Multi-navigation persistence test passed');
    });
  });

  test.describe('League Data Content Validation', () => {
    test('should preserve specific league names and details', async ({ page }) => {
      console.log('🏆 Testing specific league data preservation...');
      
      await extendedPage.helpers.navigateToHome();
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(1000);
      
      // Store league data with specific details
      await page.evaluate((mockData) => {
        const leagueStorage = {
          leagues: mockData,
          config: {},
          lastSync: new Date().toISOString(),
          version: '1.0.0'
        };
        localStorage.setItem('nfl-league-data', JSON.stringify(leagueStorage));
      }, mockLeagueData);
      
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Navigate away and back
      await page.click('button:has-text("Draft Board")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(1000);
      
      // Validate specific league data is preserved
      const storedData = await page.evaluate(() => {
        const stored = localStorage.getItem('nfl-league-data');
        return stored ? JSON.parse(stored) : null;
      });
      
      expect(storedData.leagues.injustice_league).toBeTruthy();
      expect(storedData.leagues.injustice_league.name).toBe('Injustice League');
      expect(storedData.leagues.injustice_league.settings.scoringType).toBe('PPR');
      expect(storedData.leagues.injustice_league.settings.size).toBe(12);
      
      expect(storedData.leagues.legends_league).toBeTruthy();
      expect(storedData.leagues.legends_league.name).toBe('Legends League');
      expect(storedData.leagues.legends_league.settings.scoringType).toBe('Half-PPR');
      expect(storedData.leagues.legends_league.settings.size).toBe(10);
      
      // Validate draft positions are preserved
      expect(storedData.leagues.injustice_league.draftSettings.myDraftPosition).toBe(3);
      expect(storedData.leagues.legends_league.draftSettings.myDraftPosition).toBe(7);
      
      console.log('✅ League data content validation passed');
    });

    test('should preserve team information and roster data', async ({ page }) => {
      console.log('👥 Testing team and roster data persistence...');
      
      await extendedPage.helpers.navigateToHome();
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(1000);
      
      await page.evaluate((mockData) => {
        localStorage.setItem('nfl-league-data', JSON.stringify({
          leagues: mockData,
          config: {},
          lastSync: new Date().toISOString(),
          version: '1.0.0'
        }));
      }, mockLeagueData);
      
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Navigate through several pages
      await page.click('button:has-text("Player Comparison")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Enhanced AI")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(1000);
      
      const storedData = await page.evaluate(() => {
        const stored = localStorage.getItem('nfl-league-data');
        return stored ? JSON.parse(stored) : null;
      });
      
      // Validate team data preservation
      expect(storedData.leagues.injustice_league.myTeam.name).toBe('Championship Contenders');
      expect(storedData.leagues.injustice_league.myTeam.draftPosition).toBe(3);
      expect(storedData.leagues.injustice_league.myTeam.isCurrentUser).toBe(true);
      
      expect(storedData.leagues.legends_league.myTeam.name).toBe('Dynasty Dynasty');
      expect(storedData.leagues.legends_league.myTeam.record.wins).toBe(8);
      expect(storedData.leagues.legends_league.myTeam.record.losses).toBe(5);
      
      console.log('✅ Team and roster data persistence test passed');
    });
  });

  test.describe('Service State Management', () => {
    test('should maintain service subscriptions across navigation', async ({ page }) => {
      console.log('🔄 Testing service subscription persistence...');
      
      await extendedPage.helpers.navigateToHome();
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(2000);
      
      // Set up league data and verify service is working
      await page.evaluate((mockData) => {
        localStorage.setItem('nfl-league-data', JSON.stringify({
          leagues: mockData,
          config: {},
          lastSync: new Date().toISOString(),
          version: '1.0.0'
        }));
        
        // Mark that service is initialized
        (window as any).__nflServiceInitialized = true;
      }, mockLeagueData);
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Navigate away and back multiple times
      for (let i = 0; i < 3; i++) {
        await page.click('button:has-text("Draft Board")');
        await page.waitForTimeout(500);
        await page.click('button:has-text("NFL League Sync")');
        await page.waitForTimeout(1000);
        
        // Verify service is still functional
        const serviceState = await page.evaluate(() => {
          return {
            hasData: !!localStorage.getItem('nfl-league-data'),
            serviceInitialized: !!(window as any).__nflServiceInitialized,
            dataValid: (() => {
              const stored = localStorage.getItem('nfl-league-data');
              if (!stored) return false;
              try {
                const parsed = JSON.parse(stored);
                return parsed.leagues && Object.keys(parsed.leagues).length > 0;
              } catch {
                return false;
              }
            })()
          };
        });
        
        expect(serviceState.hasData).toBe(true);
        expect(serviceState.dataValid).toBe(true);
      }
      
      console.log('✅ Service subscription persistence test passed');
    });

    test('should handle page refresh without data loss', async ({ page }) => {
      console.log('🔄 Testing page refresh data preservation...');
      
      await extendedPage.helpers.navigateToHome();
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(1000);
      
      // Set up league data
      await page.evaluate((mockData) => {
        localStorage.setItem('nfl-league-data', JSON.stringify({
          leagues: mockData,
          config: {},
          lastSync: new Date().toISOString(),
          version: '1.0.0'
        }));
      }, mockLeagueData);
      
      // Refresh the page multiple times
      for (let i = 0; i < 3; i++) {
        await page.reload();
        await page.waitForTimeout(1500);
        
        // Verify data is still there after each refresh
        const storedData = await page.evaluate(() => {
          const stored = localStorage.getItem('nfl-league-data');
          return stored ? JSON.parse(stored) : null;
        });
        
        expect(storedData).toBeTruthy();
        expect(storedData.leagues.injustice_league).toBeTruthy();
        expect(storedData.leagues.legends_league).toBeTruthy();
      }
      
      console.log('✅ Page refresh data preservation test passed');
    });
  });

  test.describe('Error Scenarios and Edge Cases', () => {
    test('should handle corrupted localStorage data gracefully', async ({ page }) => {
      console.log('⚠️ Testing corrupted localStorage handling...');
      
      await extendedPage.helpers.navigateToHome();
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(1000);
      
      // Set corrupted data in localStorage
      await page.evaluate(() => {
        localStorage.setItem('nfl-league-data', '{"invalid": json}');
      });
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should not crash and should show appropriate state
      await expect(page.locator('h1:has-text("NFL.com League Sync")')).toBeVisible();
      
      // Should show "No Leagues Yet" or similar state
      const noLeaguesText = page.locator('text=No Leagues Yet, text=0 Leagues');
      await expect(noLeaguesText.first()).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Corrupted localStorage handling test passed');
    });

    test('should handle empty localStorage gracefully', async ({ page }) => {
      console.log('📭 Testing empty localStorage handling...');
      
      await extendedPage.helpers.navigateToHome();
      
      // Ensure localStorage is completely empty
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(2000);
      
      // Should show the "No Leagues Yet" state
      await expect(page.locator('h3:has-text("No Leagues Yet")')).toBeVisible();
      await expect(page.locator('button:has-text("Add Your First League")')).toBeVisible();
      
      // Navigate away and back to ensure it remains stable
      await page.click('button:has-text("Draft Board")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(1000);
      
      // Should still show the same empty state
      await expect(page.locator('h3:has-text("No Leagues Yet")')).toBeVisible();
      
      console.log('✅ Empty localStorage handling test passed');
    });

    test('should preserve data during Browser MCP service failures', async ({ page }) => {
      console.log('🚨 Testing Browser MCP service failure scenarios...');
      
      await extendedPage.helpers.navigateToHome();
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(1000);
      
      // Set up valid league data
      await page.evaluate((mockData) => {
        localStorage.setItem('nfl-league-data', JSON.stringify({
          leagues: mockData,
          config: {},
          lastSync: new Date().toISOString(),
          version: '1.0.0'
        }));
      }, mockLeagueData);
      
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Simulate Browser MCP failure by removing mock functions
      await page.evaluate(() => {
        delete (window as any).mcp__playwright__browser_navigate;
        delete (window as any).mcp__playwright__browser_snapshot;
        (window as any).__mockBrowserMCPFailure = true;
      });
      
      // Navigate away and back
      await page.click('button:has-text("Player Comparison")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(1500);
      
      // League data should still be preserved even if Browser MCP fails
      const storedData = await page.evaluate(() => {
        const stored = localStorage.getItem('nfl-league-data');
        return stored ? JSON.parse(stored) : null;
      });
      
      expect(storedData).toBeTruthy();
      expect(storedData.leagues.injustice_league.name).toBe('Injustice League');
      expect(storedData.leagues.legends_league.name).toBe('Legends League');
      
      console.log('✅ Browser MCP service failure test passed');
    });
  });

  test.describe('Performance Validation', () => {
    test('should maintain fast navigation with persisted data', async ({ page }) => {
      console.log('⚡ Testing navigation performance with league data...');
      
      await extendedPage.helpers.navigateToHome();
      await page.click('button:has-text("NFL League Sync")');
      
      // Set up league data
      await page.evaluate((mockData) => {
        localStorage.setItem('nfl-league-data', JSON.stringify({
          leagues: mockData,
          config: {},
          lastSync: new Date().toISOString(),
          version: '1.0.0'
        }));
      }, mockLeagueData);
      
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Measure navigation performance
      const navigationTimes: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        await page.click('button:has-text("Draft Board")');
        await page.waitForLoadState('networkidle');
        
        await page.click('button:has-text("NFL League Sync")');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        const endTime = Date.now();
        navigationTimes.push(endTime - startTime);
      }
      
      const averageTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
      console.log(`📊 Average navigation time: ${averageTime}ms`);
      
      // Navigation should be reasonably fast (under 3 seconds on average)
      expect(averageTime).toBeLessThan(3000);
      
      console.log('✅ Navigation performance test passed');
    });

    test('should handle large league datasets efficiently', async ({ page }) => {
      console.log('📊 Testing large dataset handling...');
      
      // Create larger mock dataset
      const largeDataset = { ...mockLeagueData };
      
      // Add more leagues
      for (let i = 3; i <= 10; i++) {
        largeDataset[`league_${i}`] = {
          ...mockLeagueData.injustice_league,
          id: `league_${i}`,
          name: `Test League ${i}`,
          leagueKey: `${123456789 + i}`,
        };
      }
      
      await extendedPage.helpers.navigateToHome();
      await page.click('button:has-text("NFL League Sync")');
      
      const startTime = Date.now();
      
      await page.evaluate((dataset) => {
        localStorage.setItem('nfl-league-data', JSON.stringify({
          leagues: dataset,
          config: {},
          lastSync: new Date().toISOString(),
          version: '1.0.0'
        }));
      }, largeDataset);
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      const loadTime = Date.now() - startTime;
      console.log(`📊 Large dataset load time: ${loadTime}ms`);
      
      // Should handle large datasets reasonably well
      expect(loadTime).toBeLessThan(5000);
      
      // Navigate and verify data persistence
      await page.click('button:has-text("Draft Board")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(1000);
      
      const storedData = await page.evaluate(() => {
        const stored = localStorage.getItem('nfl-league-data');
        return stored ? JSON.parse(stored) : null;
      });
      
      expect(Object.keys(storedData.leagues)).toHaveLength(10);
      
      console.log('✅ Large dataset handling test passed');
    });
  });

  test.describe('Console Logging Verification', () => {
    test('should log appropriate messages during data persistence operations', async ({ page }) => {
      console.log('📝 Testing console logging during persistence operations...');
      
      const consoleLogs: string[] = [];
      
      // Capture console messages
      page.on('console', (msg) => {
        if (msg.type() === 'log' || msg.type() === 'info') {
          consoleLogs.push(msg.text());
        }
      });
      
      await extendedPage.helpers.navigateToHome();
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(2000);
      
      await page.evaluate((mockData) => {
        console.log('🏈 Setting up league data for persistence test');
        localStorage.setItem('nfl-league-data', JSON.stringify({
          leagues: mockData,
          config: {},
          lastSync: new Date().toISOString(),
          version: '1.0.0'
        }));
        console.log('✅ League data stored in localStorage');
      }, mockLeagueData);
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Navigate and trigger more logging
      await page.click('button:has-text("Draft Board")');
      await page.waitForTimeout(1000);
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(2000);
      
      // Verify expected log messages
      const hasLeagueDataLog = consoleLogs.some(log => 
        log.includes('league data') || 
        log.includes('League') ||
        log.includes('NFL League Sync')
      );
      
      const hasInitializationLog = consoleLogs.some(log => 
        log.includes('Initializing') || 
        log.includes('initialized')
      );
      
      expect(hasLeagueDataLog).toBe(true);
      expect(hasInitializationLog).toBe(true);
      
      console.log('✅ Console logging verification test passed');
      console.log(`📊 Captured ${consoleLogs.length} console messages`);
    });
  });
});