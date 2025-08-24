#!/usr/bin/env node

/**
 * Test Suite Validation Script
 * 
 * Validates the Playwright test configuration and ensures all test files
 * are properly structured and can be discovered by the test runner.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration validation
function validateTestConfiguration() {
  console.log('🔍 Validating test configuration...');
  
  const configPath = resolve(__dirname, 'playwright.config.ts');
  if (!existsSync(configPath)) {
    throw new Error('❌ playwright.config.ts not found');
  }
  
  const config = readFileSync(configPath, 'utf8');
  
  // Check for essential configuration elements
  const requiredElements = [
    'testDir: \'./tests/playwright\'',
    'projects:',
    'webServer:',
    'globalSetup:',
    'globalTeardown:',
  ];
  
  for (const element of requiredElements) {
    if (!config.includes(element.replace(/'/g, '"')) && !config.includes(element)) {
      console.warn(`⚠️  Configuration element might be missing: ${element}`);
    }
  }
  
  console.log('✅ Test configuration validated');
  return true;
}

// Test file validation
function validateTestFiles() {
  console.log('🔍 Validating test files...');
  
  const testFiles = [
    'tests/playwright/espn-api.spec.ts',
    'tests/playwright/browser-mcp.spec.ts',
    'tests/playwright/ai-coach.spec.ts',
    'tests/playwright/integration.spec.ts',
    'tests/playwright/error-recovery.spec.ts',
    'tests/playwright/mobile.spec.ts',
  ];
  
  let validFiles = 0;
  
  for (const testFile of testFiles) {
    const fullPath = resolve(__dirname, testFile);
    if (!existsSync(fullPath)) {
      console.error(`❌ Test file not found: ${testFile}`);
      continue;
    }
    
    const content = readFileSync(fullPath, 'utf8');
    
    // Check for essential test structure
    const requiredPatterns = [
      /test\.describe\(/,
      /test\(/,
      /expect\(/,
      /@playwright\/test/,
    ];
    
    let fileValid = true;
    for (const pattern of requiredPatterns) {
      if (!pattern.test(content)) {
        console.warn(`⚠️  ${testFile}: Missing pattern ${pattern}`);
        fileValid = false;
      }
    }
    
    if (fileValid) {
      validFiles++;
      console.log(`✅ ${testFile}: Valid`);
    }
  }
  
  console.log(`📊 Valid test files: ${validFiles}/${testFiles.length}`);
  return validFiles === testFiles.length;
}

// Test fixtures validation
function validateTestFixtures() {
  console.log('🔍 Validating test fixtures...');
  
  const fixtureFiles = [
    'tests/fixtures/test-data.ts',
    'tests/fixtures/mock-responses.ts',
    'tests/setup/global-setup.ts',
    'tests/setup/global-teardown.ts',
    'tests/setup/test-helpers.ts',
  ];
  
  let validFixtures = 0;
  
  for (const fixtureFile of fixtureFiles) {
    const fullPath = resolve(__dirname, fixtureFile);
    if (!existsSync(fullPath)) {
      console.error(`❌ Fixture file not found: ${fixtureFile}`);
      continue;
    }
    
    const content = readFileSync(fullPath, 'utf8');
    
    // Basic validation - ensure files have exports
    if (content.includes('export')) {
      validFixtures++;
      console.log(`✅ ${fixtureFile}: Valid`);
    } else {
      console.warn(`⚠️  ${fixtureFile}: No exports found`);
    }
  }
  
  console.log(`📊 Valid fixture files: ${validFixtures}/${fixtureFiles.length}`);
  return validFixtures === fixtureFiles.length;
}

// Package.json validation
function validatePackageJson() {
  console.log('🔍 Validating package.json scripts...');
  
  const packagePath = resolve(__dirname, 'package.json');
  if (!existsSync(packagePath)) {
    throw new Error('❌ package.json not found');
  }
  
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  
  const requiredScripts = [
    'test:e2e',
    'test:e2e:ui',
    'test:e2e:headed',
    'test:e2e:debug',
    'test:e2e:report',
    'test:e2e:install',
    'test:e2e:mobile',
    'test:e2e:desktop',
    'test:e2e:ci',
  ];
  
  let validScripts = 0;
  
  for (const script of requiredScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      validScripts++;
      console.log(`✅ Script '${script}': ${packageJson.scripts[script]}`);
    } else {
      console.error(`❌ Missing script: ${script}`);
    }
  }
  
  // Check dependencies
  const hasPW = packageJson.dependencies && packageJson.dependencies['@playwright/test'];
  const hasPWCore = packageJson.devDependencies && packageJson.devDependencies['playwright-core'];
  const hasAxe = packageJson.devDependencies && packageJson.devDependencies['@axe-core/playwright'];
  
  if (hasPW) {
    console.log('✅ @playwright/test dependency found');
  } else {
    console.error('❌ @playwright/test dependency missing');
  }
  
  if (hasPWCore) {
    console.log('✅ playwright-core dev dependency found');
  }
  
  if (hasAxe) {
    console.log('✅ @axe-core/playwright accessibility testing found');
  }
  
  console.log(`📊 Valid scripts: ${validScripts}/${requiredScripts.length}`);
  return validScripts === requiredScripts.length;
}

// CI/CD validation
function validateCIConfig() {
  console.log('🔍 Validating CI/CD configuration...');
  
  const workflowPath = resolve(__dirname, '.github/workflows/playwright-tests.yml');
  if (!existsSync(workflowPath)) {
    console.warn('⚠️  GitHub Actions workflow not found');
    return false;
  }
  
  const workflow = readFileSync(workflowPath, 'utf8');
  
  const requiredSteps = [
    'playwright install',
    'npm run test:e2e:ci',
    'upload-artifact',
  ];
  
  let validSteps = 0;
  for (const step of requiredSteps) {
    if (workflow.includes(step)) {
      validSteps++;
      console.log(`✅ CI step found: ${step}`);
    } else {
      console.warn(`⚠️  CI step might be missing: ${step}`);
    }
  }
  
  console.log(`📊 Valid CI steps: ${validSteps}/${requiredSteps.length}`);
  return validSteps >= 2; // Allow some flexibility
}

// Test count validation
function validateTestCoverage() {
  console.log('🔍 Validating test coverage...');
  
  const testFiles = [
    'tests/playwright/espn-api.spec.ts',
    'tests/playwright/browser-mcp.spec.ts', 
    'tests/playwright/ai-coach.spec.ts',
    'tests/playwright/integration.spec.ts',
    'tests/playwright/error-recovery.spec.ts',
    'tests/playwright/mobile.spec.ts',
  ];
  
  let totalTests = 0;
  let totalDescribeBlocks = 0;
  
  for (const testFile of testFiles) {
    const fullPath = resolve(__dirname, testFile);
    if (!existsSync(fullPath)) continue;
    
    const content = readFileSync(fullPath, 'utf8');
    
    // Count test cases
    const testMatches = content.match(/test\(/g) || [];
    const describeMatches = content.match(/test\.describe\(/g) || [];
    
    totalTests += testMatches.length;
    totalDescribeBlocks += describeMatches.length;
    
    console.log(`📋 ${testFile}: ${testMatches.length} tests, ${describeMatches.length} describe blocks`);
  }
  
  console.log(`📊 Total test coverage: ${totalTests} tests across ${totalDescribeBlocks} test suites`);
  
  // Validate we have comprehensive coverage
  const expectedMinTests = 60; // Minimum expected test count
  const hasGoodCoverage = totalTests >= expectedMinTests;
  
  if (hasGoodCoverage) {
    console.log('✅ Test coverage appears comprehensive');
  } else {
    console.warn(`⚠️  Test coverage might be low (${totalTests} < ${expectedMinTests})`);
  }
  
  return hasGoodCoverage;
}

// Generate validation report
function generateValidationReport(results) {
  console.log('\n📋 VALIDATION REPORT');
  console.log('=' .repeat(50));
  
  const testSections = [
    { name: 'Test Configuration', passed: results.config },
    { name: 'Test Files', passed: results.files },
    { name: 'Test Fixtures', passed: results.fixtures },
    { name: 'Package Scripts', passed: results.package },
    { name: 'CI/CD Setup', passed: results.ci },
    { name: 'Test Coverage', passed: results.coverage },
  ];
  
  let passedSections = 0;
  
  for (const section of testSections) {
    const status = section.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${section.name}`);
    if (section.passed) passedSections++;
  }
  
  console.log('=' .repeat(50));
  console.log(`📊 Overall: ${passedSections}/${testSections.length} sections passed`);
  
  if (passedSections === testSections.length) {
    console.log('🎉 All validations passed! Test suite is ready.');
    return true;
  } else {
    console.log('⚠️  Some validations failed. Please review the issues above.');
    return false;
  }
}

// Main validation function
async function main() {
  console.log('🚀 Starting Playwright Test Suite Validation...\n');
  
  try {
    const results = {
      config: validateTestConfiguration(),
      files: validateTestFiles(),
      fixtures: validateTestFixtures(),
      package: validatePackageJson(),
      ci: validateCIConfig(),
      coverage: validateTestCoverage(),
    };
    
    const overallSuccess = generateValidationReport(results);
    
    if (overallSuccess) {
      console.log('\n🎯 Next steps:');
      console.log('1. Run: npm run test:e2e:install');
      console.log('2. Run: npm run test:e2e');
      console.log('3. Check: npm run test:e2e:report');
      
      process.exit(0);
    } else {
      console.log('\n🔧 Recommended actions:');
      console.log('1. Review and fix the validation errors above');
      console.log('2. Re-run this validation script');
      console.log('3. Test with: npm run test:e2e');
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Validation failed with error:', error.message);
    process.exit(1);
  }
}

// Run the validation
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}