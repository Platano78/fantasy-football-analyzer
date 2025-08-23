// Monitoring and analytics utilities for production deployment

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Extended PerformanceEntry interfaces for Web Vitals
interface PerformanceEntryWithProcessing extends PerformanceEntry {
  processingStart?: number;
  hadRecentInput?: boolean;
}

interface PerformanceResourceTimingExtended extends PerformanceResourceTiming {
  loadEnd: number;
  loadStart: number;
}

interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private metricsBuffer: PerformanceMetric[] = [];
  private errorBuffer: ErrorReport[] = [];
  private analyticsEnabled: boolean;
  private debugMode: boolean;

  constructor() {
    this.analyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
    this.debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
    
    if (this.analyticsEnabled) {
      this.initializeAnalytics();
      this.initializeErrorTracking();
      this.initializePerformanceMonitoring();
    }
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializeAnalytics() {
    // Initialize analytics (PostHog, Google Analytics, etc.)
    if (typeof window !== 'undefined') {
      // Track page views
      this.trackPageView(window.location.pathname);
      
      // Track performance metrics
      window.addEventListener('load', () => {
        this.trackLoadPerformance();
      });

      // Track user interactions
      document.addEventListener('click', this.trackUserInteraction.bind(this));
    }
  }

  private initializeErrorTracking() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleError.bind(this));
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }
  }

  private initializePerformanceMonitoring() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Monitor Core Web Vitals
      this.observeWebVitals();
      
      // Monitor resource loading
      this.observeResources();
    }
  }

  // Track page views
  trackPageView(path: string) {
    if (!this.analyticsEnabled) return;

    const metric: PerformanceMetric = {
      name: 'page_view',
      value: 1,
      timestamp: Date.now(),
      metadata: {
        path,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      }
    };

    this.addMetric(metric);
    this.debugLog('Page view tracked:', path);
  }

  // Track user interactions
  private trackUserInteraction(event: Event) {
    if (!this.analyticsEnabled) return;

    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    
    // Only track meaningful interactions
    if (['button', 'a', 'input'].includes(tagName)) {
      const metric: PerformanceMetric = {
        name: 'user_interaction',
        value: 1,
        timestamp: Date.now(),
        metadata: {
          element: tagName,
          text: target.textContent?.slice(0, 50),
          className: target.className
        }
      };

      this.addMetric(metric);
    }
  }

  // Track custom events
  trackEvent(eventName: string, properties: Record<string, any> = {}) {
    if (!this.analyticsEnabled) return;

    const metric: PerformanceMetric = {
      name: eventName,
      value: 1,
      timestamp: Date.now(),
      metadata: properties
    };

    this.addMetric(metric);
    this.debugLog('Event tracked:', eventName, properties);
  }

  // Track performance metrics
  trackPerformance(name: string, value: number, metadata?: Record<string, any>) {
    if (!this.analyticsEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.addMetric(metric);
    this.debugLog('Performance tracked:', name, value);
  }

  // Error handling
  private handleError(event: ErrorEvent) {
    const errorReport: ErrorReport = {
      message: event.message,
      stack: event.error?.stack,
      timestamp: Date.now(),
      url: event.filename || window.location.href,
      userAgent: navigator.userAgent,
      metadata: {
        line: event.lineno,
        column: event.colno
      }
    };

    this.addError(errorReport);
  }

  private handlePromiseRejection(event: PromiseRejectionEvent) {
    const errorReport: ErrorReport = {
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata: {
        type: 'promise_rejection'
      }
    };

    this.addError(errorReport);
  }

  // Performance monitoring
  private observeWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.trackPerformance('lcp', lastEntry.startTime, {
        element: (lastEntry as any).element?.tagName
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const extendedEntry = entry as PerformanceEntryWithProcessing;
        if (extendedEntry.processingStart !== undefined) {
          this.trackPerformance('fid', extendedEntry.processingStart - entry.startTime);
        }
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const extendedEntry = entry as PerformanceEntryWithProcessing;
        if (!extendedEntry.hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      this.trackPerformance('cls', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private observeResources() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTimingExtended;
          if (resourceEntry.loadEnd && resourceEntry.loadStart) {
            this.trackPerformance('resource_load_time', resourceEntry.loadEnd - resourceEntry.loadStart, {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType,
              size: resourceEntry.transferSize || 0
            });
          }
        }
      });
    }).observe({ entryTypes: ['resource'] });
  }

  private trackLoadPerformance() {
    if (performance.timing) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

      this.trackPerformance('page_load_time', loadTime);
      this.trackPerformance('dom_ready_time', domReady);
    }

    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.trackPerformance('ttfb', navigation.responseStart - navigation.requestStart);
      }
    }
  }

  // Buffer management
  private addMetric(metric: PerformanceMetric) {
    this.metricsBuffer.push(metric);
    
    if (this.metricsBuffer.length >= 50) {
      this.flushMetrics();
    }
  }

  private addError(error: ErrorReport) {
    this.errorBuffer.push(error);
    
    // Send errors immediately
    this.flushErrors();
  }

  private flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    // In a real implementation, send to analytics service
    this.debugLog('Flushing metrics:', this.metricsBuffer.length);
    
    // Clear buffer
    this.metricsBuffer = [];
  }

  private flushErrors() {
    if (this.errorBuffer.length === 0) return;

    // In a real implementation, send to error tracking service (Sentry, etc.)
    console.error('Error reports:', this.errorBuffer);
    
    // Clear buffer
    this.errorBuffer = [];
  }

  private debugLog(...args: any[]) {
    if (this.debugMode) {
      console.log('[Monitoring]', ...args);
    }
  }

  // Public API for manual flushing
  flush() {
    this.flushMetrics();
    this.flushErrors();
  }

  // Health check
  getHealthStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      build: import.meta.env.__BUILD_TIME__ || 'unknown',
      metricsBufferSize: this.metricsBuffer.length,
      errorBufferSize: this.errorBuffer.length,
      analyticsEnabled: this.analyticsEnabled
    };
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// Export types for external use
export type { PerformanceMetric, ErrorReport };