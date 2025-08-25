/**
 * Debug league storage and display
 */

import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Debug League Storage & Display');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console logs to catch any errors
  page.on('console', msg => {
    if (msg.type() === 'log' && (msg.text().includes('League') || msg.text().includes('league'))) {
      console.log(`BROWSER LOG: ${msg.text()}`);
    }
  });

  try {
    console.log('🌐 Loading app with console monitoring...');
    await page.goto('https://fantasy-football-analyzer.netlify.app');
    
    console.log('📱 Opening NFL League Sync...');
    await page.click('button:has-text("NFL League Sync")');
    await page.waitForTimeout(3000);

    console.log('🖱️  Clicking Add League...');
    await page.click('.bg-white.rounded-lg.shadow button:has-text("Add League")');
    await page.waitForTimeout(2000);

    console.log('📝 Adding Legends League...');
    await page.fill('input[placeholder*="fantasy.nfl.com"]', 'https://fantasy.nfl.com/league/1602776');
    await page.click('button:has-text("Parse League")');
    await page.waitForTimeout(4000);

    // Check localStorage after adding league
    const leagueData = await page.evaluate(() => {
      const data = localStorage.getItem('nfl-league-collection');
      console.log('localStorage data:', data);
      return data;
    });
    
    console.log('📦 localStorage contains:', leagueData ? 'DATA FOUND' : 'NO DATA');
    
    // Check if React component state has leagues
    const hasLeaguesInState = await page.evaluate(() => {
      // Try to find any element that would indicate leagues are in state
      const yourLeaguesSection = document.querySelector('h3:contains("Your Leagues")');
      const leagueCards = document.querySelectorAll('.space-y-4 > div');
      console.log('League cards found:', leagueCards.length);
      return leagueCards.length > 0;
    });

    console.log('🔍 React state has leagues:', hasLeaguesInState ? 'YES' : 'NO');

    // Take screenshot for visual verification
    await page.screenshot({ path: 'debug-league-storage.png', fullPage: true });
    
    console.log('🎯 Debug complete - check console logs above');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
})();