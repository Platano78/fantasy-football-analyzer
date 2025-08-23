/**
 * Comprehensive performance monitoring utilities
 * Tracks Core Web Vitals, custom metrics, and provides performance insights
 */

interface PerformanceEntry {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface WebVital {
  name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceEntry[] = [];
  private webVitals: WebVital[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled = true;

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
      this.startWebVitalsCollection();
    }
  }

  /**
   * Track custom performance metric
   */
  trackMetric(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const entry: PerformanceEntry = {
      name,
      value,
      timestamp: performance.now(),
      metadata
    };

    this.metrics.push(entry);

    // Log significant performance issues
    if (value > this.getThreshold(name)) {
      console.warn(`Performance threshold exceeded for ${name}: ${value}ms`);
    }

    // Keep only last 1000 entries to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Measure and track function execution time
   */
  measureFunction<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.trackMetric(name, duration, metadata);
    return result;
  }

  /**
   * Measure and track async function execution time
   */
  async measureAsyncFunction<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.trackMetric(name, duration, metadata);
    return result;
  }

  /**
   * Track component render performance
   */
  trackRender(componentName: string, renderTime: number, props?: any): void {
    this.trackMetric(`render:${componentName}`, renderTime, {
      type: 'component-render',
      propsSize: props ? JSON.stringify(props).length : 0
    });
  }

  /**
   * Track navigation performance
   */
  trackNavigation(from: string, to: string, duration: number): void {
    this.trackMetric('navigation', duration, {
      type: 'route-change',
      from,
      to
    });
  }

  /**
   * Track API call performance
   */
  trackApiCall(endpoint: string, duration: number, success: boolean): void {
    this.trackMetric(`api:${endpoint}`, duration, {
      type: 'api-call',
      success,
      status: success ? 'success' : 'error'
    });
  }

  /**
   * Track bundle load performance
   */
  trackBundleLoad(bundleName: string, size: number, duration: number): void {
    this.trackMetric(`bundle:${bundleName}`, duration, {
      type: 'bundle-load',
      size,
      sizeKb: Math.round(size / 1024)
    });
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp < 300000 // Last 5 minutes
    );

    const metricsByType = this.groupBy(recentMetrics, 'name');
    const summary: Record<string, any> = {};

    for (const [name, entries] of Object.entries(metricsByType)) {
      const values = entries.map(e => e.value);
      summary[name] = {
        count: values.length,
        avg: this.average(values),
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 95),
        total: values.reduce((sum, v) => sum + v, 0)
      };
    }

    return {
      summary,
      webVitals: this.webVitals,
      recentCount: recentMetrics.length,
      totalMetrics: this.metrics.length
    };
  }

  /**
   * Get Core Web Vitals
   */
  getWebVitals(): WebVital[] {
    return [...this.webVitals];
  }

  /**
   * Export performance data for analysis
   */
  exportData() {
    return {
      metrics: this.metrics,
      webVitals: this.webVitals,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  /**
   * Clear all collected data
   */
  clear(): void {
    this.metrics = [];
    this.webVitals = [];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    try {
      // Long Task Observer
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackMetric('long-task', entry.duration, {
            type: 'long-task',
            startTime: entry.startTime
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);

      // Navigation Observer
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          this.trackMetric('page-load', navEntry.loadEventEnd - navEntry.fetchStart, {
            type: 'navigation',
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
            firstByte: navEntry.responseStart - navEntry.fetchStart
          });
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Resource Observer
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.name.includes('.js') || resourceEntry.name.includes('.css')) {
            this.trackMetric('resource-load', entry.duration, {
              type: 'resource',
              name: entry.name,
              size: resourceEntry.transferSize
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
    }
  }

  /**
   * Start Web Vitals collection
   */
  private startWebVitalsCollection(): void {
    // Import web-vitals library functionality inline to avoid dependency
    this.collectLCP();
    this.collectFID();
    this.collectCLS();
  }

  /**
   * Collect Largest Contentful Paint
   */
  private collectLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.webVitals.push({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: this.getRating('LCP', lastEntry.startTime),
          timestamp: Date.now()
        });
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP collection failed:', error);
    }
  }

  /**
   * Collect First Input Delay
   */
  private collectFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any;
          this.webVitals.push({
            name: 'FID',
            value: fidEntry.processingStart - fidEntry.startTime,
            rating: this.getRating('FID', fidEntry.processingStart - fidEntry.startTime),
            timestamp: Date.now()
          });
        }
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID collection failed:', error);
    }
  }

  /**
   * Collect Cumulative Layout Shift
   */
  private collectCLS(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        }
        
        this.webVitals.push({
          name: 'CLS',
          value: clsValue,
          rating: this.getRating('CLS', clsValue),
          timestamp: Date.now()
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS collection failed:', error);
    }
  }

  /**
   * Get performance threshold for metric
   */
  private getThreshold(metricName: string): number {
    const thresholds: Record<string, number> = {
      'component-render': 16, // 60fps
      'api-call': 1000, // 1 second
      'navigation': 2000, // 2 seconds
      'bundle-load': 3000, // 3 seconds
      'long-task': 50 // 50ms
    };

    return thresholds[metricName] || 100;
  }

  /**
   * Get Web Vital rating
   */
  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Group array by key
   */
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Calculate average of array
   */
  private average(values: number[]): number {
    return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  /**
   * Calculate percentile of array
   */
  private percentile(values: number[], percentile: number): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  return {
    trackRender: (renderTime: number, props?: any) => 
      performanceMonitor.trackRender(componentName, renderTime, props),
    measureFunction: <T>(name: string, fn: () => T) => 
      performanceMonitor.measureFunction(`${componentName}:${name}`, fn),
    measureAsyncFunction: <T>(name: string, fn: () => Promise<T>) => 
      performanceMonitor.measureAsyncFunction(`${componentName}:${name}`, fn)
  };
}

export { PerformanceMonitor };