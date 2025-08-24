/**
 * Global Test Setup for Fantasy Football Analyzer
 * 
 * Handles test environment preparation, service initialization,
 * and database/service setup before running tests.
 */

import { FullConfig, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🚀 Starting Fantasy Football Analyzer test environment setup...');
  
  try {
    // Create test directories
    await createTestDirectories();
    
    // Set up test data and fixtures
    await setupTestData();
    
    // Initialize services (if needed)
    await initializeTestServices();
    
    // Warm up browser for faster test execution
    if (!process.env.CI) {
      await warmupBrowser();
    }
    
    // Set up performance monitoring
    await setupPerformanceMonitoring();
    
    console.log('✅ Global test setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
}

/**
 * Create necessary test directories
 */
async function createTestDirectories(): Promise<void> {
  const directories = [
    'test-results',
    'test-results/artifacts',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
    'test-results/reports',
    'test-results/performance',
    'test-results/coverage',
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    } catch (error) {
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

/**
 * Set up test data and environment variables
 */
async function setupTestData(): Promise<void> {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.VITE_TEST_MODE = 'true';
  
  // Configure API endpoints for testing
  process.env.VITE_ESPN_API_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
  process.env.VITE_LOCAL_GEMINI_URL = 'http://localhost:3001';
  process.env.VITE_CLOUD_GEMINI_URL = '/.netlify/functions';
  
  // Mock data configuration
  process.env.VITE_USE_MOCK_DATA = 'false'; // Use real APIs by default, override in specific tests
  process.env.VITE_MOCK_AI_RESPONSES = 'false';
  process.env.VITE_MOCK_BROWSER_MCP = 'false';
  
  // Performance testing configuration
  process.env.VITE_PERFORMANCE_MONITORING = 'true';
  process.env.VITE_ERROR_REPORTING = 'false'; // Don't send errors during tests
  
  console.log('⚙️  Test environment variables configured');
}

/**
 * Initialize test services and dependencies
 */
async function initializeTestServices(): Promise<void> {
  // Check if Local Gemini Advanced Bridge is running
  try {
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      console.log('🟢 Local Gemini Advanced Bridge detected and available');
      process.env.LOCAL_GEMINI_AVAILABLE = 'true';
    } else {
      console.log('🟡 Local Gemini Advanced Bridge not responding, tests will use fallback');
      process.env.LOCAL_GEMINI_AVAILABLE = 'false';
    }
  } catch (error) {
    console.log('🟡 Local Gemini Advanced Bridge not available, tests will use fallback');
    process.env.LOCAL_GEMINI_AVAILABLE = 'false';
  }

  // Validate external dependencies
  await validateExternalDependencies();
  
  // Set up test databases or storage if needed
  await setupTestStorage();
  
  console.log('🔧 Test services initialized');
}

/**
 * Validate external dependencies and APIs
 */
async function validateExternalDependencies(): Promise<void> {
  const dependencies = [
    {
      name: 'ESPN API',
      url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
      timeout: 10000,
    },
  ];

  for (const dep of dependencies) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), dep.timeout);
      
      const response = await fetch(dep.url, { 
        signal: controller.signal,
        method: 'HEAD', // Use HEAD to avoid downloading large responses
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        console.log(`✅ ${dep.name} is accessible`);
      } else {
        console.log(`⚠️  ${dep.name} returned status ${response.status}, tests may use mocks`);
      }
    } catch (error) {
      console.log(`⚠️  ${dep.name} is not accessible, tests will use mocks`);
    }
  }
}

/**
 * Set up test storage and caching
 */
async function setupTestStorage(): Promise<void> {
  // Create test-specific cache directory
  const testCacheDir = path.join(process.cwd(), '.test-cache');
  
  try {
    await fs.mkdir(testCacheDir, { recursive: true });
    process.env.TEST_CACHE_DIR = testCacheDir;
    console.log('💾 Test storage configured');
  } catch (error) {
    console.warn('⚠️  Could not create test cache directory:', error);
  }
}

/**
 * Warm up browser for faster test execution
 */
async function warmupBrowser(): Promise<void> {
  console.log('🔥 Warming up browser...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to a simple page to initialize browser components
  await page.goto('data:text/html,<html><head><title>Warmup</title></head><body>Browser Warmup</body></html>');
  await page.waitForTimeout(1000);
  
  await browser.close();
  
  console.log('🔥 Browser warmup completed');
}

/**
 * Set up performance monitoring for tests
 */
async function setupPerformanceMonitoring(): Promise<void> {
  // Create performance baseline file
  const performanceBaseline = {
    pageLoad: 3000, // 3 seconds
    draftBoardRender: 2000, // 2 seconds
    playerSearch: 500, // 500ms
    aiResponse: 10000, // 10 seconds
    apiCall: 5000, // 5 seconds
    cacheHit: 100, // 100ms
    memoryUsage: 100, // 100MB
    networkRequests: 20, // Max requests per page
    updatedAt: new Date().toISOString(),
  };

  const baselineFile = path.join(process.cwd(), 'test-results', 'performance-baseline.json');
  
  try {
    await fs.writeFile(baselineFile, JSON.stringify(performanceBaseline, null, 2));
    console.log('📊 Performance monitoring baseline created');
  } catch (error) {
    console.warn('⚠️  Could not create performance baseline:', error);
  }
}

/**
 * Create test report template
 */
async function createTestReportTemplate(): Promise<void> {
  const reportTemplate = {
    testRun: {
      startTime: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI,
        browser: 'multiple',
      },
      configuration: {
        timeout: 60000,
        retries: process.env.CI ? 3 : 1,
        workers: process.env.CI ? 2 : 'auto',
      },
    },
    results: {
      espnApiTests: { status: 'pending', duration: 0, tests: [] },
      browserMcpTests: { status: 'pending', duration: 0, tests: [] },
      aiCoachTests: { status: 'pending', duration: 0, tests: [] },
      integrationTests: { status: 'pending', duration: 0, tests: [] },
      errorRecoveryTests: { status: 'pending', duration: 0, tests: [] },
      mobileTests: { status: 'pending', duration: 0, tests: [] },
    },
    performance: {
      averageLoadTime: 0,
      memoryUsage: 0,
      networkRequests: 0,
      cacheHitRate: 0,
    },
    coverage: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  };

  const reportFile = path.join(process.cwd(), 'test-results', 'test-report-template.json');
  
  try {
    await fs.writeFile(reportFile, JSON.stringify(reportTemplate, null, 2));
    console.log('📋 Test report template created');
  } catch (error) {
    console.warn('⚠️  Could not create test report template:', error);
  }
}

/**
 * Validate test environment requirements
 */
async function validateTestEnvironment(): Promise<void> {
  const requirements = [
    { check: () => process.version, name: 'Node.js version', requirement: '18+' },
    { check: () => process.env.NODE_ENV, name: 'NODE_ENV', requirement: 'test' },
    { check: () => fs.access('./package.json'), name: 'package.json', requirement: 'exists' },
    { check: () => fs.access('./vite.config.ts'), name: 'vite.config.ts', requirement: 'exists' },
  ];

  for (const req of requirements) {
    try {
      const result = await req.check();
      if (result) {
        console.log(`✅ ${req.name}: OK`);
      }
    } catch (error) {
      console.error(`❌ ${req.name}: Missing or invalid (${req.requirement})`);
      throw new Error(`Test environment requirement not met: ${req.name}`);
    }
  }
}

export default globalSetup;