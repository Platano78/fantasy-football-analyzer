import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  HardDrive, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  Server,
  Zap,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { hybridAIService, AIBackend, type AIBackendStatus as AIBackendStatusType } from '@/services/HybridAIService';

interface AIBackendStatusProps {
  className?: string;
  compact?: boolean;
}

interface BackendStatusDisplayProps {
  backend: AIBackend;
  status: AIBackendStatusType;
  isActive: boolean;
  onRefresh?: () => void;
  compact?: boolean;
}

// Individual backend status component
const BackendStatusDisplay = memo(({ 
  backend, 
  status, 
  isActive, 
  onRefresh, 
  compact = false 
}: BackendStatusDisplayProps) => {
  const getBackendIcon = () => {
    switch (backend) {
      case 'local':
        return <HardDrive className="w-4 h-4" />;
      case 'cloud':
        return <Cloud className="w-4 h-4" />;
      case 'offline':
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const getBackendName = () => {
    switch (backend) {
      case 'local':
        return 'Local Gemini Advanced';
      case 'cloud':
        return 'Cloud Gemini Enterprise';
      case 'offline':
        return 'Offline Mode';
    }
  };

  const getStatusColor = () => {
    if (!status.available) return 'text-red-500 bg-red-50';
    if (status.qualityScore > 80) return 'text-green-500 bg-green-50';
    if (status.qualityScore > 60) return 'text-yellow-500 bg-yellow-50';
    return 'text-orange-500 bg-orange-50';
  };

  const getConnectionIcon = () => {
    if (!status.available) {
      return <AlertTriangle className="w-3 h-3 text-red-500" />;
    }

    switch (status.connectionType) {
      case 'websocket':
        return <Zap className="w-3 h-3 text-green-500" />;
      case 'http':
        return <Wifi className="w-3 h-3 text-blue-500" />;
      case 'none':
        return <WifiOff className="w-3 h-3 text-gray-500" />;
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getQualityIndicator = (score: number) => {
    if (score > 80) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (score > 60) return <Activity className="w-3 h-3 text-yellow-500" />;
    return <TrendingDown className="w-3 h-3 text-red-500" />;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg border ${
        isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
      } ${getStatusColor().split(' ')[1]}`}>
        <div className="flex items-center gap-1">
          {getBackendIcon()}
          {getConnectionIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{getBackendName()}</div>
          <div className="text-xs text-gray-500">
            {status.available ? formatResponseTime(status.responseTime) : 'Unavailable'}
          </div>
        </div>
        {isActive && (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border transition-all ${
      isActive ? 'border-blue-300 bg-blue-50 shadow-md' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${getStatusColor()}`}>
            {getBackendIcon()}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{getBackendName()}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {getConnectionIcon()}
              <span className="capitalize">{status.connectionType}</span>
              {status.connectionType === 'websocket' && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  Real-time
                </span>
              )}
            </div>
          </div>
        </div>
        
        {isActive && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Active
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <span className={`font-medium ${
              status.available ? 'text-green-600' : 'text-red-600'
            }`}>
              {status.available ? 'Available' : 'Unavailable'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Response:</span>
            <span className="font-medium">
              {status.responseTime > 0 ? formatResponseTime(status.responseTime) : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Errors:</span>
            <span className={`font-medium ${
              status.errorCount > 5 ? 'text-red-600' : 
              status.errorCount > 0 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {status.errorCount}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Quality:</span>
            <div className="flex items-center gap-1">
              {getQualityIndicator(status.qualityScore)}
              <span className="font-medium">{Math.round(status.qualityScore)}%</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                status.qualityScore > 80 ? 'bg-green-500' :
                status.qualityScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${status.qualityScore}%` }}
            ></div>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Updated:</span>
            <span className="text-xs text-gray-400">
              {status.lastHealthCheck.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </button>
      )}
    </div>
  );
});

BackendStatusDisplay.displayName = 'BackendStatusDisplay';

// Main AI Backend Status component
export const AIBackendStatus = memo(({ className = '', compact = false }: AIBackendStatusProps) => {
  const [backendStatus, setBackendStatus] = useState<Record<AIBackend, AIBackendStatusType>>({
    local: {
      backend: 'local',
      available: false,
      responseTime: 0,
      lastHealthCheck: new Date(),
      errorCount: 0,
      qualityScore: 0,
      connectionType: 'none'
    },
    cloud: {
      backend: 'cloud',
      available: false,
      responseTime: 0,
      lastHealthCheck: new Date(),
      errorCount: 0,
      qualityScore: 0,
      connectionType: 'none'
    },
    offline: {
      backend: 'offline',
      available: true,
      responseTime: 0,
      lastHealthCheck: new Date(),
      errorCount: 0,
      qualityScore: 30,
      connectionType: 'none'
    }
  });

  const [activeBackend, setActiveBackend] = useState<AIBackend>('offline');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [circuitBreakerStatus, setCircuitBreakerStatus] = useState<any>(null);

  // Subscribe to status updates
  useEffect(() => {
    const subscriberId = 'ai-backend-status';
    
    hybridAIService.subscribe(subscriberId, (status) => {
      setBackendStatus(status);
      
      // Determine active backend based on availability and quality
      const sortedBackends = Object.entries(status)
        .sort(([, a], [, b]) => {
          if (!a.available && b.available) return 1;
          if (a.available && !b.available) return -1;
          return b.qualityScore - a.qualityScore;
        });
      
      const [bestBackend] = sortedBackends[0];
      setActiveBackend(bestBackend as AIBackend);
    });

    // Initial status load
    setBackendStatus(hybridAIService.getAllStatus());
    setCircuitBreakerStatus(hybridAIService.getCircuitBreakerStatus());

    return () => {
      hybridAIService.unsubscribe(subscriberId);
    };
  }, []);

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    // Update circuit breaker status
    setCircuitBreakerStatus(hybridAIService.getCircuitBreakerStatus());
    // The health checks happen automatically, we just need to wait a bit
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  }, []);

  const getOverallStatus = () => {
    const availableBackends = Object.values(backendStatus).filter(s => s.available);
    if (availableBackends.length === 0) {
      return { status: 'error', message: 'All AI backends unavailable' };
    }
    
    const activeStatus = backendStatus[activeBackend];
    if (!activeStatus.available) {
      return { status: 'warning', message: 'Primary backend unavailable, using fallback' };
    }
    
    if (activeStatus.qualityScore > 80) {
      return { status: 'excellent', message: 'AI systems operating optimally' };
    }
    
    if (activeStatus.qualityScore > 60) {
      return { status: 'good', message: 'AI systems operating normally' };
    }
    
    return { status: 'degraded', message: 'AI systems operating with reduced performance' };
  };

  const overallStatus = getOverallStatus();

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">AI Status</h4>
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:animate-spin"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-2">
          {Object.entries(backendStatus).map(([backend, status]) => (
            <BackendStatusDisplay
              key={backend}
              backend={backend as AIBackend}
              status={status}
              isActive={activeBackend === backend}
              compact={true}
            />
          ))}
        </div>
        
        <div className={`text-xs px-2 py-1 rounded ${
          overallStatus.status === 'excellent' ? 'bg-green-100 text-green-700' :
          overallStatus.status === 'good' ? 'bg-blue-100 text-blue-700' :
          overallStatus.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {overallStatus.message}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Status Header */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Server className="w-5 h-5" />
            AI Backend Status
          </h3>
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </button>
        </div>
        
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          overallStatus.status === 'excellent' ? 'bg-green-50 text-green-700' :
          overallStatus.status === 'good' ? 'bg-blue-50 text-blue-700' :
          overallStatus.status === 'warning' ? 'bg-yellow-50 text-yellow-700' :
          'bg-red-50 text-red-700'
        }`}>
          {overallStatus.status === 'error' ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{overallStatus.message}</span>
        </div>
      </div>

      {/* Individual Backend Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(backendStatus).map(([backend, status]) => (
          <BackendStatusDisplay
            key={backend}
            backend={backend as AIBackend}
            status={status}
            isActive={activeBackend === backend}
            onRefresh={handleRefreshAll}
          />
        ))}
      </div>

      {/* Circuit Breaker Status */}
      {circuitBreakerStatus && (
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Circuit Breaker Status
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['local', 'cloud'] as const).map((backend) => {
              const cbStatus = circuitBreakerStatus[backend];
              if (!cbStatus) return null;
              
              return (
                <div key={backend} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{backend} Service</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      cbStatus.state === 'closed' ? 'bg-green-100 text-green-700' :
                      cbStatus.state === 'half-open' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {cbStatus.state.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Failures:</span>
                      <span className={cbStatus.failureCount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {cbStatus.failureCount}
                      </span>
                    </div>
                    {cbStatus.nextAttemptIn > 0 && (
                      <div className="flex justify-between">
                        <span>Next attempt:</span>
                        <span className="text-orange-600">{cbStatus.nextAttemptIn}s</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Circuit breakers prevent continuous failed requests and implement exponential backoff for better performance.
          </div>
        </div>
      )}

      {/* Active Backend Summary */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Active Backend: {backendStatus[activeBackend] && backendStatus[activeBackend].available ? 
            (activeBackend === 'local' ? 'Local Gemini Advanced' :
             activeBackend === 'cloud' ? 'Cloud Gemini Enterprise' : 'Offline Mode') : 'None Available'
          }
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(backendStatus).filter(s => s.available).length}
            </div>
            <div className="text-gray-500">Available</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(backendStatus[activeBackend]?.responseTime || 0)}ms
            </div>
            <div className="text-gray-500">Response Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {Math.round(backendStatus[activeBackend]?.qualityScore || 0)}%
            </div>
            <div className="text-gray-500">Quality Score</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(backendStatus).reduce((sum, s) => sum + s.errorCount, 0)}
            </div>
            <div className="text-gray-500">Total Errors</div>
          </div>
        </div>
      </div>
    </div>
  );
});

AIBackendStatus.displayName = 'AIBackendStatus';

export default AIBackendStatus;