import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Comprehensive Playwright Configuration for Fantasy Football Analyzer
 * 
 * Features:
 * - Multi-browser testing (Chromium, Firefox, Safari)
 * - Mobile and desktop viewport testing
 * - Parallel execution with retry configuration
 * - Screenshot and video capture on failures
 * - Custom test fixtures and utilities
 * - Performance monitoring
 * - Network interception and mocking
 */

export default defineConfig({
  testDir: './tests/playwright',
  
  // Global test settings
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
    toHaveScreenshot: {
      mode: 'only-on-failure',
      threshold: 0.3, // Allow 30% difference for visual regression
    },
  },
  
  // Test execution settings
  fullyParallel: true, // Run tests in parallel
  forbidOnly: !!process.env.CI, // Forbid test.only in CI
  retries: process.env.CI ? 3 : 1, // Retry failed tests
  workers: process.env.CI ? 2 : undefined, // Limit workers in CI
  
  // Reporting configuration
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  
  // Output directories
  outputDir: 'test-results/artifacts',
  
  // Global test setup and teardown
  globalSetup: './tests/setup/global-setup.ts',
  globalTeardown: './tests/setup/global-teardown.ts',
  
  use: {
    // Base URL for the application
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    
    // Browser context settings
    trace: 'retain-on-failure', // Capture traces on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Network settings
    ignoreHTTPSErrors: true,
    bypassCSP: true, // Bypass Content Security Policy
    
    // Viewport settings (will be overridden by projects)
    viewport: { width: 1280, height: 720 },
    
    // User agent
    userAgent: 'Fantasy-Football-Analyzer-Tests/1.0',
    
    // Action settings
    actionTimeout: 15 * 1000, // 15 seconds for actions
    navigationTimeout: 30 * 1000, // 30 seconds for navigation
    
    // Test context
    contextOptions: {
      // Enable service workers for PWA testing
      serviceWorkers: 'allow',
      
      // Enable permissions for geolocation, notifications, etc.
      permissions: ['clipboard-read', 'clipboard-write'],
      
      // Locale and timezone
      locale: 'en-US',
      timezoneId: 'America/New_York',
    },
  },

  // Project configurations for different browsers and viewports
  projects: [
    // Desktop Browsers
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: /.*\.(test|spec)\.(ts|js)/,
    },
    
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: /.*\.(test|spec)\.(ts|js)/,
    },
    
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: /.*\.(test|spec)\.(ts|js)/,
    },

    // Mobile Browsers
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
      testMatch: /mobile\.spec\.(ts|js)$/,
    },
    
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
      testMatch: /mobile\.spec\.(ts|js)$/,
    },

    // Tablet Testing
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad Pro'],
        userAgent: (devices['iPad Pro'] as any)?.userAgent?.replace?.('Safari', 'Chrome') || 'Chrome-iPad',
      },
      testMatch: /mobile\.spec\.(ts|js)$/,
    },

    // Performance Testing
    {
      name: 'performance-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--enable-performance-logging',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
          ],
        },
      },
      testMatch: /performance\.spec\.(ts|js)$/,
    },

    // API Testing (headless)
    {
      name: 'api-tests',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
      testMatch: /(api|espn-api|browser-mcp|ai-coach)\.spec\.(ts|js)$/,
    },

    // Visual Regression Testing
    {
      name: 'visual-regression',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: /visual\.spec\.(ts|js)$/,
    },

    // Accessibility Testing
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: /accessibility\.spec\.(ts|js)$/,
    },

    // Network Condition Testing
    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        contextOptions: {
          offline: false,
          // Simulate slow 3G
          serviceWorkers: 'allow',
        },
      },
      testMatch: /network\.spec\.(ts|js)$/,
    },
  ],

  // Web server configuration for local testing
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
    env: {
      NODE_ENV: 'test',
      VITE_TEST_MODE: 'true',
    },
  },

  // Test file patterns
  testMatch: [
    '**/tests/playwright/**/*.spec.ts',
    '**/tests/playwright/**/*.test.ts',
  ],

  // Files to ignore
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
  ],

  // Metadata
  metadata: {
    'test-suite': 'Fantasy Football Analyzer E2E Tests',
    'version': '1.0.0',
    'author': 'Fantasy Football Analyzer Team',
    'description': 'Comprehensive end-to-end testing suite covering ESPN API, Browser MCP, Hybrid AI, and full user workflows',
    'features': [
      'ESPN API Integration Testing',
      'Browser MCP Webscraping Validation',
      'Hybrid AI Service Testing',
      'Mobile Responsiveness',
      'Performance Monitoring',
      'Visual Regression Testing',
      'Accessibility Testing',
      'Error Recovery Testing',
    ],
  },

  // Advanced configuration
  grep: process.env.PLAYWRIGHT_GREP ? new RegExp(process.env.PLAYWRIGHT_GREP) : undefined,
  grepInvert: process.env.PLAYWRIGHT_GREP_INVERT ? new RegExp(process.env.PLAYWRIGHT_GREP_INVERT) : undefined,
  
  // Shard configuration for parallel CI execution
  shard: process.env.PLAYWRIGHT_SHARD ? {
    current: parseInt(process.env.PLAYWRIGHT_SHARD.split('/')[0]),
    total: parseInt(process.env.PLAYWRIGHT_SHARD.split('/')[1]),
  } : undefined,

  // Update snapshots
  updateSnapshots: process.env.PLAYWRIGHT_UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',
});