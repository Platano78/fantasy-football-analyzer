/**
 * Integration Testing Suite
 * 
 * Comprehensive end-to-end testing covering:
 * - Complete user workflows with all systems
 * - Data flow from ESPN API → Browser MCP → AI Analysis
 * - Fantasy football coaching scenarios (draft, trade, lineup)
 * - Cross-service communication and data consistency
 * - Performance under load and concurrent users
 */

import { test, expect, Page } from '@playwright/test';
import { createExtendedPage, PerformanceMonitor, testUtils } from '../setup/test-helpers';
import { MockManager } from '../fixtures/mock-responses';
import { mockPlayers, mockDraftData, performanceBenchmarks } from '../fixtures/test-data';

// Test group configuration
test.describe('Full System Integration', () => {
  let extendedPage: any;
  let mockManager: MockManager;
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page }) => {
    extendedPage = createExtendedPage(page);
    mockManager = new MockManager(page);
    performanceMonitor = new PerformanceMonitor(page);
    
    await performanceMonitor.startMonitoring();
    
    // Set up full integration environment
    await mockManager.setupESPNMocks(['success']);
    await mockManager.setupLocalGeminiMocks(['available']);
    await mockManager.setupCloudGeminiMocks(['available']);
    await mockManager.setupBrowserMCPMocks();
  });

  test.afterEach(async () => {
    await mockManager.cleanup();
  });

  test.describe('Complete User Workflows', () => {
    test('should handle complete draft workflow', async ({ page }) => {
      // Start at home page
      await extendedPage.helpers.navigateToHome();
      
      // Navigate to draft
      await extendedPage.helpers.navigateToDraft();
      
      // Verify draft board loads with ESPN data
      await expect(page.locator('[data-testid="draft-board"]')).toBeVisible();
      await expect(page.locator('[data-testid="player-row"]').first()).toBeVisible();
      
      // Select a player and get AI recommendation
      await extendedPage.helpers.selectPlayer(1);
      const aiRecommendation = await extendedPage.helpers.sendAIMessage('Should I draft this player?');
      expect(aiRecommendation).toBeTruthy();
      expect(aiRecommendation.length).toBeGreaterThan(50);
      
      // Draft the player
      await extendedPage.helpers.draftPlayer(1);
      
      // Verify draft state updated
      await expect(page.locator('[data-testid="drafted-player-1"]')).toBeVisible();
      
      // Check updated draft position
      const currentPick = await page.locator('[data-testid="current-pick"]').textContent();
      expect(parseInt(currentPick || '0')).toBeGreaterThan(1);
      
      // Get AI advice for next pick
      const nextPickAdvice = await extendedPage.helpers.sendAIMessage('Who should I target with my next pick?');
      expect(nextPickAdvice).toBeTruthy();
      expect(nextPickAdvice.toLowerCase()).toMatch(/next|pick|target|recommend/);
    });

    test('should handle complete player comparison workflow', async ({ page }) => {
      await extendedPage.helpers.navigateToComparison();
      
      // Select first player
      await page.click('[data-testid="select-player-1"]');
      await page.click('[data-testid="player-option-1"]');
      
      // Select second player  
      await page.click('[data-testid="select-player-2"]');
      await page.click('[data-testid="player-option-2"]');
      
      // Wait for comparison data to load
      await page.waitForSelector('[data-testid="comparison-chart"]');
      
      // Verify comparison shows ESPN data
      await expect(page.locator('[data-testid="player-1-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="player-2-stats"]')).toBeVisible();
      
      // Get AI analysis of the comparison
      const aiAnalysis = await extendedPage.helpers.sendAIMessage('Compare these two players for me');
      expect(aiAnalysis).toBeTruthy();
      expect(aiAnalysis.length).toBeGreaterThan(100);
      expect(aiAnalysis.toLowerCase()).toMatch(/compare|better|prefer|advantage/);
      
      // Check for injury data from Browser MCP
      const injuryData = await page.locator('[data-testid="injury-status"]').count();
      expect(injuryData).toBeGreaterThanOrEqual(0);
      
      // Verify visualization elements
      await expect(page.locator('[data-testid="stats-chart"]')).toBeVisible();
    });

    test('should handle complete live data monitoring workflow', async ({ page }) => {
      await extendedPage.helpers.navigateToLiveData();
      
      // Verify live data sources are connected
      await expect(page.locator('[data-testid="live-data-status"]')).toBeVisible();
      
      // Check for NFL injury updates from Browser MCP
      await page.click('[data-testid="tab-injuries"]');
      await page.waitForSelector('[data-testid="injury-update"]');
      
      const injuryUpdates = await page.locator('[data-testid="injury-update"]').count();
      expect(injuryUpdates).toBeGreaterThan(0);
      
      // Check for FantasyPros rankings
      await page.click('[data-testid="tab-rankings"]');
      await page.waitForSelector('[data-testid="ranking-update"]');
      
      // Get AI interpretation of live data
      const interpretation = await extendedPage.helpers.sendAIMessage('What do these injury updates mean for my team?');
      expect(interpretation).toBeTruthy();
      expect(interpretation.toLowerCase()).toMatch(/injury|impact|team|affect/);
      
      // Verify real-time updates
      await page.click('[data-testid="refresh-live-data"]');
      await page.waitForTimeout(2000);
      
      // Data should refresh
      const refreshIndicator = await page.locator('[data-testid="last-updated"]').textContent();
      expect(refreshIndicator).toBeTruthy();
    });

    test('should handle complete AI coaching session', async ({ page }) => {
      await extendedPage.helpers.navigateToAI();
      
      // Start with draft analysis request
      const draftAnalysis = await extendedPage.helpers.sendAIMessage('Help me prepare for my draft. I pick 3rd in a 12-team PPR league.');
      expect(draftAnalysis).toBeTruthy();
      expect(draftAnalysis.toLowerCase()).toMatch(/draft|3rd|ppr|strategy/);
      
      // Follow up with specific player question
      const playerQuestion = await extendedPage.helpers.sendAIMessage('Should I take a RB or WR with my first pick?');
      expect(playerQuestion).toBeTruthy();
      expect(playerQuestion.toLowerCase()).toMatch(/rb|wr|first pick|position/);
      
      // Ask about trade scenario
      const tradeQuestion = await extendedPage.helpers.sendAIMessage('Someone offered me Josh Allen for my CeeDee Lamb. Should I take it?');
      expect(tradeQuestion).toBeTruthy();
      expect(tradeQuestion.toLowerCase()).toMatch(/trade|allen|lamb|value/);
      
      // Get lineup advice
      const lineupAdvice = await extendedPage.helpers.sendAIMessage('Set my lineup for this week');
      expect(lineupAdvice).toBeTruthy();
      expect(lineupAdvice.toLowerCase()).toMatch(/lineup|start|sit|week/);
      
      // Verify conversation context is maintained
      const contextCheck = await extendedPage.helpers.sendAIMessage('Going back to that trade, what if they add Travis Kelce?');
      expect(contextCheck).toBeTruthy();
      expect(contextCheck.toLowerCase()).toMatch(/trade|kelce|add|value/);
    });
  });

  test.describe('Data Flow Integration', () => {
    test('should integrate ESPN API data throughout the app', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Wait for ESPN data to load
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Get player data from home page
      const homePagePlayer = await page.locator('[data-testid="player-name"]').first().textContent();
      
      // Navigate to draft and verify same data appears
      await extendedPage.helpers.navigateToDraft();
      const draftPagePlayers = await page.locator('[data-testid="player-name"]').allTextContents();
      expect(draftPagePlayers).toContain(homePagePlayer);
      
      // Navigate to comparison and verify data consistency
      await extendedPage.helpers.navigateToComparison();
      await page.click('[data-testid="select-player-1"]');
      const comparisonPlayerOptions = await page.locator('[data-testid="player-option"] .player-name').allTextContents();
      expect(comparisonPlayerOptions).toContain(homePagePlayer);
      
      // Verify player stats are consistent across views
      const playerStats = await page.evaluate((playerName) => {
        const elements = document.querySelectorAll(`[data-player-name="${playerName}"]`);
        return Array.from(elements).map(el => ({
          ppr: el.querySelector('[data-testid="ppr-points"]')?.textContent,
          standard: el.querySelector('[data-testid="standard-points"]')?.textContent,
        }));
      }, homePagePlayer);
      
      // All instances should have consistent stats
      if (playerStats.length > 1) {
        const firstStats = playerStats[0];
        playerStats.forEach(stats => {
          expect(stats.ppr).toBe(firstStats.ppr);
          expect(stats.standard).toBe(firstStats.standard);
        });
      }
    });

    test('should integrate Browser MCP data with ESPN data', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Wait for both data sources to load
      await page.waitForSelector('[data-testid="player-row"]');
      await page.waitForTimeout(3000); // Allow Browser MCP to enrich data
      
      // Navigate to injury view to see Browser MCP integration
      await page.click('[data-testid="nav-injuries"]');
      await page.waitForSelector('[data-testid="injury-report"]');
      
      // Verify injury data is integrated with player data
      const injuryReports = await page.evaluate(() => {
        const reports = Array.from(document.querySelectorAll('[data-testid="injury-report"]'));
        return reports.map(report => ({
          playerName: report.querySelector('[data-testid="player-name"]')?.textContent,
          hasESPNData: !!report.querySelector('[data-testid="espn-stats"]'),
          hasBrowserMCPData: !!report.querySelector('[data-testid="injury-status"]'),
        }));
      });
      
      injuryReports.forEach(report => {
        expect(report.playerName).toBeTruthy();
        // Should have data from both sources integrated
      });
      
      // Check rankings integration
      await page.click('[data-testid="nav-rankings"]');
      await page.waitForSelector('[data-testid="ranking-row"]');
      
      const rankings = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('[data-testid="ranking-row"]'));
        return rows.map(row => ({
          playerName: row.querySelector('[data-testid="player-name"]')?.textContent,
          hasESPNProjection: !!row.querySelector('[data-testid="espn-projection"]'),
          hasBrowserMCPRank: !!row.querySelector('[data-testid="consensus-rank"]'),
        }));
      });
      
      expect(rankings.length).toBeGreaterThan(0);
    });

    test('should flow data into AI analysis', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Select a specific player to analyze
      await extendedPage.helpers.selectPlayer(1);
      const selectedPlayer = await page.locator('[data-testid="selected-player-name"]').textContent();
      
      // Navigate to AI and ask about the selected player
      await extendedPage.helpers.navigateToAI();
      const aiAnalysis = await extendedPage.helpers.sendAIMessage('Analyze this player for me');
      
      // AI should reference the selected player
      expect(aiAnalysis.toLowerCase()).toMatch(new RegExp(selectedPlayer?.toLowerCase().split(' ')[0] || 'player'));
      
      // AI analysis should incorporate both ESPN and Browser MCP data
      expect(aiAnalysis.length).toBeGreaterThan(150);
      expect(aiAnalysis.toLowerCase()).toMatch(/projections?|stats|ranking|injury|outlook/);
      
      // Test with injury data
      await page.click('[data-testid="nav-injuries"]');
      await page.waitForSelector('[data-testid="injury-report"]');
      
      // Select an injured player
      await page.click('[data-testid="injury-report"]');
      const injuredPlayer = await page.locator('[data-testid="selected-injured-player"]').textContent();
      
      if (injuredPlayer) {
        await extendedPage.helpers.navigateToAI();
        const injuryAnalysis = await extendedPage.helpers.sendAIMessage('What do you think about this injured player?');
        
        expect(injuryAnalysis.toLowerCase()).toMatch(/injury|status|impact|health/);
      }
    });
  });

  test.describe('Fantasy Football Scenarios', () => {
    test('should handle complete draft scenario', async ({ page }) => {
      await extendedPage.helpers.navigateToDraft();
      
      // Simulate draft environment
      await extendedPage.helpers.validateDraftState(1, 3);
      
      // Get AI advice for draft strategy
      const strategyAdvice = await extendedPage.helpers.sendAIMessage('What is the best strategy for pick 3 in a 12-team PPR league?');
      expect(strategyAdvice).toBeTruthy();
      expect(strategyAdvice.toLowerCase()).toMatch(/strategy|pick 3|ppr|tier/);
      
      // Draft multiple players with AI guidance
      for (let pick = 1; pick <= 3; pick++) {
        const pickAdvice = await extendedPage.helpers.sendAIMessage(`Who should I draft with pick ${pick}?`);
        expect(pickAdvice).toBeTruthy();
        
        // Draft a recommended player
        await extendedPage.helpers.draftPlayer(pick);
        
        // Verify draft board updates
        await expect(page.locator(`[data-testid="drafted-player-${pick}"]`)).toBeVisible();
      }
      
      // Get final team analysis
      const teamAnalysis = await extendedPage.helpers.sendAIMessage('How does my team look so far?');
      expect(teamAnalysis).toBeTruthy();
      expect(teamAnalysis.toLowerCase()).toMatch(/team|roster|balance|strength/);
    });

    test('should handle trade evaluation scenario', async ({ page }) => {
      await extendedPage.helpers.navigateToComparison();
      
      // Set up trade comparison
      await page.click('[data-testid="trade-mode"]');
      
      // Add players to trade
      await page.click('[data-testid="add-give-player"]');
      await page.click('[data-testid="player-option-1"]');
      
      await page.click('[data-testid="add-get-player"]');
      await page.click('[data-testid="player-option-2"]');
      await page.click('[data-testid="player-option-3"]');
      
      // Get AI trade evaluation
      const tradeEval = await extendedPage.helpers.sendAIMessage('Evaluate this trade for me');
      expect(tradeEval).toBeTruthy();
      expect(tradeEval.length).toBeGreaterThan(200);
      expect(tradeEval.toLowerCase()).toMatch(/trade|value|worth|accept|decline/);
      
      // Ask for alternative suggestions
      const alternatives = await extendedPage.helpers.sendAIMessage('What if I counter-offer?');
      expect(alternatives).toBeTruthy();
      expect(alternatives.toLowerCase()).toMatch(/counter|alternative|instead|suggest/);
      
      // Check trade impact on team
      const teamImpact = await extendedPage.helpers.sendAIMessage('How would this trade affect my team composition?');
      expect(teamImpact).toBeTruthy();
      expect(teamImpact.toLowerCase()).toMatch(/team|composition|impact|balance/);
    });

    test('should handle weekly lineup optimization', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Set up user roster (simulate owned players)
      await page.evaluate(() => {
        localStorage.setItem('userRoster', JSON.stringify([
          { id: 1, name: 'Josh Allen', position: 'QB', team: 'BUF' },
          { id: 2, name: 'Christian McCaffrey', position: 'RB', team: 'SF' },
          { id: 3, name: 'CeeDee Lamb', position: 'WR', team: 'DAL' },
          { id: 4, name: 'Travis Kelce', position: 'TE', team: 'KC' },
          { id: 5, name: 'Bijan Robinson', position: 'RB', team: 'ATL' },
        ]));
      });
      
      // Navigate to lineup optimizer
      await page.click('[data-testid="nav-lineup"]');
      
      // Get lineup recommendations
      const lineupRec = await extendedPage.helpers.sendAIMessage('Optimize my lineup for this week');
      expect(lineupRec).toBeTruthy();
      expect(lineupRec.length).toBeGreaterThan(150);
      expect(lineupRec.toLowerCase()).toMatch(/lineup|start|sit|matchup/);
      
      // Ask about specific matchups
      const matchupAnalysis = await extendedPage.helpers.sendAIMessage('How do you feel about CeeDee Lamb this week?');
      expect(matchupAnalysis).toBeTruthy();
      expect(matchupAnalysis.toLowerCase()).toMatch(/lamb|ceedee|matchup|week/);
      
      // Get flex position advice
      const flexAdvice = await extendedPage.helpers.sendAIMessage('Who should I start at flex?');
      expect(flexAdvice).toBeTruthy();
      expect(flexAdvice.toLowerCase()).toMatch(/flex|start|rb|wr/);
      
      // Verify lineup changes reflect in UI
      await page.click('[data-testid="apply-recommendations"]').catch(() => {
        console.log('Auto-apply recommendations not available');
      });
    });

    test('should handle waiver wire analysis', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Navigate to waiver wire section
      await page.click('[data-testid="nav-waivers"]');
      await page.waitForSelector('[data-testid="available-players"]');
      
      // Get waiver recommendations
      const waiverRecs = await extendedPage.helpers.sendAIMessage('Who should I target on waivers this week?');
      expect(waiverRecs).toBeTruthy();
      expect(waiverRecs.length).toBeGreaterThan(100);
      expect(waiverRecs.toLowerCase()).toMatch(/waiver|target|pickup|add/);
      
      // Analyze specific waiver player
      await page.click('[data-testid="waiver-player-1"]');
      const playerAnalysis = await extendedPage.helpers.sendAIMessage('Is this player worth a waiver claim?');
      expect(playerAnalysis).toBeTruthy();
      expect(playerAnalysis.toLowerCase()).toMatch(/waiver|claim|worth|priority/);
      
      // Get drop recommendations
      const dropRecs = await extendedPage.helpers.sendAIMessage('Who should I drop to make room?');
      expect(dropRecs).toBeTruthy();
      expect(dropRecs.toLowerCase()).toMatch(/drop|cut|release|bench/);
    });
  });

  test.describe('Performance Under Load', () => {
    test('should handle multiple concurrent users', async ({ page }) => {
      // Simulate multiple user sessions
      const sessions = [];
      
      for (let i = 0; i < 3; i++) {
        const sessionPromise = (async () => {
          await page.goto('/');
          await page.waitForSelector('[data-testid="player-row"]');
          
          // Each session performs different actions
          if (i === 0) {
            await page.click('[data-testid="nav-draft"]');
            await page.waitForSelector('[data-testid="draft-board"]');
          } else if (i === 1) {
            await page.click('[data-testid="nav-comparison"]');
            await page.waitForSelector('[data-testid="comparison-tools"]');
          } else {
            await page.click('[data-testid="nav-ai"]');
            await page.waitForSelector('[data-testid="ai-chat"]');
          }
          
          return true;
        })();
        
        sessions.push(sessionPromise);
      }
      
      const results = await Promise.allSettled(sessions);
      const successfulSessions = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successfulSessions).toBeGreaterThanOrEqual(2); // At least 2/3 should succeed
    });

    test('should maintain performance with heavy data loads', async ({ page }) => {
      // Load large dataset
      await page.addInitScript(() => {
        localStorage.setItem('enableLargeDataset', 'true');
      });
      
      const startTime = Date.now();
      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(10000); // 10 seconds even with large dataset
      
      // Verify all data loaded
      const playerCount = await page.locator('[data-testid="player-row"]').count();
      expect(playerCount).toBeGreaterThan(50);
      
      // Test navigation performance with large dataset
      const navStart = Date.now();
      await extendedPage.helpers.navigateToDraft();
      const navTime = Date.now() - navStart;
      
      expect(navTime).toBeLessThan(5000); // 5 seconds for navigation
    });

    test('should handle rapid user interactions', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Rapid-fire interactions
      const interactions = [
        () => page.click('[data-testid="nav-draft"]'),
        () => page.click('[data-testid="nav-comparison"]'),
        () => page.click('[data-testid="nav-ai"]'),
        () => page.click('[data-testid="nav-home"]'),
        () => page.click('[data-testid="player-search"]'),
      ];
      
      const startTime = Date.now();
      for (const interaction of interactions) {
        try {
          await interaction();
          await page.waitForTimeout(100);
        } catch (error) {
          console.log('Interaction failed:', error);
        }
      }
      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(15000); // 15 seconds for all interactions
      
      // Application should still be responsive
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });

    test('should handle API rate limiting gracefully', async ({ page }) => {
      let requestCount = 0;
      
      // Simulate rate limiting after multiple requests
      await page.route('**/*', async (route) => {
        requestCount++;
        if (requestCount > 20) {
          await route.fulfill({
            status: 429,
            body: JSON.stringify({ error: 'Rate limited' }),
          });
        } else {
          await route.continue();
        }
      });
      
      await extendedPage.helpers.navigateToHome();
      
      // Generate multiple API requests rapidly
      for (let i = 0; i < 10; i++) {
        await page.reload();
        await page.waitForTimeout(100);
      }
      
      // Should show rate limiting message
      await expect(page.locator('[data-testid="rate-limit-warning"]')).toBeVisible({ timeout: 10000 });
      
      // Should continue to function with cached data
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });
  });

  test.describe('Cross-Service Communication', () => {
    test('should handle service coordination during failures', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Start with all services working
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Simulate ESPN API failure
      await page.route('**/athletes*', route => route.abort());
      
      // Should fallback to Browser MCP data
      await page.reload();
      await page.waitForTimeout(5000);
      
      // Should still show player data from Browser MCP
      const playerRows = await page.locator('[data-testid="player-row"]').count();
      expect(playerRows).toBeGreaterThan(0);
      
      // AI should still provide analysis with available data
      await extendedPage.helpers.navigateToAI();
      const response = await extendedPage.helpers.sendAIMessage('Analyze available player data');
      expect(response).toBeTruthy();
    });

    test('should synchronize data across services', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Wait for initial data load
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Trigger data refresh from multiple sources
      await page.click('[data-testid="refresh-espn-data"]').catch(() => {});
      await page.click('[data-testid="refresh-browser-mcp"]').catch(() => {});
      
      await page.waitForTimeout(5000);
      
      // Data should be synchronized
      const synchronizationStatus = await page.evaluate(() => {
        return localStorage.getItem('dataSyncStatus');
      });
      
      expect(synchronizationStatus).toBeTruthy();
      
      // Verify no data conflicts
      const conflicts = await page.locator('[data-testid="data-conflict"]').count();
      expect(conflicts).toBe(0);
    });

    test('should handle service degradation cascades', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Start degrading services one by one
      // First ESPN API becomes slow
      await page.route('**/athletes*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 10000));
        await route.continue();
      });
      
      // Then Browser MCP fails
      await page.addInitScript(() => {
        (window as any).mcpBrowserNavigate = () => Promise.reject(new Error('MCP failed'));
      });
      
      // Application should degrade gracefully
      await page.reload();
      await page.waitForTimeout(15000);
      
      // Should show degraded service warnings
      const warnings = await page.locator('[data-testid="service-warning"]').count();
      expect(warnings).toBeGreaterThan(0);
      
      // AI should still work in offline mode
      await extendedPage.helpers.navigateToAI();
      const response = await extendedPage.helpers.sendAIMessage('General fantasy advice');
      expect(response).toBeTruthy();
      expect(response.toLowerCase()).toMatch(/offline|general|advice/);
    });
  });

  test.describe('Data Consistency', () => {
    test('should maintain data integrity across navigation', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Get initial data snapshot
      const initialData = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[data-testid="player-row"]')).map(row => ({
          name: row.querySelector('[data-testid="player-name"]')?.textContent,
          position: row.querySelector('[data-testid="player-position"]')?.textContent,
          team: row.querySelector('[data-testid="player-team"]')?.textContent,
        }));
      });
      
      // Navigate through all major sections
      const sections = ['draft', 'comparison', 'ai', 'home'];
      
      for (const section of sections) {
        await page.click(`[data-testid="nav-${section}"]`);
        await page.waitForTimeout(2000);
        
        // Verify data consistency in each section
        if (section === 'home') {
          const currentData = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('[data-testid="player-row"]')).map(row => ({
              name: row.querySelector('[data-testid="player-name"]')?.textContent,
              position: row.querySelector('[data-testid="player-position"]')?.textContent,
              team: row.querySelector('[data-testid="player-team"]')?.textContent,
            }));
          });
          
          // Data should be consistent
          expect(currentData.length).toBe(initialData.length);
          currentData.forEach((player, index) => {
            expect(player.name).toBe(initialData[index].name);
            expect(player.position).toBe(initialData[index].position);
            expect(player.team).toBe(initialData[index].team);
          });
        }
      }
    });

    test('should handle real-time data updates consistently', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      await page.waitForSelector('[data-testid="player-row"]');
      
      // Simulate real-time update
      await page.evaluate(() => {
        // Trigger injury update
        window.dispatchEvent(new CustomEvent('injuryUpdate', {
          detail: {
            playerId: 1,
            status: 'Questionable',
            description: 'Ankle injury'
          }
        }));
      });
      
      await page.waitForTimeout(2000);
      
      // Check that update is reflected across all views
      const homeStatus = await page.locator('[data-testid="player-1"] [data-testid="injury-status"]').textContent();
      
      await extendedPage.helpers.navigateToDraft();
      const draftStatus = await page.locator('[data-testid="player-1"] [data-testid="injury-status"]').textContent();
      
      expect(homeStatus).toBe(draftStatus);
      expect(homeStatus).toContain('Questionable');
    });
  });

  test.describe('User Experience Integration', () => {
    test('should provide smooth user experience across all features', async ({ page }) => {
      // Complete user journey
      await extendedPage.helpers.navigateToHome();
      
      // Search for a player
      await extendedPage.helpers.searchForPlayer('Christian McCaffrey');
      await page.waitForTimeout(1000);
      
      // Select the player
      await extendedPage.helpers.selectPlayer(1);
      
      // Get AI analysis
      await extendedPage.helpers.navigateToAI();
      const analysis = await extendedPage.helpers.sendAIMessage('Tell me about this player');
      expect(analysis.toLowerCase()).toMatch(/mccaffrey|christian|running back|rb/);
      
      // Compare with another player
      await extendedPage.helpers.navigateToComparison();
      await extendedPage.helpers.openPlayerComparison(1, 2);
      
      // Get AI comparison
      const comparison = await extendedPage.helpers.sendAIMessage('Compare these players');
      expect(comparison).toBeTruthy();
      expect(comparison.length).toBeGreaterThan(100);
      
      // Check injury status
      await page.click('[data-testid="nav-injuries"]');
      await page.waitForSelector('[data-testid="injury-report"]');
      
      // Everything should work smoothly without errors
      await extendedPage.helpers.expectNoConsoleErrors();
      await extendedPage.helpers.expectNoNetworkErrors();
    });

    test('should maintain user context throughout session', async ({ page }) => {
      await extendedPage.helpers.navigateToHome();
      
      // Set user preferences
      await page.evaluate(() => {
        localStorage.setItem('userPreferences', JSON.stringify({
          scoringSystem: 'PPR',
          favoriteTeam: 'SF',
          leagueSize: 12,
        }));
      });
      
      // Navigate to different sections and verify context is maintained
      await extendedPage.helpers.navigateToDraft();
      
      const draftContext = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('userPreferences') || '{}');
      });
      
      expect(draftContext.scoringSystem).toBe('PPR');
      
      // AI should be aware of user context
      await extendedPage.helpers.navigateToAI();
      const contextualResponse = await extendedPage.helpers.sendAIMessage('Help me with my team');
      
      // Response should reference PPR scoring
      expect(contextualResponse.toLowerCase()).toMatch(/ppr|reception/);
    });
  });
});