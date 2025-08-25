/**
 * Test the simplified URL-based league parser
 */

import { chromium } from 'playwright';

(async () => {
  console.log('🎯 Testing Simple URL-Based League Parser');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log('🌐 Loading Fantasy Football Analyzer...');
    await page.goto('https://fantasy-football-analyzer.netlify.app', { waitUntil: 'networkidle' });
    
    // Go to NFL League Sync
    console.log('📱 Opening NFL League Sync...');
    await page.click('button:has-text("NFL League Sync")');
    await page.waitForTimeout(3000);

    // Check if the simple interface loads
    const noLeaguesText = await page.locator('text=No Leagues Yet').isVisible();
    if (noLeaguesText) {
      console.log('✅ Simple interface loaded - showing "No Leagues Yet"');
    } else {
      console.log('❓ Different interface state');
    }

    // Test clicking "Add League" button
    console.log('🖱️  Testing Add League button...');
    const addLeagueBtn = await page.locator('button:has-text("Add League")').first();
    await addLeagueBtn.click();
    await page.waitForTimeout(2000);

    // Check if URL parser modal opens
    const urlModalTitle = await page.locator('h2:has-text("Add League by URL")').isVisible();
    if (urlModalTitle) {
      console.log('✅ URL parser modal opened successfully');

      // Check for URL input field
      const urlInput = await page.locator('input[placeholder*="https://fantasy.nfl.com"]').isVisible();
      if (urlInput) {
        console.log('✅ URL input field found');

        // Test with a sample URL
        console.log('📝 Testing with sample URL...');
        await page.fill('input[placeholder*="https://fantasy.nfl.com"]', 'https://fantasy.nfl.com/league/1234567');
        await page.waitForTimeout(1000);

        // Click Parse League
        const parseBtn = await page.locator('button:has-text("Parse League")');
        await parseBtn.click();
        await page.waitForTimeout(3000);

        // Check for success or error
        const successMsg = await page.locator('text=Successfully parsed league').isVisible();
        const errorMsg = await page.locator('text=Failed to parse league').isVisible();

        if (successMsg) {
          console.log('✅ League parsing succeeded');
          
          // Wait for modal to auto-close
          await page.waitForTimeout(3000);
          
          // Check if league appears in the list
          const leagueAdded = await page.locator('text=League 1234567').isVisible();
          if (leagueAdded) {
            console.log('✅ League successfully added to list');
          } else {
            console.log('❌ League not visible in list');
          }
          
        } else if (errorMsg) {
          console.log('⚠️  League parsing failed (expected with mock URL)');
        } else {
          console.log('❓ Unexpected parsing result');
        }

      } else {
        console.log('❌ URL input field not found');
      }

    } else {
      console.log('❌ URL parser modal did not open');
    }

    // Take final screenshot
    await page.screenshot({ path: 'simple-url-parser-test.png', fullPage: true });
    
    console.log('🎉 Simple URL parser test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'simple-url-parser-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();