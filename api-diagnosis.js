import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function diagnoseLiveSiteAPI() {
  console.log('🚨 CRITICAL MISSION: Diagnosing live site API failures for tomorrow\'s draft!');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture all network requests
  const failedRequests = [];
  const successfulRequests = [];
  const consoleErrors = [];
  
  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  // Monitor network requests
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('api') || url.includes('espn') || url.includes('sleeper') || url.includes('fantasy')) {
      const requestInfo = {
        url,
        status,
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: new Date().toISOString()
      };
      
      if (status >= 400) {
        failedRequests.push(requestInfo);
        console.log(`❌ API FAILED: ${status} ${url}`);
      } else {
        successfulRequests.push(requestInfo);
        console.log(`✅ API SUCCESS: ${status} ${url}`);
      }
    }
  });

  try {
    console.log('📡 Navigating to live site...');
    await page.goto('https://fantasy-football-analyzer.netlify.app', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ 
      path: '/home/platano/project/fantasy-football-analyzer/test-results/live-site-initial.png',
      fullPage: true 
    });
    
    // Wait for app to load
    await page.waitForTimeout(3000);
    
    // Check for any immediate errors in console
    console.log('\n🔍 CONSOLE ERRORS DETECTED:');
    console.log(JSON.stringify(consoleErrors, null, 2));
    
    // Try to navigate to different sections that use APIs
    console.log('\n🧭 Testing navigation to API-heavy sections...');
    
    // Test Draft view (likely uses player data APIs)
    try {
      await page.click('text=Draft', { timeout: 5000 });
      console.log('✅ Navigated to Draft view');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: '/home/platano/project/fantasy-football-analyzer/test-results/draft-view.png',
        fullPage: true 
      });
    } catch (error) {
      console.log('❌ Failed to navigate to Draft view:', error.message);
    }
    
    // Test Rankings view  
    try {
      await page.click('text=Rankings', { timeout: 5000 });
      console.log('✅ Navigated to Rankings view');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: '/home/platano/project/fantasy-football-analyzer/test-results/rankings-view.png',
        fullPage: true 
      });
    } catch (error) {
      console.log('❌ Failed to navigate to Rankings view:', error.message);
    }
    
    // Check if player data is loading
    try {
      const playerElements = await page.$$('[data-testid*="player"], .player-card, .player-row');
      console.log(`📊 Found ${playerElements.length} player elements`);
      
      if (playerElements.length === 0) {
        console.log('⚠️ NO PLAYER DATA ELEMENTS FOUND - API likely failing');
      }
    } catch (error) {
      console.log('❌ Error checking player elements:', error.message);
    }
    
    // Manually test API endpoints in browser
    console.log('\n🔬 Testing API endpoints manually...');
    
    const apiEndpoints = [
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes',
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
      'https://api.sleeper.app/v1/players/nfl',
      'https://fantasy-football-analyzer.netlify.app/api/espn/athletes',
      'https://fantasy-football-analyzer.netlify.app/api/espn/teams',
      'https://fantasy-football-analyzer.netlify.app/api/sleeper/players/nfl'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`\n🔍 Testing: ${endpoint}`);
        
        const response = await page.evaluate(async (url) => {
          try {
            const response = await fetch(url);
            return {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              ok: response.ok,
              url: response.url
            };
          } catch (error) {
            return {
              error: error.message,
              url
            };
          }
        }, endpoint);
        
        if (response.error) {
          console.log(`❌ FETCH ERROR: ${response.error}`);
        } else {
          console.log(`📡 Response: ${response.status} ${response.statusText}`);
          console.log(`🔗 Final URL: ${response.url}`);
          if (!response.ok) {
            console.log(`❌ FAILED: ${response.status}`);
          } else {
            console.log(`✅ SUCCESS: ${response.status}`);
          }
        }
      } catch (error) {
        console.log(`❌ Error testing ${endpoint}:`, error.message);
      }
    }
    
    // Check network tab final state
    await page.waitForTimeout(2000);
    
    console.log('\n📊 FINAL NETWORK ANALYSIS:');
    console.log(`✅ Successful API requests: ${successfulRequests.length}`);
    console.log(`❌ Failed API requests: ${failedRequests.length}`);
    console.log(`🐛 Console errors: ${consoleErrors.length}`);
    
  } catch (error) {
    console.error('❌ Critical error during diagnosis:', error);
    
    await page.screenshot({ 
      path: '/home/platano/project/fantasy-football-analyzer/test-results/error-state.png',
      fullPage: true 
    });
  }
  
  // Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    url: 'https://fantasy-football-analyzer.netlify.app',
    summary: {
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      consoleErrors: consoleErrors.length,
      criticalIssues: failedRequests.filter(r => r.status === 404 || r.status === 0).length
    },
    failedRequests,
    successfulRequests,
    consoleErrors,
    recommendations: []
  };
  
  // Add recommendations based on findings
  if (failedRequests.length > 0) {
    report.recommendations.push('API endpoints are failing - check proxy configuration in netlify.toml');
    
    const corsErrors = failedRequests.filter(r => 
      r.url.includes('espn.com') && !r.url.includes('fantasy-football-analyzer.netlify.app')
    );
    
    if (corsErrors.length > 0) {
      report.recommendations.push('Direct ESPN API calls detected - these will fail due to CORS. Use Netlify proxy instead.');
    }
  }
  
  if (consoleErrors.length > 0) {
    report.recommendations.push('Console errors detected - check browser dev tools for details');
  }
  
  if (successfulRequests.some(r => r.url.includes('sleeper'))) {
    report.recommendations.push('✅ Sleeper API is working - focus on using this for player data');
  }
  
  // Save detailed report
  const reportPath = '/home/platano/project/fantasy-football-analyzer/test-results/api-diagnosis-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n' + '='.repeat(80));
  console.log('🚨 CRITICAL DIAGNOSIS COMPLETE');
  console.log('='.repeat(80));
  console.log(`📊 SUMMARY FOR TOMORROW'S DRAFT:`);
  console.log(`   ✅ Successful API requests: ${successfulRequests.length}`);
  console.log(`   ❌ Failed API requests: ${failedRequests.length}`);
  console.log(`   🐛 Console errors: ${consoleErrors.length}`);
  console.log(`   📄 Full report saved to: ${reportPath}`);
  
  if (failedRequests.length > 0) {
    console.log('\n🆘 URGENT ACTION NEEDED:');
    failedRequests.forEach(req => {
      console.log(`   ❌ ${req.status} ${req.url}`);
    });
  }
  
  if (successfulRequests.length > 0) {
    console.log('\n✅ WORKING ENDPOINTS:');
    successfulRequests.forEach(req => {
      console.log(`   ✅ ${req.status} ${req.url}`);
    });
  }
  
  console.log('\n🎯 IMMEDIATE RECOMMENDATIONS:');
  report.recommendations.forEach(rec => {
    console.log(`   📌 ${rec}`);
  });
  
  await browser.close();
  return report;
}

// Run the diagnosis
diagnoseLiveSiteAPI()
  .then(report => {
    console.log('\n🔬 Diagnosis complete - check screenshots and report for details');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  });