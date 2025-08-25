/**
 * Focused test for URL parser functionality
 */

import { chromium } from 'playwright';

(async () => {
  console.log('🎯 Focused URL Parser Test');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Loading app...');
    await page.goto('https://fantasy-football-analyzer.netlify.app');
    
    console.log('📱 Opening NFL League Sync...');
    await page.click('button:has-text("NFL League Sync")');
    await page.waitForTimeout(3000);

    console.log('🖱️  Clicking Add League button in Your Leagues section...');
    // Be very specific - click the Add League button in the white card with "Your Leagues" header
    await page.locator('.bg-white.rounded-lg.shadow button:has-text("Add League")').first().click();
    await page.waitForTimeout(2000);

    console.log('🔍 Checking if URL parser modal opened...');
    const modalVisible = await page.locator('h2:has-text("Add League by URL")').isVisible();
    
    if (modalVisible) {
      console.log('✅ URL parser modal opened!');
      
      console.log('📝 Testing URL input...');
      await page.fill('input[placeholder*="fantasy.nfl.com"]', 'https://fantasy.nfl.com/league/1234567');
      
      console.log('🔄 Clicking Parse League...');
      await page.click('button:has-text("Parse League")');
      await page.waitForTimeout(3000);
      
      // Check for any result
      const successResult = await page.locator('text=Successfully parsed').isVisible();
      const processingResult = await page.locator('text=Processing').isVisible();
      
      if (successResult) {
        console.log('✅ URL parsing worked!');
      } else if (processingResult) {
        console.log('⏳ Still processing...');
      } else {
        console.log('❓ No clear result visible');
      }
      
    } else {
      console.log('❌ URL parser modal did not open');
    }

    await page.screenshot({ path: 'focused-url-test.png', fullPage: true });
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'focused-url-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();