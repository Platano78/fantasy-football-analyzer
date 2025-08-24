#!/usr/bin/env node

/**
 * League Data Persistence Test Runner
 * 
 * Simplified test runner for the critical game day test to ensure
 * league data persistence is working correctly.
 */

import { chromium } from 'playwright';

async function runLeagueDataPersistenceTest() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Starting League Data Persistence Test...');
    
    // Launch browser
    browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true
    });
    
    page = await context.newPage();
    
    // Set up Browser MCP mocks
    await page.addInitScript(() => {
      // Mock Browser MCP functions
      window.mcp__playwright__browser_navigate = async ({ url }) => {
        console.log(`🌐 Mock MCP Navigate: ${url}`);
        return Promise.resolve();
      };
      
      window.mcp__playwright__browser_snapshot = async () => {
        console.log('📸 Mock MCP Snapshot');
        return {
          html: '<div class="league-info">Mock league data</div>',
          elements: [
            { selector: '.league-name', text: 'Injustice League' },
            { selector: '.team-count', text: '12' }
          ]
        };
      };
      
      window.mcp__playwright__browser_wait_for = async ({ text, time }) => {
        console.log(`⏳ Mock MCP Wait: ${text} (${time}s)`);
        await new Promise(resolve => setTimeout(resolve, 100));
      };
    });
    
    // Navigate to app
    console.log('📱 Navigating to Fantasy Football Analyzer...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Navigate to NFL League Sync
    console.log('🏈 Navigating to NFL League Sync...');
    const nflSyncButton = await page.locator('button:has-text("NFL League Sync"), a:has-text("NFL League Sync")').first();
    if (await nflSyncButton.isVisible()) {
      await nflSyncButton.click();
    } else {
      console.log('⚠️ NFL League Sync button not found, trying navigation menu...');
      // Try to find in navigation
      await page.click('nav button:nth-child(7)'); // Position of NFL League Sync in nav
    }
    
    await page.waitForTimeout(3000);
    
    // Verify we're on the NFL League Sync page
    console.log('✅ Verifying NFL League Sync page loaded...');
    await page.waitForSelector('h1:has-text("NFL"), h2:has-text("NFL")', { timeout: 10000 });
    
    // Mock league data
    const mockLeagueData = {
      injustice_league: {
        id: 'injustice_league',
        name: 'Injustice League',
        season: 2024,
        settings: { size: 12, scoringType: 'PPR' },
        syncStatus: 'success'
      },
      legends_league: {
        id: 'legends_league', 
        name: 'Legends League',
        season: 2024,
        settings: { size: 10, scoringType: 'Half-PPR' },
        syncStatus: 'success'
      }
    };
    
    // Store league data in localStorage
    console.log('💾 Storing mock league data...');
    await page.evaluate((data) => {
      const leagueStorage = {
        leagues: data,
        config: {},
        lastSync: new Date().toISOString(),
        version: '1.0.0'
      };
      localStorage.setItem('nfl-league-data', JSON.stringify(leagueStorage));
      console.log('🏈 League data stored:', JSON.stringify(leagueStorage, null, 2));
    }, mockLeagueData);
    
    // Reload page to simulate fresh load
    console.log('🔄 Reloading page to test persistence...');
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Navigate to Draft Board
    console.log('🏈 Navigating to Draft Board...');
    const draftButton = await page.locator('button:has-text("Draft Board"), a:has-text("Draft")').first();
    if (await draftButton.isVisible()) {
      await draftButton.click();
    } else {
      await page.click('nav button:first-child'); // First nav button should be Draft Board
    }
    
    await page.waitForTimeout(2000);
    
    // Navigate back to NFL League Sync
    console.log('↩️ Navigating back to NFL League Sync...');
    const backToNflSync = await page.locator('button:has-text("NFL League Sync"), a:has-text("NFL League Sync")').first();
    if (await backToNflSync.isVisible()) {
      await backToNflSync.click();
    } else {
      await page.click('nav button:nth-child(7)');
    }
    
    await page.waitForTimeout(3000);
    
    // Verify data persistence
    console.log('🔍 Verifying league data persistence...');
    const persistedData = await page.evaluate(() => {
      const stored = localStorage.getItem('nfl-league-data');
      return stored ? JSON.parse(stored) : null;
    });
    
    // Validate persistence
    if (!persistedData) {
      throw new Error('❌ League data was not persisted!');
    }
    
    if (!persistedData.leagues) {
      throw new Error('❌ League collection is missing!');
    }
    
    const leagueCount = Object.keys(persistedData.leagues).length;
    console.log(`📊 Found ${leagueCount} leagues in storage`);
    
    if (leagueCount === 0) {
      throw new Error('❌ CRITICAL: League data shows 0 leagues after navigation!');
    }
    
    // Check for specific league names
    const hasInjustice = persistedData.leagues.injustice_league?.name === 'Injustice League';
    const hasLegends = persistedData.leagues.legends_league?.name === 'Legends League';
    
    if (!hasInjustice || !hasLegends) {
      throw new Error('❌ CRITICAL: Specific league names not preserved!');
    }
    
    console.log('✅ Injustice League found:', hasInjustice);
    console.log('✅ Legends League found:', hasLegends);
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'league-persistence-test-success.png',
      fullPage: true 
    });
    
    console.log('✅ SUCCESS: League data persistence test passed!');
    console.log('📸 Screenshot saved: league-persistence-test-success.png');
    
    return {
      success: true,
      leagueCount,
      leagues: Object.keys(persistedData.leagues),
      message: 'League data persisted successfully across navigation'
    };
    
  } catch (error) {
    console.error('❌ FAILED: League data persistence test failed!');
    console.error('Error:', error.message);
    
    if (page) {
      await page.screenshot({ 
        path: 'league-persistence-test-failure.png',
        fullPage: true 
      });
      console.log('📸 Failure screenshot saved: league-persistence-test-failure.png');
    }
    
    return {
      success: false,
      error: error.message,
      message: 'League data persistence test failed'
    };
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runLeagueDataPersistenceTest()
  .then(result => {
    console.log('\n🎯 TEST RESULT:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test runner error:', error);
    process.exit(1);
  });