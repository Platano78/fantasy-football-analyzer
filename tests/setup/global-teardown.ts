/**
 * Global Test Teardown for Fantasy Football Analyzer
 * 
 * Handles cleanup, report generation, and resource management
 * after all tests have completed.
 */

import { FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('🧹 Starting Fantasy Football Analyzer test environment teardown...');
  
  try {
    // Generate comprehensive test report
    await generateTestReport();
    
    // Process performance data
    await processPerformanceData();
    
    // Clean up test artifacts
    await cleanupTestArtifacts();
    
    // Generate coverage report
    await generateCoverageReport();
    
    // Cleanup temporary files
    await cleanupTemporaryFiles();
    
    // Log final test summary
    await logTestSummary();
    
    console.log('✅ Global test teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

/**
 * Generate comprehensive test report
 */
async function generateTestReport(): Promise<void> {
  const reportDir = path.join(process.cwd(), 'test-results');
  const resultsFile = path.join(reportDir, 'results.json');
  const summaryFile = path.join(reportDir, 'test-summary.json');

  try {
    // Check if Playwright generated results file exists
    const resultsExist = await fs.access(resultsFile).then(() => true).catch(() => false);
    
    if (resultsExist) {
      const results = JSON.parse(await fs.readFile(resultsFile, 'utf8'));
      
      // Process and enhance results
      const enhancedReport = await processTestResults(results);
      
      // Write enhanced summary
      await fs.writeFile(summaryFile, JSON.stringify(enhancedReport, null, 2));
      
      console.log('📊 Test report generated successfully');
      console.log(`📄 Results available at: ${summaryFile}`);
    } else {
      console.log('⚠️  No test results file found, skipping report generation');
    }
  } catch (error) {
    console.error('❌ Error generating test report:', error);
  }
}

/**
 * Process test results and add enhancements
 */
async function processTestResults(results: any): Promise<any> {
  const enhancedReport = {
    summary: {
      totalTests: results.stats?.total || 0,
      passed: results.stats?.passed || 0,
      failed: results.stats?.failed || 0,
      skipped: results.stats?.skipped || 0,
      duration: results.stats?.duration || 0,
      success: (results.stats?.failed || 0) === 0,
    },
    testSuites: {
      espnApi: extractSuiteResults(results, 'espn-api'),
      browserMcp: extractSuiteResults(results, 'browser-mcp'),
      aiCoach: extractSuiteResults(results, 'ai-coach'),
      integration: extractSuiteResults(results, 'integration'),
      errorRecovery: extractSuiteResults(results, 'error-recovery'),
      mobile: extractSuiteResults(results, 'mobile'),
    },
    performance: await getPerformanceMetrics(),
    browsers: getBrowserResults(results),
    errors: getErrorSummary(results),
    recommendations: generateRecommendations(results),
    timestamp: new Date().toISOString(),
  };

  return enhancedReport;
}

/**
 * Extract results for specific test suite
 */
function extractSuiteResults(results: any, suiteName: string): any {
  const suiteTests = results.suites?.filter((suite: any) => 
    suite.title?.toLowerCase().includes(suiteName) ||
    suite.file?.includes(suiteName)
  ) || [];

  const totalTests = suiteTests.reduce((sum: number, suite: any) => sum + (suite.tests?.length || 0), 0);
  const passedTests = suiteTests.reduce((sum: number, suite: any) => 
    sum + (suite.tests?.filter((test: any) => test.outcome === 'passed')?.length || 0), 0);

  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    duration: suiteTests.reduce((sum: number, suite: any) => sum + (suite.duration || 0), 0),
    success: passedTests === totalTests,
  };
}

/**
 * Get performance metrics from test run
 */
async function getPerformanceMetrics(): Promise<any> {
  const performanceFile = path.join(process.cwd(), 'test-results', 'performance-data.json');
  
  try {
    const data = await fs.readFile(performanceFile, 'utf8');
    const metrics = JSON.parse(data);
    
    return {
      averagePageLoad: calculateAverage(metrics.pageLoads || []),
      averageApiResponse: calculateAverage(metrics.apiResponses || []),
      memoryUsage: calculateAverage(metrics.memoryUsage || []),
      networkRequests: calculateAverage(metrics.networkRequests || []),
      cacheHitRate: calculateAverage(metrics.cacheHits || []),
      recommendations: generatePerformanceRecommendations(metrics),
    };
  } catch (error) {
    return {
      averagePageLoad: 0,
      averageApiResponse: 0,
      memoryUsage: 0,
      networkRequests: 0,
      cacheHitRate: 0,
      error: 'Performance data not available',
    };
  }
}

/**
 * Get browser-specific results
 */
function getBrowserResults(results: any): any {
  const browserResults: any = {};
  
  results.projects?.forEach((project: any) => {
    const browserName = project.name || 'unknown';
    const projectTests = project.suites?.reduce((total: number, suite: any) => 
      total + (suite.tests?.length || 0), 0) || 0;
    const passedTests = project.suites?.reduce((total: number, suite: any) => 
      total + (suite.tests?.filter((test: any) => test.outcome === 'passed')?.length || 0), 0) || 0;
    
    browserResults[browserName] = {
      total: projectTests,
      passed: passedTests,
      failed: projectTests - passedTests,
      success: passedTests === projectTests,
    };
  });

  return browserResults;
}

/**
 * Get error summary
 */
function getErrorSummary(results: any): any {
  const errors: any[] = [];
  
  results.suites?.forEach((suite: any) => {
    suite.tests?.forEach((test: any) => {
      if (test.outcome === 'failed') {
        errors.push({
          test: test.title,
          suite: suite.title,
          error: test.results?.[0]?.error?.message || 'Unknown error',
          duration: test.results?.[0]?.duration || 0,
        });
      }
    });
  });

  return {
    total: errors.length,
    errors: errors.slice(0, 10), // Top 10 errors
    patterns: identifyErrorPatterns(errors),
  };
}

/**
 * Generate test recommendations
 */
function generateRecommendations(results: any): string[] {
  const recommendations: string[] = [];
  
  const failureRate = (results.stats?.failed || 0) / (results.stats?.total || 1);
  
  if (failureRate > 0.1) {
    recommendations.push('High failure rate detected. Consider reviewing test stability and flakiness.');
  }
  
  if (results.stats?.duration > 300000) { // 5 minutes
    recommendations.push('Test suite duration is high. Consider parallelization or test optimization.');
  }
  
  // Add more specific recommendations based on results analysis
  
  return recommendations;
}

/**
 * Process performance data and generate insights
 */
async function processPerformanceData(): Promise<void> {
  const performanceDir = path.join(process.cwd(), 'test-results', 'performance');
  const reportFile = path.join(performanceDir, 'performance-report.json');

  try {
    // Collect all performance files
    const files = await fs.readdir(performanceDir).catch(() => []);
    const performanceFiles = files.filter(f => f.endsWith('-performance.json'));

    if (performanceFiles.length === 0) {
      console.log('📊 No performance data found');
      return;
    }

    const allMetrics: any[] = [];
    
    for (const file of performanceFiles) {
      try {
        const data = await fs.readFile(path.join(performanceDir, file), 'utf8');
        const metrics = JSON.parse(data);
        allMetrics.push(metrics);
      } catch (error) {
        console.warn(`⚠️  Could not read performance file ${file}`);
      }
    }

    // Generate performance report
    const performanceReport = {
      summary: {
        totalMeasurements: allMetrics.length,
        avgPageLoad: calculateAverage(allMetrics.map(m => m.pageLoad)),
        avgMemoryUsage: calculateAverage(allMetrics.map(m => m.memoryUsage)),
        avgNetworkRequests: calculateAverage(allMetrics.map(m => m.networkRequests)),
      },
      trends: analyzeTrends(allMetrics),
      recommendations: generatePerformanceRecommendations(allMetrics),
      timestamp: new Date().toISOString(),
    };

    await fs.writeFile(reportFile, JSON.stringify(performanceReport, null, 2));
    console.log('📊 Performance report generated');

  } catch (error) {
    console.error('❌ Error processing performance data:', error);
  }
}

/**
 * Clean up test artifacts and organize results
 */
async function cleanupTestArtifacts(): Promise<void> {
  const artifactsDir = path.join(process.cwd(), 'test-results', 'artifacts');
  
  try {
    const files = await fs.readdir(artifactsDir).catch(() => []);
    
    // Organize screenshots by test suite
    const screenshots = files.filter(f => f.includes('screenshot'));
    if (screenshots.length > 0) {
      await fs.mkdir(path.join(artifactsDir, 'screenshots'), { recursive: true });
      for (const screenshot of screenshots) {
        await fs.rename(
          path.join(artifactsDir, screenshot),
          path.join(artifactsDir, 'screenshots', screenshot)
        ).catch(() => {}); // Ignore errors if file doesn't exist
      }
    }

    // Organize videos
    const videos = files.filter(f => f.includes('video'));
    if (videos.length > 0) {
      await fs.mkdir(path.join(artifactsDir, 'videos'), { recursive: true });
      for (const video of videos) {
        await fs.rename(
          path.join(artifactsDir, video),
          path.join(artifactsDir, 'videos', video)
        ).catch(() => {});
      }
    }

    console.log('🗂️  Test artifacts organized');

  } catch (error) {
    console.warn('⚠️  Could not organize test artifacts:', error);
  }
}

/**
 * Generate coverage report
 */
async function generateCoverageReport(): Promise<void> {
  // Placeholder for coverage report generation
  // This would typically integrate with Istanbul/nyc or similar tools
  console.log('📈 Coverage report generation placeholder');
}

/**
 * Clean up temporary files
 */
async function cleanupTemporaryFiles(): Promise<void> {
  const tempDirs = [
    process.env.TEST_CACHE_DIR,
    path.join(process.cwd(), '.tmp'),
    path.join(process.cwd(), 'tmp'),
  ].filter(Boolean) as string[];

  for (const tempDir of tempDirs) {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`🗑️  Cleaned up: ${tempDir}`);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Log final test summary
 */
async function logTestSummary(): Promise<void> {
  const summaryFile = path.join(process.cwd(), 'test-results', 'test-summary.json');
  
  try {
    const summary = JSON.parse(await fs.readFile(summaryFile, 'utf8'));
    
    console.log('\n📋 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${summary.summary.totalTests}`);
    console.log(`Passed: ${summary.summary.passed} ✅`);
    console.log(`Failed: ${summary.summary.failed} ${summary.summary.failed > 0 ? '❌' : '✅'}`);
    console.log(`Skipped: ${summary.summary.skipped}`);
    console.log(`Duration: ${Math.round(summary.summary.duration / 1000)}s`);
    console.log(`Success Rate: ${Math.round((summary.summary.passed / summary.summary.totalTests) * 100)}%`);
    
    console.log('\n🧪 TEST SUITES');
    Object.entries(summary.testSuites).forEach(([suite, results]: [string, any]) => {
      const status = results.success ? '✅' : '❌';
      console.log(`${suite}: ${results.passed}/${results.total} ${status}`);
    });

    if (summary.recommendations && summary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      summary.recommendations.forEach((rec: string, i: number) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

  } catch (error) {
    console.log('📋 Test summary not available');
  }
}

// Utility functions
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function identifyErrorPatterns(errors: any[]): string[] {
  const patterns: string[] = [];
  
  // Group errors by type
  const errorTypes = errors.reduce((acc: any, error) => {
    const type = error.error.split(':')[0] || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  Object.entries(errorTypes).forEach(([type, count]: [string, any]) => {
    if (count > 1) {
      patterns.push(`${type}: ${count} occurrences`);
    }
  });

  return patterns;
}

function analyzeTrends(metrics: any[]): any {
  // Placeholder for trend analysis
  return {
    performance: 'stable',
    memory: 'within_limits',
    network: 'optimized',
  };
}

function generatePerformanceRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];
  
  if (Array.isArray(metrics)) {
    const avgPageLoad = calculateAverage(metrics.map(m => m.pageLoad || 0));
    const avgMemory = calculateAverage(metrics.map(m => m.memoryUsage || 0));
    
    if (avgPageLoad > 3000) {
      recommendations.push('Page load times are above 3 seconds. Consider optimizing bundle size and lazy loading.');
    }
    
    if (avgMemory > 100) {
      recommendations.push('Memory usage is high. Consider implementing memory-efficient patterns.');
    }
  }
  
  return recommendations;
}

export default globalTeardown;