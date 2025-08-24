# Fantasy Football Analyzer - Testing Suite

## Overview

This directory contains the comprehensive Playwright testing suite for the Fantasy Football Analyzer application. The test suite covers end-to-end testing of all major features including ESPN API integration, Browser MCP webscraping, Hybrid AI services, and mobile responsiveness.

## Test Structure

```
tests/
├── playwright/
│   ├── espn-api.spec.ts          # ESPN API integration tests
│   ├── browser-mcp.spec.ts       # Browser MCP webscraping tests
│   ├── ai-coach.spec.ts          # Hybrid AI service tests
│   ├── integration.spec.ts       # End-to-end integration tests
│   ├── error-recovery.spec.ts    # Error handling and recovery tests
│   └── mobile.spec.ts            # Mobile responsiveness tests
├── fixtures/
│   ├── test-data.ts              # Test data and mock objects
│   └── mock-responses.ts         # API mocks and response handlers
├── setup/
│   ├── global-setup.ts           # Global test environment setup
│   ├── global-teardown.ts        # Global cleanup and reporting
│   └── test-helpers.ts           # Utility functions and helpers
└── README.md                     # This file
```

## Test Categories

### 1. ESPN API Integration Tests (`espn-api.spec.ts`)
- **Coverage**: ESPN API endpoints, caching, error handling, data transformation
- **Key Features**:
  - Player and team data fetching
  - Fantasy projections and rankings
  - Injury report integration
  - Rate limiting and retry logic
  - Performance benchmarks

### 2. Browser MCP Tests (`browser-mcp.spec.ts`)
- **Coverage**: Real webscraping functionality, data extraction, error recovery
- **Key Features**:
  - NFL.com injury scraping
  - FantasyPros rankings extraction
  - Sleeper ADP data collection
  - Screenshot capture for debugging
  - Service health monitoring

### 3. Hybrid AI Coach Tests (`ai-coach.spec.ts`)
- **Coverage**: Local Gemini Advanced and Cloud Gemini Enterprise integration
- **Key Features**:
  - WebSocket connection testing
  - Backend switching logic
  - Fantasy football analysis quality
  - Real-time communication
  - Error recovery and fallbacks

### 4. Integration Tests (`integration.spec.ts`)
- **Coverage**: Complete user workflows and cross-service communication
- **Key Features**:
  - Draft analysis workflows
  - Trade evaluation scenarios
  - Player comparison features
  - Live data monitoring
  - Data consistency across services

### 5. Error Recovery Tests (`error-recovery.spec.ts`)
- **Coverage**: Network failures, API errors, service degradation
- **Key Features**:
  - Network connectivity issues
  - API rate limiting and timeouts
  - Service failover testing
  - Cache corruption recovery
  - Application state preservation

### 6. Mobile Responsiveness Tests (`mobile.spec.ts`)
- **Coverage**: Mobile devices, touch interactions, responsive design
- **Key Features**:
  - iOS Safari and Android Chrome testing
  - Touch gesture handling
  - Mobile-optimized interfaces
  - Performance on mobile devices
  - Progressive Web App features

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:e2e:install

# Install system dependencies (Linux)
npm run test:e2e:install-deps
```

### Basic Test Commands

```bash
# Run all Playwright tests
npm run test:e2e

# Run with UI mode for debugging
npm run test:e2e:ui

# Run in headed mode (show browser)
npm run test:e2e:headed

# Debug mode with step-by-step execution
npm run test:e2e:debug

# Generate test report
npm run test:e2e:report
```

### Targeted Test Commands

```bash
# Mobile-only tests
npm run test:e2e:mobile

# Desktop browser tests
npm run test:e2e:desktop

# API integration tests
npm run test:e2e:api

# Performance tests
npm run test:e2e:performance

# Visual regression tests
npm run test:e2e:visual

# Accessibility tests
npm run test:e2e:accessibility
```

### CI/CD Commands

```bash
# Run tests in CI environment
npm run test:e2e:ci

# Run all tests (unit + e2e)
npm run test:all

# Quick smoke tests
npm run test:quick

# Full validation pipeline
npm run validate:full
```

## Test Configuration

### Browser Support

The test suite runs across multiple browsers and devices:

- **Desktop**: Chromium, Firefox, Safari
- **Mobile**: iPhone 12/13 Pro, Pixel 5, Galaxy S21
- **Tablets**: iPad Pro, iPad

### Environment Variables

```bash
# Custom test base URL
TEST_BASE_URL=http://localhost:3000

# Enable specific test features
LOCAL_GEMINI_AVAILABLE=true
VITE_USE_MOCK_DATA=false

# Performance testing
VITE_PERFORMANCE_MONITORING=true

# Debugging
PLAYWRIGHT_DEBUG=1
```

### Test Scenarios

#### ESPN API Testing
- ✅ All player and team endpoints
- ✅ Fantasy projections accuracy
- ✅ Injury report integration
- ✅ Caching and TTL validation
- ✅ Rate limiting compliance
- ✅ Error handling and fallbacks

#### Browser MCP Testing
- ✅ NFL.com injury scraping
- ✅ FantasyPros rankings extraction
- ✅ Sleeper ADP data collection
- ✅ CSS selector robustness
- ✅ Service health monitoring
- ✅ Screenshot debugging

#### AI Services Testing
- ✅ Local Gemini Advanced bridge
- ✅ Cloud Gemini Enterprise fallback
- ✅ WebSocket communication
- ✅ Backend switching logic
- ✅ Response quality validation
- ✅ Context preservation

#### Integration Testing
- ✅ Complete draft workflows
- ✅ Player comparison features
- ✅ Trade evaluation scenarios
- ✅ Live data monitoring
- ✅ Cross-service data flow
- ✅ User experience continuity

#### Error Recovery Testing
- ✅ Network failure scenarios
- ✅ API timeout handling
- ✅ Service degradation
- ✅ Cache corruption recovery
- ✅ Application state preservation
- ✅ User-friendly error messages

#### Mobile Testing
- ✅ Touch interactions
- ✅ Responsive design
- ✅ Mobile-optimized interfaces
- ✅ Performance optimization
- ✅ PWA functionality
- ✅ Cross-device consistency

## Performance Benchmarks

| Metric | Target | Mobile Target |
|--------|--------|---------------|
| Page Load | < 3 seconds | < 4.5 seconds |
| Draft Board Render | < 2 seconds | < 3 seconds |
| AI Response | < 10 seconds | < 10 seconds |
| API Call | < 5 seconds | < 7.5 seconds |
| Memory Usage | < 100 MB | < 75 MB |
| Network Requests | < 20 initial | < 15 initial |

## Debugging Tests

### UI Mode
```bash
npm run test:e2e:ui
```
- Interactive test runner
- Step-by-step debugging
- Live browser interaction
- Test result visualization

### Debug Mode
```bash
npm run test:e2e:debug
```
- Pause on failures
- Browser developer tools
- Console logging
- Network inspection

### Screenshots and Videos
- Automatic capture on failure
- Full-page screenshots
- Video recordings of test runs
- Stored in `test-results/` directory

### Trace Files
- Detailed execution traces
- Network activity logging
- DOM snapshots
- Performance metrics

## Mock Data and Fixtures

### ESPN API Mocks
- Complete player and team datasets
- Realistic fantasy projections
- Injury report simulations
- Error scenario testing

### Browser MCP Mocks
- NFL.com injury data
- FantasyPros rankings
- Sleeper ADP information
- Service health responses

### AI Service Mocks
- Local Gemini responses
- Cloud service fallbacks
- WebSocket communication
- Context-aware interactions

## Continuous Integration

### GitHub Actions
- Automated test execution
- Multi-node matrix testing
- Parallel test execution
- Artifact collection and reporting

### Test Reports
- HTML test reports
- JUnit XML output
- Performance metrics
- Coverage information

### Artifact Management
- Screenshot and video collection
- Test result archival
- Performance benchmark tracking
- Error log aggregation

## Contributing

### Adding New Tests
1. Follow existing test patterns
2. Use test helpers and utilities
3. Include proper mocking
4. Add performance assertions
5. Document test scenarios

### Test Data Updates
1. Update fixture files
2. Maintain data consistency
3. Keep mocks realistic
4. Version control test data

### Performance Testing
1. Set realistic benchmarks
2. Test across devices
3. Monitor memory usage
4. Validate network efficiency

## Troubleshooting

### Common Issues

#### Browser Installation
```bash
npx playwright install --with-deps
```

#### Permission Errors
```bash
sudo npx playwright install-deps
```

#### Timeout Issues
- Increase test timeouts
- Check network connectivity
- Verify service availability

#### Flaky Tests
- Add proper wait conditions
- Use stable selectors
- Implement retry logic
- Check timing dependencies

### Getting Help

1. Review test output and logs
2. Check browser developer tools
3. Examine trace files
4. Review CI/CD pipeline logs
5. Consult Playwright documentation

## License

This testing suite is part of the Fantasy Football Analyzer project and follows the same MIT license.