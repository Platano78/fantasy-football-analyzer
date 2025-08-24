import { useState, memo, useEffect, useCallback } from 'react';
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
  NFLLeagueSyncView,
  LegacyView,
  preloadViews
} from '@/views';

import { HealthCheck, ErrorBoundary } from '@/components';
import { AIBackendStatus } from '@/components/ai/AIBackendStatus';
import { LazyWrapper } from '@/components/LazyWrapper';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { ViewType } from '@/types';
import { Users, BarChart3, Target, Play, Globe, Eye, Brain, Newspaper, TrendingUp, Activity, Settings, Zap } from 'lucide-react';
import { monitoring } from '@/utils/monitoring';
import { performanceMonitor } from '@/utils/performanceMonitor';

// Import enhanced services
import { config, validateConfiguration, getConfigSummary } from '@/config/environment';
import { isFeatureFlagEnabled } from '@/config/featureFlags';
import { performanceMonitor as rumPerformanceMonitor } from '@/services/PerformanceMonitor';
import { hybridAIService } from '@/services/HybridAIService';
import { browserMCPService } from '@/services/BrowserMCPService';

const App = memo(() => {
  const [currentView, setCurrentView] = useState<ViewType>('draft');
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [showAIStatus, setShowAIStatus] = useState(false);

  useEffect(() => {
    // Initialize enhanced services and monitoring
    const initStart = performance.now();
    
    console.log('🚀 Initializing Fantasy Football Analyzer v2.0');
    
    // Validate configuration
    const configValidation = validateConfiguration();
    if (!configValidation.valid) {
      console.error('❌ Configuration validation failed:', configValidation.errors);
    } else {
      console.log('✅ Configuration validated successfully');
    }
    
    // Log configuration summary
    console.log('🔧 Configuration Summary:', getConfigSummary());
    
    monitoring.trackPageView('/');
    
    // Initialize services based on feature flags
    const initializeServices = async () => {
      try {
        // Initialize RUM Performance Monitor if enabled
        if (isFeatureFlagEnabled('PERFORMANCE_MONITORING')) {
          console.log('📊 Initializing RUM Performance Monitoring');
          // RUM monitor initializes automatically
        }

        // Initialize Browser MCP Service if enabled
        if (isFeatureFlagEnabled('BROWSER_MCP')) {
          console.log('🌐 Initializing Browser MCP Service');
          await browserMCPService.initialize();
        }

        // Initialize Hybrid AI Service if enabled
        if (isFeatureFlagEnabled('AI_COACHING')) {
          console.log('🤖 Initializing Hybrid AI Service');
          // Hybrid AI service initializes automatically
        }

        console.log('✅ All services initialized successfully');
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Service initialization failed:', error);
        monitoring.trackEvent('service_initialization_error', {
          error: errorMessage,
          timestamp: Date.now()
        });
      }
    };
    
    // Track app initialization with enhanced performance monitoring
    const appInitialized = () => {
      const initTime = performance.now() - initStart;
      
      // Track with legacy performance monitor
      performanceMonitor.trackMetric('app-initialization', initTime, {
        version: config.APP_VERSION,
        environment: config.NODE_ENV,
        buildTime: config.BUILD_TIME
      });
      
      // Track with RUM performance monitor
      rumPerformanceMonitor.trackCustomMetric('app_initialization_time', initTime, 'ms', {
        version: config.APP_VERSION,
        environment: config.NODE_ENV,
        features_enabled: Object.entries(config.FEATURES)
          .filter(([, enabled]) => enabled)
          .map(([feature]) => feature)
          .join(',')
      });
      
      monitoring.trackEvent('app_initialized', {
        version: config.APP_VERSION,
        environment: config.NODE_ENV,
        buildTime: config.BUILD_TIME,
        initTime,
        featuresEnabled: Object.keys(config.FEATURES).filter(key => config.FEATURES[key as keyof typeof config.FEATURES])
      });
    };

    // Preload critical views on idle time with enhanced performance tracking
    const preloadCriticalViews = () => {
      requestIdleCallback(() => {
        performanceMonitor.measureAsyncFunction('preload-critical-views', async () => {
          const preloadStart = performance.now();
          
          await Promise.all([
            preloadViews.simulation(),
            preloadViews.analytics()
          ]);
          
          const preloadTime = performance.now() - preloadStart;
          rumPerformanceMonitor.trackCustomMetric('view_preload_time', preloadTime, 'ms', {
            views: 'simulation,analytics'
          });
        });
      });
    };

    // Initialize services and app
    initializeServices().then(() => {
      appInitialized();
      setTimeout(preloadCriticalViews, 2000);
    });

    // Cleanup enhanced services on unmount
    return () => {
      monitoring.flush();
      performanceMonitor.destroy();
      hybridAIService.disconnect();
      rumPerformanceMonitor.dispose();
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
    { id: 'nfl-sync' as ViewType, name: 'NFL League Sync', icon: Zap },
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
    'nfl-sync': useCallback(() => (
      <LazyWrapper name="NFL League Sync">
        <NFLLeagueSyncView />
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
                  v2.0 - Enhanced with AI & MCP
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowPerformanceDashboard(true)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Performance Dashboard"
                  >
                    <Activity className="w-5 h-5" />
                  </button>
                  {isFeatureFlagEnabled('AI_COACHING') && (
                    <button
                      onClick={() => setShowAIStatus(true)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="AI Backend Status"
                    >
                      <Brain className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => console.log('Configuration:', getConfigSummary())}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="System Configuration"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
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

        {/* AI Backend Status Modal */}
        {showAIStatus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">AI Backend Status</h2>
                <button
                  onClick={() => setShowAIStatus(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <AIBackendStatus />
              </div>
            </div>
          </div>
        )}
      </div>
    </FantasyFootballProvider>
  );
});

App.displayName = 'App';

export default App;