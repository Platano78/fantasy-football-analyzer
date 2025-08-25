/**
 * Enhanced Performance Dashboard with Real-time Monitoring
 * Provides comprehensive performance insights and optimization recommendations
 */

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { 
  Activity, BarChart3, Clock, Cpu, Database, Eye, 
  Gauge, Memory, Monitor, Optimize, RefreshCw, Settings,
  TrendingDown, TrendingUp, Users, Wifi, X, Zap,
  AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { useCacheMonitoring, useMemoryMonitor } from '@/hooks/useMemoryOptimization';
import { useBatchingPerformanceMonitor } from '@/hooks/useBatchedUpdates';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PerformanceMetrics {
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  customMetrics: {
    bundleSize: number;
    renderTime: number;
    navigationTime: number;
    apiResponseTime: number;
    memoryUsage: number;
  };
  optimization: {
    cacheHitRate: number;
    renderSavings: number;
    batchingEfficiency: number;
    componentCount: number;
    rerenderCount: number;
  };
}

interface RecommendationItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  action?: () => void;
  actionLabel?: string;
}

// ============================================================================
// PERFORMANCE METRICS HOOKS
// ============================================================================

function usePerformanceMetrics(): [PerformanceMetrics, () => void] {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    coreWebVitals: { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0 },
    customMetrics: { bundleSize: 0, renderTime: 0, navigationTime: 0, apiResponseTime: 0, memoryUsage: 0 },
    optimization: { cacheHitRate: 0, renderSavings: 0, batchingEfficiency: 0, componentCount: 0, rerenderCount: 0 }
  });

  const memoryMonitor = useMemoryMonitor();
  const cacheStats = useCacheMonitoring('data');
  const batchingStats = useBatchingPerformanceMonitor();

  const updateMetrics = useCallback(() => {
    const summary = performanceMonitor.getSummary();
    const webVitals = performanceMonitor.getWebVitals();
    const batchMetrics = batchingStats.getMetrics();

    setMetrics({
      coreWebVitals: {
        lcp: webVitals.find(v => v.name === 'LCP')?.value || 0,
        fid: webVitals.find(v => v.name === 'FID')?.value || 0,
        cls: webVitals.find(v => v.name === 'CLS')?.value || 0,
        fcp: webVitals.find(v => v.name === 'FCP')?.value || 0,
        ttfb: webVitals.find(v => v.name === 'TTFB')?.value || 0,
      },
      customMetrics: {
        bundleSize: (performance as any).memory?.totalJSHeapSize || 0,
        renderTime: summary.summary['component-render']?.avg || 0,
        navigationTime: summary.summary['navigation']?.avg || 0,
        apiResponseTime: summary.summary['api-call']?.avg || 0,
        memoryUsage: memoryMonitor.memoryInfo.usedJSHeapSize || 0,
      },
      optimization: {
        cacheHitRate: cacheStats.hitRate,
        renderSavings: batchingStats.getPerformanceGain(),
        batchingEfficiency: batchMetrics.totalBatches > 0 ? 
          (batchMetrics.savedRenders / batchMetrics.totalIndividualUpdates) * 100 : 0,
        componentCount: Object.keys(summary.summary).filter(key => key.startsWith('component-')).length,
        rerenderCount: Object.values(summary.summary).reduce((sum, metric) => sum + (metric?.count || 0), 0),
      }
    });
  }, [memoryMonitor, cacheStats, batchingStats]);

  return [metrics, updateMetrics];
}

function usePerformanceRecommendations(metrics: PerformanceMetrics): RecommendationItem[] {
  return useMemo(() => {
    const recommendations: RecommendationItem[] = [];

    // Core Web Vitals recommendations
    if (metrics.coreWebVitals.lcp > 2500) {
      recommendations.push({
        id: 'lcp-slow',
        type: 'critical',
        title: 'Slow Largest Contentful Paint',
        description: `LCP is ${(metrics.coreWebVitals.lcp / 1000).toFixed(1)}s. Target < 2.5s`,
        impact: 'high',
        effort: 'medium',
        actionLabel: 'Optimize Images & Fonts'
      });
    }

    if (metrics.coreWebVitals.cls > 0.1) {
      recommendations.push({
        id: 'cls-high',
        type: 'warning',
        title: 'Layout Shift Issues',
        description: `CLS score of ${metrics.coreWebVitals.cls.toFixed(3)}. Target < 0.1`,
        impact: 'medium',
        effort: 'low',
        actionLabel: 'Fix Layout Shifts'
      });
    }

    // Rendering performance
    if (metrics.customMetrics.renderTime > 16) {
      recommendations.push({
        id: 'slow-renders',
        type: 'warning',
        title: 'Slow Component Renders',
        description: `Average render time ${metrics.customMetrics.renderTime.toFixed(1)}ms. Target < 16ms`,
        impact: 'high',
        effort: 'medium',
        actionLabel: 'Optimize Components'
      });
    }

    // Memory usage
    const memoryUsageMB = metrics.customMetrics.memoryUsage / (1024 * 1024);
    if (memoryUsageMB > 50) {
      recommendations.push({
        id: 'high-memory',
        type: 'warning',
        title: 'High Memory Usage',
        description: `Using ${memoryUsageMB.toFixed(1)}MB of memory. Consider optimization`,
        impact: 'medium',
        effort: 'medium',
        actionLabel: 'Clear Caches'
      });
    }

    // Cache efficiency
    if (metrics.optimization.cacheHitRate < 0.7) {
      recommendations.push({
        id: 'poor-cache',
        type: 'info',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate of ${(metrics.optimization.cacheHitRate * 100).toFixed(1)}%. Target > 70%`,
        impact: 'medium',
        effort: 'low',
        actionLabel: 'Optimize Caching'
      });
    }

    // Batching efficiency
    if (metrics.optimization.batchingEfficiency < 50) {
      recommendations.push({
        id: 'poor-batching',
        type: 'info',
        title: 'Improve Update Batching',
        description: `Only ${metrics.optimization.batchingEfficiency.toFixed(1)}% batching efficiency`,
        impact: 'medium',
        effort: 'medium',
        actionLabel: 'Enable More Batching'
      });
    }

    // Success messages
    if (metrics.coreWebVitals.lcp <= 2500 && metrics.coreWebVitals.cls <= 0.1) {
      recommendations.push({
        id: 'good-vitals',
        type: 'success',
        title: 'Excellent Core Web Vitals',
        description: 'Your app meets Core Web Vitals thresholds',
        impact: 'low',
        effort: 'low'
      });
    }

    return recommendations;
  }, [metrics]);
}

// ============================================================================
// DASHBOARD COMPONENTS
// ============================================================================

const MetricCard = memo<{
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  target?: string;
  status?: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
}>(({ title, value, unit = '', trend, target, status = 'good', icon: Icon }) => {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: () => null
  };

  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-gray-600" />
        {TrendIcon && <TrendIcon className={`w-4 h-4 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
        {target && (
          <div className="text-xs text-gray-500">Target: {target}</div>
        )}
      </div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

const RecommendationCard = memo<{
  recommendation: RecommendationItem;
  onAction?: (id: string) => void;
}>(({ recommendation, onAction }) => {
  const typeConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-500' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle, iconColor: 'text-yellow-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-500' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, iconColor: 'text-green-500' }
  };

  const config = typeConfig[recommendation.type];
  const IconComponent = config.icon;

  return (
    <div className={`p-4 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <IconComponent className={`w-5 h-5 mt-0.5 ${config.iconColor}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
            <div className="flex gap-1">
              <span className={`px-2 py-1 text-xs rounded ${
                recommendation.impact === 'high' ? 'bg-red-100 text-red-700' :
                recommendation.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {recommendation.impact} impact
              </span>
              <span className={`px-2 py-1 text-xs rounded ${
                recommendation.effort === 'high' ? 'bg-red-100 text-red-700' :
                recommendation.effort === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {recommendation.effort} effort
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
          {recommendation.actionLabel && (
            <button
              onClick={() => onAction?.(recommendation.id)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {recommendation.actionLabel} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

RecommendationCard.displayName = 'RecommendationCard';

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

interface EnhancedPerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedPerformanceDashboard: React.FC<EnhancedPerformanceDashboardProps> = memo(({
  isOpen,
  onClose
}) => {
  const [metrics, updateMetrics] = usePerformanceMetrics();
  const recommendations = usePerformanceRecommendations(metrics);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'optimization' | 'recommendations'>('overview');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Auto-refresh metrics
  useEffect(() => {
    if (!isAutoRefresh || !isOpen) return;

    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, isOpen, updateMetrics]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      updateMetrics();
    }
  }, [isOpen, updateMetrics]);

  const handleRecommendationAction = useCallback((id: string) => {
    switch (id) {
      case 'high-memory':
        // Clear caches
        if ('gc' in window) {
          (window as any).gc();
        }
        break;
      case 'poor-cache':
        // Cache optimization suggestions
        console.log('Cache optimization suggestions logged');
        break;
      // Add more action handlers as needed
    }
    updateMetrics();
  }, [updateMetrics]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Performance Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`p-2 rounded transition-colors ${
                isAutoRefresh ? 'bg-blue-100 text-blue-600' : 'text-gray-400'
              }`}
              title={`Auto-refresh ${isAutoRefresh ? 'enabled' : 'disabled'}`}
            >
              <RefreshCw className={`w-4 h-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={updateMetrics}
              className="p-2 text-gray-600 hover:text-gray-900 rounded transition-colors"
              title="Refresh now"
            >
              <Gauge className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b px-6">
          {[
            { id: 'overview', label: 'Overview', icon: Monitor },
            { id: 'vitals', label: 'Core Web Vitals', icon: Zap },
            { id: 'optimization', label: 'Optimization', icon: Optimize },
            { id: 'recommendations', label: 'Recommendations', icon: Settings }
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Bundle Size"
                value={(metrics.customMetrics.bundleSize / 1024 / 1024).toFixed(1)}
                unit="MB"
                target="< 1MB"
                status={metrics.customMetrics.bundleSize > 1024 * 1024 ? 'warning' : 'good'}
                icon={Database}
              />
              <MetricCard
                title="Render Time"
                value={metrics.customMetrics.renderTime.toFixed(1)}
                unit="ms"
                target="< 16ms"
                status={metrics.customMetrics.renderTime > 16 ? 'warning' : 'good'}
                icon={Clock}
              />
              <MetricCard
                title="Memory Usage"
                value={(metrics.customMetrics.memoryUsage / 1024 / 1024).toFixed(1)}
                unit="MB"
                target="< 50MB"
                status={metrics.customMetrics.memoryUsage > 50 * 1024 * 1024 ? 'warning' : 'good'}
                icon={Memory}
              />
              <MetricCard
                title="Cache Hit Rate"
                value={(metrics.optimization.cacheHitRate * 100).toFixed(1)}
                unit="%"
                target="> 70%"
                status={metrics.optimization.cacheHitRate < 0.7 ? 'warning' : 'good'}
                icon={Cpu}
              />
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Largest Contentful Paint"
                value={(metrics.coreWebVitals.lcp / 1000).toFixed(2)}
                unit="s"
                target="< 2.5s"
                status={metrics.coreWebVitals.lcp > 2500 ? 'critical' : metrics.coreWebVitals.lcp > 1800 ? 'warning' : 'good'}
                icon={Eye}
              />
              <MetricCard
                title="First Input Delay"
                value={metrics.coreWebVitals.fid.toFixed(0)}
                unit="ms"
                target="< 100ms"
                status={metrics.coreWebVitals.fid > 300 ? 'critical' : metrics.coreWebVitals.fid > 100 ? 'warning' : 'good'}
                icon={Users}
              />
              <MetricCard
                title="Cumulative Layout Shift"
                value={metrics.coreWebVitals.cls.toFixed(3)}
                target="< 0.1"
                status={metrics.coreWebVitals.cls > 0.25 ? 'critical' : metrics.coreWebVitals.cls > 0.1 ? 'warning' : 'good'}
                icon={BarChart3}
              />
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                title="Render Savings"
                value={metrics.optimization.renderSavings.toFixed(1)}
                unit="%"
                target="> 50%"
                status={metrics.optimization.renderSavings < 30 ? 'warning' : 'good'}
                icon={TrendingUp}
              />
              <MetricCard
                title="Active Components"
                value={metrics.optimization.componentCount}
                target="Monitor"
                icon={Users}
              />
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Good!</h3>
                  <p className="text-gray-600">No performance issues detected.</p>
                </div>
              ) : (
                recommendations.map(recommendation => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onAction={handleRecommendationAction}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

EnhancedPerformanceDashboard.displayName = 'EnhancedPerformanceDashboard';

export { EnhancedPerformanceDashboard };
export default EnhancedPerformanceDashboard;