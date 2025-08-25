/**
 * Test hardcoded leagues functionality
 */

import { chromium } from 'playwright';

(async () => {
  console.log('🏈 Testing Hardcoded Leagues - GAME DAY!');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Loading app...');
    await page.goto('https://fantasy-football-analyzer.netlify.app');
    
    console.log('📱 Opening NFL League Sync...');
    await page.click('button:has-text("NFL League Sync")');
    await page.waitForTimeout(3000);

    console.log('🖱️  Clicking Add League...');
    await page.locator('.bg-white.rounded-lg.shadow button:has-text("Add League")').first().click();
    await page.waitForTimeout(2000);

    console.log('🔍 Checking modal content...');
    const legendsLeague = await page.locator('text=Legends League (ID: 1602776)').isVisible();
    const injusticeLeague = await page.locator('text=Injustice League (ID: 6317063)').isVisible();
    
    if (legendsLeague && injusticeLeague) {
      console.log('✅ Both hardcoded leagues visible in modal');
    } else {
      console.log('❌ Hardcoded leagues not visible');
    }

    console.log('📝 Testing Legends League URL...');
    await page.fill('input[placeholder*="fantasy.nfl.com"]', 'https://fantasy.nfl.com/league/1602776');
    await page.waitForTimeout(1000);
    
    console.log('🔄 Parsing Legends League...');
    await page.click('button:has-text("Parse League")');
    await page.waitForTimeout(4000);

    // Check if modal auto-closed (success) or if there's an error
    const modalStillOpen = await page.locator('h2:has-text("Add League by URL")').isVisible();
    
    if (!modalStillOpen) {
      console.log('✅ Legends League parsed successfully (modal auto-closed)');
      
      // Check if league appears in the list
      await page.waitForTimeout(2000);
      const legendsInList = await page.locator('text=Legends League').isVisible();
      if (legendsInList) {
        console.log('✅ Legends League appears in Your Leagues list!');
      } else {
        console.log('❌ Legends League not visible in list');
      }
      
      // Test adding the second league
      console.log('🖱️  Adding second league...');
      await page.locator('.bg-white.rounded-lg.shadow button:has-text("Add League")').first().click();
      await page.waitForTimeout(2000);
      
      console.log('📝 Testing Injustice League URL...');
      await page.fill('input[placeholder*="fantasy.nfl.com"]', 'https://fantasy.nfl.com/league/6317063');
      await page.waitForTimeout(1000);
      
      console.log('🔄 Parsing Injustice League...');
      await page.click('button:has-text("Parse League")');
      await page.waitForTimeout(4000);
      
      const secondModalClosed = await page.locator('h2:has-text("Add League by URL")').isVisible();
      if (!secondModalClosed) {
        console.log('✅ Injustice League parsed successfully');
        
        await page.waitForTimeout(2000);
        const injusticeInList = await page.locator('text=Injustice League').isVisible();
        if (injusticeInList) {
          console.log('✅ Injustice League appears in Your Leagues list!');
          
          // Check both leagues are visible
          const bothLeagues = await page.locator('text=Legends League').isVisible() && 
                              await page.locator('text=Injustice League').isVisible();
          if (bothLeagues) {
            console.log('🎉 BOTH LEAGUES SUCCESSFULLY ADDED!');
          }
        }
      }
      
    } else {
      console.log('❌ Modal still open - check for error message');
      const errorVisible = await page.locator('text=Failed to parse').isVisible();
      if (errorVisible) {
        const errorText = await page.locator('[class*="text-red"]').textContent();
        console.log('Error:', errorText);
      }
    }

    await page.screenshot({ path: 'hardcoded-leagues-final.png', fullPage: true });
    console.log('🎯 Test completed - Game Day Ready!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'hardcoded-leagues-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();