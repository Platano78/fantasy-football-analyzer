#!/usr/bin/env node

/**
 * Automated deployment testing script for Fantasy Football Analyzer
 * Tests functionality, performance, and health after deployment
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  localPort: 3000,
  timeout: 10000,
  endpoints: [
    '/',
    '/health',
    '/assets/index.css',
    '/assets/index.js'
  ],
  performanceThresholds: {
    pageLoadTime: 3000, // 3 seconds
    firstContentfulPaint: 2000, // 2 seconds
    resourceLoadTime: 1000 // 1 second per resource
  }
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Utility functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logSection = (title) => {
  log(`\n${colors.blue}${colors.bold}▶ ${title}${colors.reset}`);
  log('='.repeat(50));
};

const logSuccess = (message) => log(`✓ ${message}`, colors.green);
const logWarning = (message) => log(`⚠ ${message}`, colors.yellow);
const logError = (message) => log(`✗ ${message}`, colors.red);

// Test functions
class DeploymentTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  async runAllTests() {
    logSection('Deployment Testing Started');
    log(`Testing URL: ${this.baseUrl}`);
    
    try {
      await this.testBasicConnectivity();
      await this.testEndpoints();
      await this.testHealthEndpoint();
      await this.testStaticAssets();
      await this.testPerformance();
      await this.testSecurity();
      
      this.generateReport();
    } catch (error) {
      logError(`Testing failed: ${error.message}`);
      process.exit(1);
    }
  }

  async testBasicConnectivity() {
    logSection('Basic Connectivity Test');
    
    try {
      const response = await this.makeRequest('/');
      if (response.statusCode === 200) {
        logSuccess('Basic connectivity established');
        this.recordTest('connectivity', true);
      } else {
        logError(`Unexpected status code: ${response.statusCode}`);
        this.recordTest('connectivity', false);
      }
    } catch (error) {
      logError(`Connectivity failed: ${error.message}`);
      this.recordTest('connectivity', false);
    }
  }

  async testEndpoints() {
    logSection('Endpoint Testing');
    
    for (const endpoint of CONFIG.endpoints) {
      try {
        const startTime = Date.now();
        const response = await this.makeRequest(endpoint);
        const responseTime = Date.now() - startTime;
        
        if (response.statusCode === 200) {
          logSuccess(`${endpoint} - OK (${responseTime}ms)`);
          this.recordTest(`endpoint_${endpoint}`, true, { responseTime });
        } else {
          logWarning(`${endpoint} - Status: ${response.statusCode}`);
          this.recordTest(`endpoint_${endpoint}`, false, { statusCode: response.statusCode });
        }
      } catch (error) {
        logError(`${endpoint} - Error: ${error.message}`);
        this.recordTest(`endpoint_${endpoint}`, false, { error: error.message });
      }
    }
  }

  async testHealthEndpoint() {
    logSection('Health Endpoint Test');
    
    try {
      const response = await this.makeRequest('/health');
      
      if (response.statusCode === 200) {
        try {
          const healthData = JSON.parse(response.data);
          logSuccess('Health endpoint responding');
          log(`Status: ${healthData.status || 'unknown'}`);
          log(`Timestamp: ${healthData.timestamp || 'unknown'}`);
          
          this.recordTest('health_endpoint', true, healthData);
        } catch (parseError) {
          logWarning('Health endpoint returned non-JSON response');
          this.recordTest('health_endpoint', true, { warning: 'non-json-response' });
        }
      } else {
        logError(`Health endpoint returned status: ${response.statusCode}`);
        this.recordTest('health_endpoint', false);
      }
    } catch (error) {
      logError(`Health endpoint test failed: ${error.message}`);
      this.recordTest('health_endpoint', false);
    }
  }

  async testStaticAssets() {
    logSection('Static Assets Test');
    
    const assetTypes = [
      { pattern: /\.css$/, name: 'CSS files' },
      { pattern: /\.js$/, name: 'JavaScript files' },
      { pattern: /\.(png|jpg|jpeg|gif|svg|ico)$/, name: 'Image files' }
    ];

    // Test if dist directory exists (for local testing)
    if (this.baseUrl.includes('localhost') && fs.existsSync('dist')) {
      const distFiles = this.getDistFiles('dist');
      
      for (const assetType of assetTypes) {
        const files = distFiles.filter(file => assetType.pattern.test(file));
        if (files.length > 0) {
          logSuccess(`${assetType.name}: ${files.length} files found`);
          this.recordTest(`assets_${assetType.name}`, true, { count: files.length });
        } else {
          logWarning(`${assetType.name}: No files found`);
          this.recordTest(`assets_${assetType.name}`, false);
        }
      }
    } else {
      logWarning('Static asset test skipped (remote deployment or no dist folder)');
    }
  }

  async testPerformance() {
    logSection('Performance Testing');
    
    try {
      const startTime = Date.now();
      const response = await this.makeRequest('/');
      const loadTime = Date.now() - startTime;
      
      if (loadTime < CONFIG.performanceThresholds.pageLoadTime) {
        logSuccess(`Page load time: ${loadTime}ms (under ${CONFIG.performanceThresholds.pageLoadTime}ms threshold)`);
        this.recordTest('performance_load_time', true, { loadTime });
      } else {
        logWarning(`Page load time: ${loadTime}ms (exceeds ${CONFIG.performanceThresholds.pageLoadTime}ms threshold)`);
        this.recordTest('performance_load_time', false, { loadTime });
      }

      // Test gzip compression
      if (response.headers['content-encoding'] && response.headers['content-encoding'].includes('gzip')) {
        logSuccess('Gzip compression enabled');
        this.recordTest('performance_gzip', true);
      } else {
        logWarning('Gzip compression not detected');
        this.recordTest('performance_gzip', false);
      }

    } catch (error) {
      logError(`Performance test failed: ${error.message}`);
      this.recordTest('performance', false);
    }
  }

  async testSecurity() {
    logSection('Security Headers Test');
    
    try {
      const response = await this.makeRequest('/');
      const headers = response.headers;
      
      const securityHeaders = [
        { name: 'x-frame-options', expected: true, description: 'X-Frame-Options' },
        { name: 'x-content-type-options', expected: true, description: 'X-Content-Type-Options' },
        { name: 'x-xss-protection', expected: true, description: 'X-XSS-Protection' },
        { name: 'referrer-policy', expected: true, description: 'Referrer-Policy' }
      ];

      for (const header of securityHeaders) {
        if (headers[header.name]) {
          logSuccess(`${header.description}: ${headers[header.name]}`);
          this.recordTest(`security_${header.name}`, true);
        } else {
          logWarning(`${header.description}: Not set`);
          this.recordTest(`security_${header.name}`, false);
        }
      }

    } catch (error) {
      logError(`Security test failed: ${error.message}`);
      this.recordTest('security', false);
    }
  }

  makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      
      const req = client.get(url, {
        timeout: CONFIG.timeout,
        headers: {
          'User-Agent': 'Fantasy-Football-Analyzer-Deployment-Test/1.0'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  getDistFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        this.getDistFiles(filePath, fileList);
      } else {
        fileList.push(file);
      }
    });
    
    return fileList;
  }

  recordTest(name, passed, metadata = {}) {
    this.results.tests.push({
      name,
      passed,
      metadata
    });
    
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  generateReport() {
    logSection('Test Results Summary');
    
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;
    
    log(`Total tests: ${total}`);
    logSuccess(`Passed: ${this.results.passed}`);
    if (this.results.failed > 0) {
      logError(`Failed: ${this.results.failed}`);
    }
    log(`Pass rate: ${passRate}%`);
    
    // Detailed results
    if (this.results.failed > 0) {
      log('\nFailed tests:');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          logError(`  • ${test.name}: ${JSON.stringify(test.metadata)}`);
        });
    }
    
    // Overall status
    if (this.results.failed === 0) {
      logSuccess('\n🎉 All tests passed! Deployment is ready for production.');
    } else if (this.results.failed <= 2) {
      logWarning('\n⚠️ Some tests failed, but deployment may be acceptable. Review failed tests.');
    } else {
      logError('\n❌ Multiple tests failed. Deployment may have issues.');
    }
    
    // Performance summary
    const loadTimeTest = this.results.tests.find(t => t.name === 'performance_load_time');
    if (loadTimeTest && loadTimeTest.passed) {
      logSuccess(`\n⚡ Performance: Page loads in ${loadTimeTest.metadata.loadTime}ms`);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  let baseUrl = args[0];
  
  if (!baseUrl) {
    // Default to local preview
    baseUrl = `http://localhost:${CONFIG.localPort}`;
    log(`No URL provided, testing local preview: ${baseUrl}`);
  }
  
  // Validate URL
  try {
    new URL(baseUrl);
  } catch (error) {
    logError(`Invalid URL: ${baseUrl}`);
    process.exit(1);
  }
  
  const tester = new DeploymentTester(baseUrl);
  await tester.runAllTests();
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

export { DeploymentTester };