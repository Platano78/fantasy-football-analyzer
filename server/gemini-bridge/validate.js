// Local Gemini Advanced Bridge Server - Validation Script
// Comprehensive validation and testing utility

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class GeminiBridgeValidator {
  constructor() {
    this.config = require('./config');
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  // Logging utilities
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green  
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  // Test result recording
  recordTest(name, passed, message, warning = false) {
    this.results.tests.push({
      name,
      passed,
      message,
      warning,
      timestamp: new Date().toISOString()
    });

    if (warning) {
      this.results.warnings++;
      this.log(`⚠️  ${name}: ${message}`, 'warning');
    } else if (passed) {
      this.results.passed++;
      this.log(`✅ ${name}: ${message}`, 'success');
    } else {
      this.results.failed++;
      this.log(`❌ ${name}: ${message}`, 'error');
    }
  }

  // Validate configuration
  async validateConfiguration() {
    this.log('🔧 Validating configuration...', 'info');

    try {
      // Check required configuration
      const required = [
        'server.host',
        'server.port',
        'discovery.endpoints',
        'corsOrigins'
      ];

      for (const configPath of required) {
        const value = configPath.split('.').reduce((obj, key) => obj?.[key], this.config);
        if (value === undefined || value === null) {
          this.recordTest('Config Validation', false, `Missing required configuration: ${configPath}`);
          return false;
        }
      }

      // Validate server configuration
      if (this.config.server.port < 1 || this.config.server.port > 65535) {
        this.recordTest('Port Validation', false, 'Invalid port number');
        return false;
      }

      // Validate endpoints
      if (!Array.isArray(this.config.discovery.endpoints) || this.config.discovery.endpoints.length === 0) {
        this.recordTest('Endpoints Validation', false, 'No discovery endpoints configured', true);
      }

      this.recordTest('Configuration Validation', true, 'All required configuration is valid');
      return true;

    } catch (error) {
      this.recordTest('Configuration Validation', false, `Configuration error: ${error.message}`);
      return false;
    }
  }

  // Validate file structure
  async validateFileStructure() {
    this.log('📁 Validating file structure...', 'info');

    const requiredFiles = [
      'server.js',
      'config.js',
      'package.json',
      'README.md'
    ];

    const optionalFiles = [
      '.env',
      '.env.example',
      'ecosystem.config.js',
      'Dockerfile',
      'docker-compose.yml'
    ];

    let allFilesExist = true;

    // Check required files
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        this.recordTest(`Required File: ${file}`, true, 'File exists');
      } else {
        this.recordTest(`Required File: ${file}`, false, 'File missing');
        allFilesExist = false;
      }
    }

    // Check optional files
    for (const file of optionalFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        this.recordTest(`Optional File: ${file}`, true, 'File exists');
      } else {
        this.recordTest(`Optional File: ${file}`, false, 'File missing (optional)', true);
      }
    }

    return allFilesExist;
  }

  // Validate package.json
  async validatePackageJson() {
    this.log('📦 Validating package.json...', 'info');

    try {
      const packagePath = path.join(__dirname, 'package.json');
      if (!fs.existsSync(packagePath)) {
        this.recordTest('Package.json', false, 'package.json not found');
        return false;
      }

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Check required fields
      const requiredFields = ['name', 'version', 'main', 'scripts', 'dependencies'];
      for (const field of requiredFields) {
        if (!packageJson[field]) {
          this.recordTest(`Package.json ${field}`, false, `Missing required field: ${field}`);
          return false;
        }
      }

      // Check required dependencies
      const requiredDeps = ['express', 'ws', 'cors', 'axios'];
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies[dep]) {
          this.recordTest(`Dependency: ${dep}`, false, `Missing required dependency: ${dep}`);
          return false;
        }
      }

      // Check scripts
      const requiredScripts = ['start'];
      for (const script of requiredScripts) {
        if (!packageJson.scripts[script]) {
          this.recordTest(`Script: ${script}`, false, `Missing required script: ${script}`);
          return false;
        }
      }

      this.recordTest('Package.json Validation', true, 'All required fields and dependencies present');
      return true;

    } catch (error) {
      this.recordTest('Package.json Validation', false, `Error reading package.json: ${error.message}`);
      return false;
    }
  }

  // Test server startup
  async testServerStartup() {
    this.log('🚀 Testing server startup...', 'info');

    return new Promise((resolve) => {
      let serverProcess;
      let testTimeout;
      let healthCheckInterval;

      try {
        // Start server in test mode
        const { spawn } = require('child_process');
        
        serverProcess = spawn('node', ['server.js'], {
          env: {
            ...process.env,
            NODE_ENV: 'test',
            BRIDGE_PORT: 3099,  // Use different port for testing
            LOG_LEVEL: 'error'   // Reduce noise
          },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Set timeout for test
        testTimeout = setTimeout(() => {
          this.recordTest('Server Startup', false, 'Server startup timeout');
          cleanup();
          resolve(false);
        }, 30000); // 30 second timeout

        // Wait for server to be ready
        let attempts = 0;
        const maxAttempts = 15;

        healthCheckInterval = setInterval(() => {
          attempts++;
          
          // Try to connect to health endpoint
          const req = http.get('http://localhost:3099/health', (res) => {
            if (res.statusCode === 200) {
              this.recordTest('Server Startup', true, 'Server started successfully');
              cleanup();
              resolve(true);
            }
          });

          req.on('error', () => {
            if (attempts >= maxAttempts) {
              this.recordTest('Server Startup', false, 'Could not connect to server');
              cleanup();
              resolve(false);
            }
          });

          req.setTimeout(1000);
        }, 2000);

        // Handle server process errors
        serverProcess.on('error', (error) => {
          this.recordTest('Server Startup', false, `Server process error: ${error.message}`);
          cleanup();
          resolve(false);
        });

        // Cleanup function
        function cleanup() {
          if (testTimeout) clearTimeout(testTimeout);
          if (healthCheckInterval) clearInterval(healthCheckInterval);
          if (serverProcess && !serverProcess.killed) {
            serverProcess.kill('SIGTERM');
          }
        }

      } catch (error) {
        this.recordTest('Server Startup', false, `Startup test error: ${error.message}`);
        resolve(false);
      }
    });
  }

  // Test API endpoints
  async testAPIEndpoints() {
    this.log('🌐 Testing API endpoints...', 'info');

    const endpoints = [
      { path: '/health', method: 'GET', expectedStatus: 200 },
      { path: '/api/discover', method: 'GET', expectedStatus: 200 },
      { path: '/api/status', method: 'GET', expectedStatus: 200 },
      { path: '/nonexistent', method: 'GET', expectedStatus: 404 }
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
      try {
        const result = await this.testEndpoint(endpoint);
        if (!result) allPassed = false;
      } catch (error) {
        this.recordTest(`API ${endpoint.path}`, false, `Error testing endpoint: ${error.message}`);
        allPassed = false;
      }
    }

    return allPassed;
  }

  // Test individual endpoint
  testEndpoint(endpoint) {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3099,
        path: endpoint.path,
        method: endpoint.method
      }, (res) => {
        if (res.statusCode === endpoint.expectedStatus) {
          this.recordTest(`API ${endpoint.path}`, true, `Returned expected status ${endpoint.expectedStatus}`);
          resolve(true);
        } else {
          this.recordTest(`API ${endpoint.path}`, false, `Expected ${endpoint.expectedStatus}, got ${res.statusCode}`);
          resolve(false);
        }
      });

      req.on('error', (error) => {
        this.recordTest(`API ${endpoint.path}`, false, `Request error: ${error.message}`);
        resolve(false);
      });

      req.setTimeout(5000);
      req.end();
    });
  }

  // Test WebSocket connectivity
  async testWebSocket() {
    this.log('🔌 Testing WebSocket connectivity...', 'info');

    return new Promise((resolve) => {
      let ws;
      let testTimeout;

      try {
        ws = new WebSocket('ws://localhost:3099/ws');
        
        testTimeout = setTimeout(() => {
          this.recordTest('WebSocket Connection', false, 'WebSocket connection timeout');
          if (ws) ws.close();
          resolve(false);
        }, 10000);

        ws.on('open', () => {
          this.recordTest('WebSocket Connection', true, 'Connected successfully');
          
          // Test message sending
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'health'
          }));
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'welcome') {
              this.recordTest('WebSocket Welcome', true, 'Received welcome message');
            } else if (message.type === 'subscribed') {
              this.recordTest('WebSocket Subscription', true, 'Subscription successful');
              clearTimeout(testTimeout);
              ws.close();
              resolve(true);
            }
          } catch (error) {
            this.recordTest('WebSocket Message', false, `Error parsing message: ${error.message}`);
          }
        });

        ws.on('error', (error) => {
          this.recordTest('WebSocket Connection', false, `WebSocket error: ${error.message}`);
          clearTimeout(testTimeout);
          resolve(false);
        });

        ws.on('close', () => {
          if (testTimeout) {
            clearTimeout(testTimeout);
          }
        });

      } catch (error) {
        this.recordTest('WebSocket Connection', false, `WebSocket test error: ${error.message}`);
        resolve(false);
      }
    });
  }

  // Validate environment
  async validateEnvironment() {
    this.log('🌍 Validating environment...', 'info');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      this.recordTest('Node.js Version', true, `Node.js ${nodeVersion} is supported`);
    } else {
      this.recordTest('Node.js Version', false, `Node.js ${nodeVersion} is not supported (requires 18+)`);
      return false;
    }

    // Check available ports
    const testPort = this.config.server.port;
    try {
      await this.checkPortAvailable(testPort);
      this.recordTest('Port Availability', true, `Port ${testPort} is available`);
    } catch (error) {
      this.recordTest('Port Availability', false, `Port ${testPort} is not available`);
    }

    // Check memory
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    if (heapUsedMB < 100) {
      this.recordTest('Memory Usage', true, `Current heap usage: ${heapUsedMB}MB`);
    } else {
      this.recordTest('Memory Usage', false, `High heap usage: ${heapUsedMB}MB`, true);
    }

    return true;
  }

  // Check if port is available
  checkPortAvailable(port) {
    return new Promise((resolve, reject) => {
      const server = require('net').createServer();
      
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      
      server.on('error', (error) => {
        reject(error);
      });
    });
  }

  // Run all validations
  async runAll() {
    this.log('🔍 Starting Gemini Advanced Bridge Server validation...', 'info');
    console.log('='.repeat(70));

    const validations = [
      { name: 'Environment', fn: () => this.validateEnvironment() },
      { name: 'Configuration', fn: () => this.validateConfiguration() },
      { name: 'File Structure', fn: () => this.validateFileStructure() },
      { name: 'Package.json', fn: () => this.validatePackageJson() }
    ];

    // Run basic validations first
    for (const validation of validations) {
      try {
        await validation.fn();
      } catch (error) {
        this.recordTest(validation.name, false, `Validation error: ${error.message}`);
      }
    }

    // Only run server tests if basic validations pass
    if (this.results.failed === 0) {
      this.log('🔄 Running server integration tests...', 'info');
      
      try {
        const serverStarted = await this.testServerStartup();
        
        if (serverStarted) {
          await this.testAPIEndpoints();
          await this.testWebSocket();
        }
      } catch (error) {
        this.recordTest('Server Tests', false, `Server test error: ${error.message}`);
      }
    } else {
      this.log('⚠️  Skipping server tests due to validation failures', 'warning');
    }

    // Display results
    this.displayResults();
    
    return this.results.failed === 0;
  }

  // Display validation results
  displayResults() {
    console.log('\n' + '='.repeat(70));
    this.log('📊 Validation Results Summary', 'info');
    console.log('='.repeat(70));

    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(test => !test.passed && !test.warning)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.message}`);
        });
    }

    if (this.results.warnings > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.tests
        .filter(test => test.warning)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.message}`);
        });
    }

    console.log('\n' + '='.repeat(70));
    
    if (this.results.failed === 0) {
      this.log('🎉 All validations passed! Server is ready for deployment.', 'success');
    } else {
      this.log('❌ Some validations failed. Please fix issues before deployment.', 'error');
    }
    
    console.log('='.repeat(70));
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new GeminiBridgeValidator();
  
  validator.runAll().then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('Validation error:', error);
    process.exit(1);
  });
}

module.exports = GeminiBridgeValidator;