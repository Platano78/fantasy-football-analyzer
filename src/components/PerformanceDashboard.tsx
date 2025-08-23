/**
 * Performance monitoring dashboard component
 * Displays real-time performance metrics, cache statistics, and optimization insights
 */

import React, { memo, useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Zap, 
  Database, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Cpu,
  HardDrive,
  Wifi,
  X
} from 'lucide-react';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { useCacheMonitoring } from '@/hooks/usePerformanceCache';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Memoized metric card component
const MetricCard = memo(({ 
  title, 
  value, 
  unit, 
  trend, 
  status, 
  icon: Icon,
  description 
}: {
  title: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
  description?: string;
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <h4 className="font-medium text-sm">{title}</h4>
        </div>
        {trend && getTrendIcon()}
      </div>
      
      <div className="mb-1">
        <span className="text-2xl font-bold">{value.toFixed(1)}</span>
        <span className="text-sm ml-1">{unit}</span>
      </div>
      
      {description && (
        <p className="text-xs opacity-80">{description}</p>
      )}
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

// Web Vitals component
const WebVitalsSection = memo(({ vitals }: { vitals: ReturnType<typeof performanceMonitor.getWebVitals> }) => {

  const getVitalStatus = (rating: string) => {
    switch (rating) {
      case 'good': return 'good';
      case 'needs-improvement': return 'warning';
      case 'poor': return 'critical';
      default: return 'good';
    }
  };

  const latestVitals = useMemo(() => {
    return vitals.reduce((latest, vital) => {
      if (!latest[vital.name] || vital.timestamp > latest[vital.name].timestamp) {
        latest[vital.name] = vital;
      }
      return latest;
    }, {} as Record<string, typeof vitals[0]>);
  }, [vitals]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5" />
        Core Web Vitals
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['LCP', 'FID', 'CLS'].map(metric => {
          const vital = latestVitals[metric];
          return vital ? (
            <MetricCard
              key={metric}
              title={metric}
              value={vital.value}
              unit={metric === 'CLS' ? '' : 'ms'}
              status={getVitalStatus(vital.rating)}
              icon={Clock}
              description={`${vital.rating.replace('-', ' ')}`}
            />
          ) : (
            <div key={metric} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <h4 className="font-medium text-sm text-gray-600">{metric}</h4>
              </div>
              <p className="text-sm text-gray-500">Not available</p>
            </div>
          );
        })}
      </div>
    </div>
  );
});

WebVitalsSection.displayName = 'WebVitalsSection';

// Cache performance section
const CacheSection = memo(() => {
  const dataCache = useCacheMonitoring('data');
  const apiCache = useCacheMonitoring('api');
  const uiCache = useCacheMonitoring('ui');

  const caches = [
    { name: 'Data Cache', ...dataCache },
    { name: 'API Cache', ...apiCache },
    { name: 'UI Cache', ...uiCache }
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Database className="w-5 h-5" />
        Cache Performance
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {caches.map(cache => (
          <div key={cache.name} className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{cache.name}</h4>
              <button
                onClick={cache.clearCache}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Entries:</span>
                <span className="font-medium">{cache.stats?.size || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Hit Rate:</span>
                <span className="font-medium">{(cache.hitRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium">{Math.round((cache.stats?.currentSize || 0) / 1024)}KB</span>
              </div>
              <div className="flex justify-between">
                <span>Total Hits:</span>
                <span className="font-medium">{cache.stats?.totalHits || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

CacheSection.displayName = 'CacheSection';

// Performance metrics section
const MetricsSection = memo(({ summary }: { summary: ReturnType<typeof performanceMonitor.getSummary> }) => {

  const getMetricStatus = (metricName: string, avgValue: number) => {
    const thresholds = {
      'component-render': { good: 16, warning: 50 },
      'api-call': { good: 500, warning: 2000 },
      'navigation': { good: 1000, warning: 3000 },
      'bundle-load': { good: 2000, warning: 5000 }
    };

    const threshold = thresholds[metricName as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (avgValue <= threshold.good) return 'good';
    if (avgValue <= threshold.warning) return 'warning';
    return 'critical';
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Performance Metrics
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(summary.summary).map(([metricName, stats]) => (
          <MetricCard
            key={metricName}
            title={metricName.replace('-', ' ')}
            value={stats.avg}
            unit="ms"
            status={getMetricStatus(metricName, stats.avg)}
            icon={Activity}
            description={`P95: ${stats.p95.toFixed(1)}ms`}
          />
        ))}
      </div>
      
      {summary.recentCount > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Recent Activity</span>
          </div>
          <p className="text-sm text-blue-800">
            {summary.recentCount} metrics collected in the last 5 minutes
          </p>
        </div>
      )}
    </div>
  );
});

MetricsSection.displayName = 'MetricsSection';

// Browser information section
const BrowserInfoSection = memo(() => {
  const [browserInfo] = useState(() => {
    if (typeof navigator === 'undefined') return null;
    
    return {
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection,
      memory: (performance as any).memory,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency
    };
  });

  const connectionType = browserInfo?.connection?.effectiveType || 'unknown';
  const memoryUsage = browserInfo?.memory ? 
    Math.round(browserInfo.memory.usedJSHeapSize / 1024 / 1024) : 0;
  const memoryLimit = browserInfo?.memory ? 
    Math.round(browserInfo.memory.jsHeapSizeLimit / 1024 / 1024) : 0;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Cpu className="w-5 h-5" />
        System Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Cores"
          value={browserInfo?.hardwareConcurrency || 0}
          unit="cores"
          icon={Cpu}
        />
        
        <MetricCard
          title="Device Memory"
          value={browserInfo?.deviceMemory || 0}
          unit="GB"
          icon={HardDrive}
        />
        
        <MetricCard
          title="JS Heap Used"
          value={memoryUsage}
          unit={`MB / ${memoryLimit}MB`}
          status={memoryUsage > memoryLimit * 0.8 ? 'warning' : 'good'}
          icon={HardDrive}
        />
        
        <MetricCard
          title="Connection"
          value={0}
          unit={connectionType}
          icon={Wifi}
          description={`Network: ${connectionType}`}
        />
      </div>
    </div>
  );
});

BrowserInfoSection.displayName = 'BrowserInfoSection';

// Main dashboard component
export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = memo(({ 
  isOpen, 
  onClose 
}) => {
  // Consolidated state for all performance metrics
  const [vitals, setVitals] = useState(performanceMonitor.getWebVitals());
  const [summary, setSummary] = useState(performanceMonitor.getSummary());

  // Single consolidated interval for all data updates
  useEffect(() => {
    if (!isOpen) return;

    const updateAllMetrics = () => {
      setVitals(performanceMonitor.getWebVitals());
      setSummary(performanceMonitor.getSummary());
    };

    const interval = setInterval(updateAllMetrics, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportData = () => {
    const data = performanceMonitor.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearMetrics = () => {
    performanceMonitor.clear();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] overflow-auto w-full">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Performance Dashboard
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportData}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Export Data
            </button>
            <button
              onClick={handleClearMetrics}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Clear Metrics
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          <WebVitalsSection vitals={vitals} />
          <MetricsSection summary={summary} />
          <CacheSection />
          <BrowserInfoSection />
        </div>
      </div>
    </div>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';