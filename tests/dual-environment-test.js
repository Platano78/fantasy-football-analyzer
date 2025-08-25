/**
 * Test dual-environment support (Browser MCP + Claude Desktop)
 */

import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Testing Dual-Environment Support...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the Fantasy Football Analyzer
    console.log('🌐 Navigating to Fantasy Football Analyzer...');
    await page.goto('https://fantasy-football-analyzer.netlify.app');
    await page.waitForSelector('header h1', { timeout: 10000 });
    
    // Navigate to NFL League Sync
    console.log('📱 Clicking NFL League Sync...');
    await page.click('button:has-text("NFL League Sync")');
    await page.waitForTimeout(2000);

    // Take screenshot for verification
    await page.screenshot({ path: 'dual-environment-test-initial.png', fullPage: true });

    // Check for dual-environment interface elements
    console.log('🔍 Checking for dual-environment UI elements...');

    // Should see environment status section
    const environmentStatus = await page.locator('text=NFL League Sync - Dual Environment').first();
    if (await environmentStatus.isVisible()) {
      console.log('✅ Dual-environment header found');
    } else {
      console.log('❌ Dual-environment header not found');
    }

    // Should see environment description
    const environmentDesc = await page.locator('text=Manual Entry Mode, text=Browser MCP Active').first();
    if (await environmentDesc.isVisible()) {
      console.log('✅ Environment description found');
    }

    // Check for manual entry button (should always be visible)
    const manualEntryBtn = await page.locator('button:has-text("Manual Entry")');
    if (await manualEntryBtn.isVisible()) {
      console.log('✅ Manual Entry button found');
    } else {
      console.log('❌ Manual Entry button not found');
    }

    // Test manual entry interface
    console.log('🖱️  Testing Manual Entry interface...');
    await manualEntryBtn.click();
    await page.waitForTimeout(1000);

    // Should see manual entry modal
    const modalTitle = await page.locator('h2:has-text("Manual League Entry")');
    if (await modalTitle.isVisible()) {
      console.log('✅ Manual Entry modal opened');

      // Check for instruction sections
      const instructions = await page.locator('text=Claude Desktop Manual Entry');
      if (await instructions.isVisible()) {
        console.log('✅ Manual entry instructions found');
      }

      // Check for sample JSON format
      const sampleJson = await page.locator('text=Sample JSON Format');
      if (await sampleJson.isVisible()) {
        console.log('✅ Sample JSON format section found');
      }

      // Check for textarea input
      const textarea = await page.locator('textarea[placeholder*="Paste your league data JSON"]');
      if (await textarea.isVisible()) {
        console.log('✅ JSON input textarea found');
      }

      // Test with sample data
      console.log('📝 Testing with sample league data...');
      const sampleData = {
        "6317063": {
          "id": "6317063",
          "name": "Test League",
          "size": 12,
          "scoringType": "PPR",
          "draftStatus": "completed",
          "currentWeek": 1,
          "season": "2024",
          "teams": {
            "1": {
              "id": "1",
              "name": "Team Alpha",
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

      // Fill the textarea with sample data
      await textarea.fill(JSON.stringify(sampleData, null, 2));
      await page.waitForTimeout(1000);

      // Click Import Leagues button
      const importBtn = await page.locator('button:has-text("Import Leagues")');
      if (await importBtn.isVisible()) {
        console.log('✅ Import Leagues button found');
        await importBtn.click();
        await page.waitForTimeout(2000);

        // Check for success message or league display
        const successMessage = await page.locator('text=Successfully imported, text=✅').first();
        if (await successMessage.isVisible()) {
          console.log('✅ League data imported successfully');
        }

        // Close the modal by clicking the X button
        const closeBtn = await page.locator('button:has(svg):has(path[d*="M6 18L18 6M6 6l12 12"])').first();
        if (await closeBtn.isVisible()) {
          console.log('🚪 Closing manual entry modal...');
          await closeBtn.click();
          await page.waitForTimeout(2000);
          
          // Verify modal is closed
          const modalClosed = await page.locator('h2:has-text("Manual League Entry")').isVisible();
          if (!modalClosed) {
            console.log('✅ Modal closed successfully');
          }
        } else {
          // Try pressing Escape key as fallback
          console.log('🔑 Trying Escape key to close modal...');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(2000);
        }

        // Check if league appears in Current Leagues section
        const currentLeagues = await page.locator('text=Current Leagues');
        if (await currentLeagues.isVisible()) {
          console.log('✅ Current Leagues section found');
          
          const testLeague = await page.locator('text=Test League');
          if (await testLeague.isVisible()) {
            console.log('✅ Test League appears in Current Leagues');
          }
        }
      }
    } else {
      console.log('❌ Manual Entry modal not opened');
    }

    // Test persistence by navigating away and back
    console.log('🔄 Testing league persistence...');
    await page.click('button:has-text("Draft Board")');
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("NFL League Sync")');
    await page.waitForTimeout(2000);

    // Check if league data persisted
    const persistedLeague = await page.locator('text=Test League');
    if (await persistedLeague.isVisible()) {
      console.log('✅ League data persisted across navigation');
    } else {
      console.log('❌ League data did not persist');
    }

    // Take final screenshot
    await page.screenshot({ path: 'dual-environment-test-final.png', fullPage: true });

    console.log('🎉 Dual-environment test completed!');
    console.log('📸 Screenshots saved: dual-environment-test-initial.png, dual-environment-test-final.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'dual-environment-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();