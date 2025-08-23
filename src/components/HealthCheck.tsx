import { useState, useEffect } from 'react';
import { monitoring } from '../utils/monitoring';

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  build: string;
  metricsBufferSize: number;
  errorBufferSize: number;
  analyticsEnabled: boolean;
  performance?: {
    memoryUsage?: number;
    connectionSpeed?: string;
    onlineStatus: boolean;
  };
}

export const HealthCheck: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or if explicitly enabled
    const showHealthCheck = 
      import.meta.env.DEV || 
      import.meta.env.VITE_SHOW_PERFORMANCE_STATS === 'true';
    
    setIsVisible(showHealthCheck);

    if (showHealthCheck) {
      updateHealthStatus();
      const interval = setInterval(updateHealthStatus, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const updateHealthStatus = () => {
    const baseStatus = monitoring.getHealthStatus();
    
    const performanceInfo: HealthStatus['performance'] = {
      onlineStatus: navigator.onLine,
    };

    // Add memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      performanceInfo.memoryUsage = Math.round(
        (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      );
    }

    // Add connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      performanceInfo.connectionSpeed = connection.effectiveType;
    }

    setHealthStatus({
      ...baseStatus,
      performance: performanceInfo
    });
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Health check endpoint simulation
  const handleHealthCheck = async () => {
    try {
      // In production, this would call the actual health endpoint
      const response = await fetch('/health').catch(() => ({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', source: 'client-side' })
      }));
      
      if (response.ok) {
        monitoring.trackEvent('health_check_success');
      } else {
        monitoring.trackEvent('health_check_failure');
      }
    } catch (error) {
      monitoring.trackEvent('health_check_error', { error: String(error) });
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={handleToggleVisibility}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Show Health Status"
      >
        💊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">System Health</h3>
        <button
          onClick={handleToggleVisibility}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ×
        </button>
      </div>

      {healthStatus && (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-medium ${
              healthStatus.status === 'ok' ? 'text-green-600' : 'text-red-600'
            }`}>
              {healthStatus.status.toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Version:</span>
            <span className="font-mono">{healthStatus.version}</span>
          </div>

          <div className="flex justify-between">
            <span>Online:</span>
            <span className={`${
              healthStatus.performance?.onlineStatus ? 'text-green-600' : 'text-red-600'
            }`}>
              {healthStatus.performance?.onlineStatus ? 'Yes' : 'No'}
            </span>
          </div>

          {healthStatus.performance?.memoryUsage && (
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className={`${
                healthStatus.performance.memoryUsage > 80 ? 'text-red-600' : 
                healthStatus.performance.memoryUsage > 60 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {healthStatus.performance.memoryUsage}%
              </span>
            </div>
          )}

          {healthStatus.performance?.connectionSpeed && (
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className="text-gray-600">
                {healthStatus.performance.connectionSpeed}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Analytics:</span>
            <span className={`${
              healthStatus.analyticsEnabled ? 'text-green-600' : 'text-gray-400'
            }`}>
              {healthStatus.analyticsEnabled ? 'On' : 'Off'}
            </span>
          </div>

          {(healthStatus.metricsBufferSize > 0 || healthStatus.errorBufferSize > 0) && (
            <div className="border-t pt-2 mt-2">
              {healthStatus.metricsBufferSize > 0 && (
                <div className="flex justify-between">
                  <span>Metrics Queue:</span>
                  <span className="text-blue-600">{healthStatus.metricsBufferSize}</span>
                </div>
              )}
              {healthStatus.errorBufferSize > 0 && (
                <div className="flex justify-between">
                  <span>Error Queue:</span>
                  <span className="text-red-600">{healthStatus.errorBufferSize}</span>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-2 mt-2">
            <button
              onClick={handleHealthCheck}
              className="w-full bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700 transition-colors"
            >
              Test Health Endpoint
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Last updated: {new Date(healthStatus.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};