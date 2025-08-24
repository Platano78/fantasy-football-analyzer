#!/usr/bin/env node

/**
 * NFL League Sync Implementation Validation
 * Tests key components and integration points for tomorrow's draft
 */

import fs from 'fs';
import path from 'path';

console.log('🏈 NFL League Sync Implementation Validation');
console.log('=' .repeat(50));

const components = [
  'src/types/NFLLeagueTypes.ts',
  'src/services/NFLLeagueService.ts', 
  'src/components/NFLLeagueSyncer.tsx',
  'src/components/LeagueSwitcher.tsx',
  'src/components/NFLDraftCoach.tsx',
  'src/components/ManualLeagueEntry.tsx',
  'src/views/NFLLeagueSyncView.tsx'
];

let allComponentsExist = true;

console.log('\n📁 Component Files:');
components.forEach(component => {
  const exists = fs.existsSync(path.join(process.cwd(), component));
  console.log(`${exists ? '✅' : '❌'} ${component}`);
  if (!exists) allComponentsExist = false;
});

console.log('\n🔧 Integration Points:');

// Check App.tsx integration
const appTsx = fs.readFileSync('src/App.tsx', 'utf8');
const hasNFLSyncView = appTsx.includes('NFLLeagueSyncView');
const hasNFLSyncNavigation = appTsx.includes("'nfl-sync'");
console.log(`${hasNFLSyncView ? '✅' : '❌'} NFLLeagueSyncView imported in App.tsx`);
console.log(`${hasNFLSyncNavigation ? '✅' : '❌'} NFL Sync navigation item in App.tsx`);

// Check views/index.ts integration  
const viewsIndex = fs.readFileSync('src/views/index.ts', 'utf8');
const hasViewExport = viewsIndex.includes('NFLLeagueSyncView');
console.log(`${hasViewExport ? '✅' : '❌'} NFLLeagueSyncView exported from views/index.ts`);

// Check types/index.ts integration
const typesIndex = fs.readFileSync('src/types/index.ts', 'utf8');
const hasNFLSyncType = typesIndex.includes('nfl-sync');
console.log(`${hasNFLSyncType ? '✅' : '❌'} 'nfl-sync' added to ViewType union`);

console.log('\n🤖 MCP Integration:');

// Check MCP imports
const nflLeagueService = fs.readFileSync('src/services/NFLLeagueService.ts', 'utf8');
const hasBrowserMCP = nflLeagueService.includes('mcp__playwright__');
console.log(`${hasBrowserMCP ? '✅' : '❌'} Browser MCP integration in NFLLeagueService`);

const nflSyncer = fs.readFileSync('src/components/NFLLeagueSyncer.tsx', 'utf8');  
const hasPlaywrightImport = nflSyncer.includes('mcp__playwright__');
console.log(`${hasPlaywrightImport ? '✅' : '❌'} Playwright MCP tools imported in NFLLeagueSyncer`);

console.log('\n🧠 AI Integration:');

// Check AI service integration
const draftCoach = fs.readFileSync('src/components/NFLDraftCoach.tsx', 'utf8');
const hasGeminiIntegration = draftCoach.includes('HybridAIService');
console.log(`${hasGeminiIntegration ? '✅' : '❌'} HybridAIService integration in NFLDraftCoach`);

console.log('\n📊 Summary:');
console.log(`${allComponentsExist ? '✅' : '❌'} All core components created`);
console.log(`${hasNFLSyncView && hasNFLSyncNavigation ? '✅' : '❌'} App.tsx integration complete`);
console.log(`${hasViewExport && hasNFLSyncType ? '✅' : '❌'} Type system integration complete`);
console.log(`${hasBrowserMCP && hasPlaywrightImport ? '✅' : '❌'} Browser MCP integration ready`);
console.log(`${hasGeminiIntegration ? '✅' : '❌'} AI coaching integration ready`);

const allTestsPassed = allComponentsExist && hasNFLSyncView && hasNFLSyncNavigation && 
                       hasViewExport && hasNFLSyncType && hasBrowserMCP && 
                       hasPlaywrightImport && hasGeminiIntegration;

console.log('\n🎯 DRAFT READINESS:');
console.log(`${allTestsPassed ? '🚀 READY FOR TOMORROW\'S DRAFT! 🏈' : '⚠️  Still needs attention before draft'}`);

if (!allTestsPassed) {
  console.log('\n❓ Issues to resolve:');
  if (!allComponentsExist) console.log('   - Missing component files');
  if (!hasNFLSyncView) console.log('   - NFLLeagueSyncView not imported in App.tsx');  
  if (!hasNFLSyncNavigation) console.log('   - NFL sync navigation missing from App.tsx');
  if (!hasViewExport) console.log('   - NFLLeagueSyncView not exported from views');
  if (!hasNFLSyncType) console.log('   - ViewType union missing nfl-sync');
  if (!hasBrowserMCP) console.log('   - Browser MCP integration incomplete');
  if (!hasGeminiIntegration) console.log('   - AI coaching integration incomplete');
}

console.log('\n' + '=' .repeat(50));