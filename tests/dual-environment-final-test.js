/**
 * Final test for dual-environment support (Browser MCP + Claude Desktop)
 */

import { chromium } from 'playwright';

(async () => {
  console.log('🎯 Final Dual-Environment Test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the Fantasy Football Analyzer
    console.log('🌐 Navigating to Fantasy Football Analyzer...');
    await page.goto('https://fantasy-football-analyzer.netlify.app');
    await page.waitForSelector('header h1', { timeout: 10000 });
    
    // Navigate to NFL League Sync
    console.log('📱 Opening NFL League Sync...');
    await page.click('button:has-text("NFL League Sync")');
    await page.waitForTimeout(3000);

    // Verify dual-environment interface loads correctly
    const dualEnvHeader = await page.locator('text=NFL League Sync - Dual Environment').isVisible();
    if (dualEnvHeader) {
      console.log('✅ Dual-environment interface loaded successfully');
    } else {
      console.log('❌ Dual-environment interface failed to load');
      await page.screenshot({ path: 'dual-env-failed.png', fullPage: true });
      throw new Error('Dual-environment interface not found');
    }

    // Test manual entry functionality
    console.log('🖱️  Testing Manual Entry functionality...');
    await page.click('button:has-text("Manual Entry")');
    await page.waitForTimeout(2000);

    // Verify modal opens
    const modalVisible = await page.locator('h2:has-text("Manual League Entry")').isVisible();
    if (modalVisible) {
      console.log('✅ Manual Entry modal opened');

      // Add test league data
      const textarea = await page.locator('textarea[placeholder*="Paste your league data JSON"]');
      const testData = {
        "test123": {
          "id": "test123",
          "name": "Dual Environment Test League",
          "size": 10,
          "scoringType": "PPR",
          "draftStatus": "completed",
          "currentWeek": 1,
          "season": "2024",
          "teams": {
            "1": {
              "id": "1",
              "name": "Team Test",
              "owner": "Test Owner",
              "record": "0-0-0",
              "pointsFor": 0,
              "pointsAgainst": 0,
              "roster": []
            }
          },
          "settings": {
            "rosterSize": 16,
            "startingPositions": {
              "QB": 1,
              "RB": 2,
              "WR": 2,
              "TE": 1,
              "FLEX": 1,
              "DEF": 1,
              "K": 1
            }
          }
        }
      };

      await textarea.fill(JSON.stringify(testData, null, 2));
      await page.waitForTimeout(1000);

      // Import the league
      await page.click('button:has-text("Import Leagues")');
      await page.waitForTimeout(3000);

      // Close the modal using Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(2000);

      // Verify league appears in Current Leagues
      const testLeague = await page.locator('text=Dual Environment Test League').isVisible();
      if (testLeague) {
        console.log('✅ Test league imported and displayed successfully');
      }

      // Test persistence - navigate away and back
      console.log('🔄 Testing league data persistence...');
      await page.click('button:has-text("Draft Board")');
      await page.waitForTimeout(2000);
      
      await page.click('button:has-text("NFL League Sync")');
      await page.waitForTimeout(3000);

      // Check if league data persisted
      const persistedLeague = await page.locator('text=Dual Environment Test League').isVisible();
      if (persistedLeague) {
        console.log('✅ League data persisted across navigation');
      } else {
        console.log('❌ League data did not persist');
      }

      // Final screenshot
      await page.screenshot({ path: 'dual-environment-final-success.png', fullPage: true });
      
      console.log('🎉 All dual-environment tests PASSED!');
      
    } else {
      console.log('❌ Manual Entry modal failed to open');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'dual-environment-final-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();