// Real User Monitoring (RUM) and Performance Tracking Service
// Comprehensive performance monitoring for Fantasy Football Analyzer

import { config, isFeatureEnabled } from '@/config/environment';

// Performance Metric Types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  tags: Record<string, string>;
  sessionId: string;
}

export interface NavigationMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay  
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  
  // Load Performance
  domContentLoaded: number;
  loadComplete: number;
  
  // Resource Loading
  resourceCount: number;
  totalResourceSize: number;
  
  // Network
  connectionType: string;
  effectiveType: string;
}

export interface APIMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  success: boolean;
  cacheHit: boolean;
  retryCount: number;
  timestamp: Date;
}

export interface UserInteractionMetrics {
  action: string;
  element: string;
  timestamp: Date;
  duration?: number;
  successful: boolean;
  errorMessage?: string;
}

export interface ErrorMetrics {
  message: string;
  stack: string;
  filename: string;
  lineno: number;
  colno: number;
  timestamp: Date;
  userAgent: string;
  url: string;
  userId?: string;
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: Date;
}

// Performance Monitoring Service
class PerformanceMonitorService {
  private sessionId: string;
  private startTime: number;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;
  private reportingEndpoint: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();
    this.reportingEndpoint = `/.netlify/functions/performance-metrics`;
    
    if (isFeatureEnabled('PERFORMANCE_MONITORING')) {
      this.initialize();
    }
  }

  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;
    console.log('📊 Performance Monitoring initialized');

    // Initialize Core Web Vitals monitoring
    this.initializeCoreWebVitals();
    
    // Initialize resource monitoring
    this.initializeResourceMonitoring();
    
    // Initialize user interaction monitoring
    this.initializeUserInteractionMonitoring();
    
    // Initialize error monitoring
    this.initializeErrorMonitoring();
    
    // Initialize memory monitoring
    this.initializeMemoryMonitoring();
    
    // Start periodic reporting
    this.startPeriodicReporting();
    
    // Report navigation metrics
    this.reportNavigationMetrics();
  }

  // Core Web Vitals Implementation
  private initializeCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        this.addMetric({
          name: 'lcp',
          value: lastEntry.startTime,
          unit: 'ms',
          timestamp: new Date(),
          tags: { type: 'core_web_vital' },
          sessionId: this.sessionId
        });
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    }

    // First Input Delay (FID) 
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.addMetric({
            name: 'fid',
            value: (entry as any).processingStart - entry.startTime,
            unit: 'ms',
            timestamp: new Date(),
            tags: { type: 'core_web_vital' },
            sessionId: this.sessionId
          });
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        
        this.addMetric({
          name: 'cls',
          value: clsValue,
          unit: 'count',
          timestamp: new Date(),
          tags: { type: 'core_web_vital' },
          sessionId: this.sessionId
        });
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  private initializeResourceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.addMetric({
            name: 'resource_load_time',
            value: entry.duration,
            unit: 'ms',
            timestamp: new Date(),
            tags: { 
              type: 'resource',
              resource_type: (entry as any).initiatorType,
              resource_name: entry.name.split('/').pop() || 'unknown'
            },
            sessionId: this.sessionId
          });
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  private initializeUserInteractionMonitoring(): void {
    // Track click events
    document.addEventListener('click', (event) => {
      const element = event.target as HTMLElement;
      const elementInfo = this.getElementInfo(element);
      
      this.trackUserInteraction({
        action: 'click',
        element: elementInfo,
        timestamp: new Date(),
        successful: true
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formInfo = this.getElementInfo(form);
      
      this.trackUserInteraction({
        action: 'form_submit',
        element: formInfo,
        timestamp: new Date(),
        successful: !event.defaultPrevented
      });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.addMetric({
        name: 'page_visibility',
        value: document.hidden ? 0 : 1,
        unit: 'count',
        timestamp: new Date(),
        tags: { type: 'user_interaction' },
        sessionId: this.sessionId
      });
    });
  }

  private getElementInfo(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const text = element.textContent?.slice(0, 20) || '';
    
    return `${tagName}${id}${className}${text ? `[${text}...]` : ''}`;
  }

  private initializeErrorMonitoring(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack || 'No stack trace available',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack || 'No stack trace available',
        filename: 'unknown',
        lineno: 0,
        colno: 0,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });
  }

  private initializeMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.trackMemoryUsage({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: new Date()
        });
      }, 30000); // Every 30 seconds
    }
  }

  private startPeriodicReporting(): void {
    // Report metrics every 60 seconds
    setInterval(() => {
      this.reportMetrics();
    }, 60000);

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.reportMetrics(true);
    });
  }

  // Public methods for tracking specific metrics
  public trackAPICall(metrics: APIMetrics): void {
    this.addMetric({
      name: 'api_response_time',
      value: metrics.responseTime,
      unit: 'ms',
      timestamp: metrics.timestamp,
      tags: {
        type: 'api',
        endpoint: metrics.endpoint,
        method: metrics.method,
        status: metrics.statusCode.toString(),
        success: metrics.success.toString(),
        cache_hit: metrics.cacheHit.toString(),
        retry_count: metrics.retryCount.toString()
      },
      sessionId: this.sessionId
    });
  }

  public trackUserInteraction(interaction: UserInteractionMetrics): void {
    this.addMetric({
      name: 'user_interaction',
      value: interaction.duration || 0,
      unit: 'ms',
      timestamp: interaction.timestamp,
      tags: {
        type: 'user_interaction',
        action: interaction.action,
        element: interaction.element,
        successful: interaction.successful.toString(),
        error: interaction.errorMessage || ''
      },
      sessionId: this.sessionId
    });
  }

  public trackError(error: ErrorMetrics): void {
    this.addMetric({
      name: 'javascript_error',
      value: 1,
      unit: 'count',
      timestamp: error.timestamp,
      tags: {
        type: 'error',
        message: error.message.slice(0, 100),
        filename: error.filename,
        line: error.lineno.toString(),
        column: error.colno.toString()
      },
      sessionId: this.sessionId
    });

    // Also report to external error tracking
    if (config.SENTRY_DSN) {
      console.error('Performance Monitor Error:', error);
    }
  }

  public trackMemoryUsage(memory: MemoryMetrics): void {
    this.addMetric({
      name: 'memory_usage',
      value: memory.usedJSHeapSize,
      unit: 'bytes',
      timestamp: memory.timestamp,
      tags: {
        type: 'memory',
        total_heap: memory.totalJSHeapSize.toString(),
        heap_limit: memory.jsHeapSizeLimit.toString(),
        usage_percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100).toString()
      },
      sessionId: this.sessionId
    });
  }

  public trackCustomMetric(name: string, value: number, unit: string, tags: Record<string, string> = {}): void {
    this.addMetric({
      name,
      value,
      unit: unit as any,
      timestamp: new Date(),
      tags: { ...tags, type: 'custom' },
      sessionId: this.sessionId
    });
  }

  // Fantasy Football specific tracking
  public trackDraftPerformance(draftAction: string, duration: number): void {
    this.trackCustomMetric('draft_action_time', duration, 'ms', {
      action: draftAction,
      feature: 'draft'
    });
  }

  public trackAIResponseTime(aiBackend: string, responseTime: number): void {
    this.trackCustomMetric('ai_response_time', responseTime, 'ms', {
      backend: aiBackend,
      feature: 'ai_coaching'
    });
  }

  public trackDataSourcePerformance(source: string, responseTime: number, success: boolean): void {
    this.trackCustomMetric('data_source_response', responseTime, 'ms', {
      source,
      success: success.toString(),
      feature: 'data_fetching'
    });
  }

  // Internal methods
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Limit metrics in memory (keep last 1000)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private async reportNavigationMetrics(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Wait for load event
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        
        if (navigation) {
          const metrics: NavigationMetrics = {
            lcp: 0, // Will be updated by observer
            fid: 0, // Will be updated by observer
            cls: 0, // Will be updated by observer
            fcp: this.getFirstContentfulPaint(),
            ttfb: navigation.responseStart - navigation.requestStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            loadComplete: navigation.loadEventEnd - navigation.navigationStart,
            resourceCount: performance.getEntriesByType('resource').length,
            totalResourceSize: this.getTotalResourceSize(),
            connectionType: this.getConnectionType(),
            effectiveType: this.getEffectiveConnectionType()
          };

          Object.entries(metrics).forEach(([key, value]) => {
            if (typeof value === 'number' && value > 0) {
              this.addMetric({
                name: key,
                value,
                unit: key.includes('Size') || key.includes('Count') ? 'bytes' : 'ms',
                timestamp: new Date(),
                tags: { type: 'navigation' },
                sessionId: this.sessionId
              });
            }
          });
        }
      }, 0);
    });
  }

  private getFirstContentfulPaint(): number {
    const entries = performance.getEntriesByType('paint');
    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private getTotalResourceSize(): number {
    const resources = performance.getEntriesByType('resource') as any[];
    return resources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? connection.type || 'unknown' : 'unknown';
  }

  private getEffectiveConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? connection.effectiveType || 'unknown' : 'unknown';
  }

  private async reportMetrics(isUnloading = false): Promise<void> {
    if (this.metrics.length === 0) return;

    const payload = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      environment: config.NODE_ENV,
      version: config.APP_VERSION,
      isUnloading
    };

    try {
      if (isUnloading && 'sendBeacon' in navigator) {
        // Use sendBeacon for unload events
        navigator.sendBeacon(
          this.reportingEndpoint,
          JSON.stringify(payload)
        );
      } else {
        // Use fetch for regular reporting
        await fetch(this.reportingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      // Clear reported metrics
      this.metrics = [];
    } catch (error) {
      console.warn('Failed to report performance metrics:', error);
    }
  }

  // Public API
  public getSessionMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getSessionSummary(): any {
    return {
      sessionId: this.sessionId,
      startTime: new Date(Date.now() - (performance.now() - this.startTime)),
      duration: performance.now() - this.startTime,
      metricsCount: this.metrics.length,
      isMonitoring: this.isInitialized,
      environment: config.NODE_ENV
    };
  }

  public dispose(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.reportMetrics(true);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitorService();

// Convenience wrapper functions
export const trackAPICall = (metrics: APIMetrics) => performanceMonitor.trackAPICall(metrics);
export const trackUserInteraction = (interaction: UserInteractionMetrics) => performanceMonitor.trackUserInteraction(interaction);
export const trackCustomMetric = (name: string, value: number, unit: string, tags?: Record<string, string>) => 
  performanceMonitor.trackCustomMetric(name, value, unit, tags);

// Fantasy Football specific helpers
export const trackDraftAction = (action: string, startTime: number) => {
  const duration = performance.now() - startTime;
  performanceMonitor.trackDraftPerformance(action, duration);
};

export const trackAIResponse = (backend: string, responseTime: number) => {
  performanceMonitor.trackAIResponseTime(backend, responseTime);
};

export const trackDataSource = (source: string, responseTime: number, success: boolean) => {
  performanceMonitor.trackDataSourcePerformance(source, responseTime, success);
};

// Development debugging
if (config.NODE_ENV === 'development') {
  (window as any).performanceMonitor = performanceMonitor;
  console.log('📊 Performance Monitor available on window.performanceMonitor');
}