import { useState, memo, useEffect, Suspense, useCallback } from 'react';
import { FantasyFootballProvider } from '@/contexts/FantasyFootballContext';
import { 
  DraftView, 
  ComparisonView, 
  RankingsView,
  SimulationView, 
  LiveDataView, 
  TrackerView, 
  AIView,
  NewsView,
  AdvancedAnalyticsView,
  LegacyView,
  preloadViews
} from '@/views';

import { HealthCheck, ErrorBoundary } from '@/components';
import { LazyWrapper } from '@/components/LazyWrapper';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { ViewType } from '@/types';
import { Users, BarChart3, Target, Play, Globe, Eye, Brain, Newspaper, TrendingUp, Activity } from 'lucide-react';
import { monitoring } from '@/utils/monitoring';
import { performanceMonitor, usePerformanceTracking } from '@/utils/performanceMonitor';

const App = memo(() => {
  const [currentView, setCurrentView] = useState<ViewType>('draft');
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const performanceTracking = usePerformanceTracking('App');

  useEffect(() => {
    // Initialize performance monitoring
    const initStart = performance.now();
    
    monitoring.trackPageView('/');
    
    // Track app initialization with performance monitoring
    const appInitialized = () => {
      const initTime = performance.now() - initStart;
      performanceMonitor.trackMetric('app-initialization', initTime, {
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        environment: import.meta.env.MODE || 'development'
      });
      
      monitoring.trackEvent('app_initialized', {
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        environment: import.meta.env.MODE || 'development',
        initTime
      });
    };

    // Preload critical views on idle time with performance tracking
    const preloadCriticalViews = () => {
      requestIdleCallback(() => {
        performanceMonitor.measureAsyncFunction('preload-critical-views', async () => {
          await Promise.all([
            preloadViews.simulation(),
            preloadViews.analytics()
          ]);
        });
      });
    };

    // Initialize app and start preloading
    appInitialized();
    setTimeout(preloadCriticalViews, 2000);

    // Cleanup monitoring on unmount
    return () => {
      monitoring.flush();
      performanceMonitor.destroy();
    };
  }, []);

  const navigationItems = [
    { id: 'draft' as ViewType, name: 'Draft Board', icon: Users },
    { id: 'compare' as ViewType, name: 'Player Comparison', icon: BarChart3 },
    { id: 'rankings' as ViewType, name: 'Custom Rankings', icon: Target },
    { id: 'simulation' as ViewType, name: 'Draft Simulation', icon: Play },
    { id: 'live-data' as ViewType, name: 'Live Data', icon: Globe },
    { id: 'draft-tracker' as ViewType, name: 'Draft Tracker', icon: Eye },
    { id: 'enhanced-ai' as ViewType, name: 'Enhanced AI', icon: Brain },
    { id: 'news' as ViewType, name: 'NFL News', icon: Newspaper },
    { id: 'analytics' as ViewType, name: 'Analytics', icon: TrendingUp },
    { id: 'legacy' as ViewType, name: 'Legacy View', icon: Target }, // For testing/migration
  ];

  // Memoized view components for performance
  const viewComponents = {
    'draft': useCallback(() => <DraftView />, []),
    'compare': useCallback(() => <ComparisonView />, []),
    'rankings': useCallback(() => <RankingsView />, []),
    'simulation': useCallback(() => (
      <LazyWrapper name="Simulation View">
        <SimulationView />
      </LazyWrapper>
    ), []),
    'live-data': useCallback(() => (
      <LazyWrapper name="Live Data View">
        <LiveDataView />
      </LazyWrapper>
    ), []),
    'draft-tracker': useCallback(() => (
      <LazyWrapper name="Draft Tracker">
        <TrackerView />
      </LazyWrapper>
    ), []),
    'enhanced-ai': useCallback(() => (
      <LazyWrapper name="AI Coach">
        <AIView />
      </LazyWrapper>
    ), []),
    'news': useCallback(() => (
      <LazyWrapper name="News Feed">
        <NewsView />
      </LazyWrapper>
    ), []),
    'analytics': useCallback(() => (
      <LazyWrapper name="Advanced Analytics">
        <AdvancedAnalyticsView />
      </LazyWrapper>
    ), []),
    'legacy': useCallback(() => (
      <LazyWrapper name="Legacy View">
        <LegacyView />
      </LazyWrapper>
    ), [])
  };

  const renderCurrentView = useCallback(() => {
    const ComponentToRender = viewComponents[currentView] || viewComponents['draft'];
    
    return (
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error(`Error in ${currentView} view:`, error, errorInfo);
          monitoring.trackEvent('component_error', {
            view: currentView,
            error: error.message,
            stack: error.stack
          });
        }}
      >
        <ComponentToRender />
      </ErrorBoundary>
    );
  }, [currentView, viewComponents]);

  return (
    <FantasyFootballProvider>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Fantasy Football Analyzer
                </h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  v2.0 - Performance Optimized
                </span>
                <button
                  onClick={() => setShowPerformanceDashboard(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Performance Dashboard"
                >
                  <Activity className="w-5 h-5" />
                </button>
              </div>
              
              {/* View Navigation */}
              <nav className="flex space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  const handleNavigation = useCallback(() => {
                    if (item.id === currentView) return; // Prevent unnecessary re-renders
                    
                    const navigationStart = performance.now();
                    
                    setCurrentView(item.id);
                    
                    // Track navigation performance
                    requestAnimationFrame(() => {
                      const navigationTime = performance.now() - navigationStart;
                      performanceMonitor.trackNavigation(currentView, item.id, navigationTime);
                    });
                    
                    monitoring.trackEvent('navigation_click', {
                      from: currentView,
                      to: item.id,
                      view_name: item.name
                    });
                    
                    // Preload adjacent views for faster navigation
                    const currentIndex = navigationItems.findIndex(nav => nav.id === item.id);
                    const nextItem = navigationItems[currentIndex + 1];
                    const prevItem = navigationItems[currentIndex - 1];
                    
                    requestIdleCallback(() => {
                      if (nextItem?.id && preloadViews[nextItem.id as keyof typeof preloadViews]) {
                        preloadViews[nextItem.id as keyof typeof preloadViews]();
                      }
                      if (prevItem?.id && preloadViews[prevItem.id as keyof typeof preloadViews]) {
                        preloadViews[prevItem.id as keyof typeof preloadViews]();
                      }
                    });
                  }, [item.id, item.name, currentView]);
                  
                  const handleMouseEnter = useCallback(() => {
                    // Preload on hover for instant navigation
                    if (item.id in preloadViews) {
                      requestIdleCallback(() => {
                        preloadViews[item.id as keyof typeof preloadViews]();
                      });
                    }
                  }, [item.id]);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={handleNavigation}
                      onMouseEnter={handleMouseEnter}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderCurrentView()}
        </main>

        {/* Health Check Component */}
        <HealthCheck />

        {/* Performance Dashboard Modal */}
        <PerformanceDashboard
          isOpen={showPerformanceDashboard}
          onClose={() => setShowPerformanceDashboard(false)}
        />
      </div>
    </FantasyFootballProvider>
  );
});

App.displayName = 'App';

export default App;