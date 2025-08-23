import { memo, useMemo, useCallback } from 'react';
import { RefreshCw, TrendingUp, AlertCircle, CheckCircle, Clock, Activity, Wifi, Database, WifiOff, Globe } from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { useBrowserMCP } from '@/hooks/useBrowserMCP';
import { Player } from '@/types';

// Data source status interface
interface DataSource {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastUpdate: Date;
  updateInterval: number; // minutes
  description: string;
}

// Live update interface
interface LiveUpdate {
  id: string;
  type: 'ranking' | 'adp' | 'injury' | 'news';
  playerId?: number;
  playerName?: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

// Memoized data source status component
const DataSourceStatus = memo(({ 
  sources,
  onRefresh,
  onToggleSource
}: {
  sources: DataSource[];
  onRefresh: (sourceId: string) => void;
  onToggleSource: (sourceId: string) => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Sources
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Wifi className="w-4 h-4 text-green-500" />
          <span>Browser MCP Ready</span>
        </div>
      </div>

      <div className="space-y-4">
        {sources.map(source => (
          <div key={source.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  source.status === 'connected' ? 'bg-green-500' :
                  source.status === 'syncing' ? 'bg-yellow-500 animate-pulse' :
                  source.status === 'error' ? 'bg-red-500' :
                  'bg-gray-400'
                }`} />
                <div>
                  <h4 className="font-medium text-gray-900">{source.name}</h4>
                  <p className="text-sm text-gray-600">{source.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRefresh(source.id)}
                  disabled={source.status === 'syncing'}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${source.status === 'syncing' ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => onToggleSource(source.id)}
                  className={`px-3 py-1 text-xs rounded-full font-medium ${
                    source.status === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {source.status === 'connected' ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Last updated: {source.lastUpdate.toLocaleTimeString()} • 
              Updates every {source.updateInterval} minutes
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

DataSourceStatus.displayName = 'DataSourceStatus';

// Memoized live updates feed
const LiveUpdatesFeed = memo(({ 
  updates,
  onClearUpdates
}: {
  updates: LiveUpdate[];
  onClearUpdates: () => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Live Updates Feed
        </h3>
        <button
          onClick={onClearUpdates}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {updates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent updates</p>
            <p className="text-sm">Live data will appear here when available</p>
          </div>
        ) : (
          updates.map(update => (
            <div
              key={update.id}
              className={`p-3 rounded-lg border-l-4 ${
                update.severity === 'high' ? 'bg-red-50 border-red-400' :
                update.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      update.type === 'injury' ? 'bg-red-100 text-red-800' :
                      update.type === 'ranking' ? 'bg-blue-100 text-blue-800' :
                      update.type === 'adp' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {update.type.toUpperCase()}
                    </span>
                    {update.playerName && (
                      <span className="font-medium text-gray-900">{update.playerName}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{update.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {update.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  update.severity === 'high' ? 'bg-red-500' :
                  update.severity === 'medium' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

LiveUpdatesFeed.displayName = 'LiveUpdatesFeed';

// Memoized real-time statistics
const RealTimeStats = memo(({ 
  players,
  liveRankings,
  adpUpdates,
  injuryUpdates
}: {
  players: Player[];
  liveRankings: number;
  adpUpdates: number;
  injuryUpdates: number;
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{players.length}</div>
        <div className="text-xs text-gray-600">Current Players</div>
        <div className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Updated
        </div>
      </div>
      
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{liveRankings}</div>
        <div className="text-xs text-gray-600">Live Rankings</div>
        <div className="text-xs text-blue-600 mt-1 flex items-center justify-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Syncing
        </div>
      </div>
      
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">{adpUpdates}</div>
        <div className="text-xs text-gray-600">ADP Updates</div>
        <div className="text-xs text-gray-600 mt-1">Last hour</div>
      </div>
      
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">{injuryUpdates}</div>
        <div className="text-xs text-gray-600">Injury Updates</div>
        <div className="text-xs text-gray-600 mt-1">Today</div>
      </div>
    </div>
  );
});

RealTimeStats.displayName = 'RealTimeStats';

// Memoized auto-refresh controls
const AutoRefreshControls = memo(({ 
  isAutoRefreshEnabled,
  refreshInterval,
  onToggleAutoRefresh,
  onChangeInterval,
  onManualRefresh
}: {
  isAutoRefreshEnabled: boolean;
  refreshInterval: number;
  onToggleAutoRefresh: () => void;
  onChangeInterval: (interval: number) => void;
  onManualRefresh: () => void;
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleAutoRefresh}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            isAutoRefreshEnabled
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isAutoRefreshEnabled ? 'animate-spin' : ''}`} />
          {isAutoRefreshEnabled ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
        </button>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Interval:</label>
          <select
            value={refreshInterval}
            onChange={(e) => onChangeInterval(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={300}>5 minutes</option>
            <option value={600}>10 minutes</option>
          </select>
        </div>
      </div>
      
      <button
        onClick={onManualRefresh}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh Now
      </button>
    </div>
  );
});

AutoRefreshControls.displayName = 'AutoRefreshControls';

// Main LiveDataView component
export default function LiveDataView() {
  const { state } = useFantasyFootball();
  
  // Get my player IDs for personalized data
  const myPlayerIds = useMemo(() => {
    return Array.from(state.draftedPlayers).map(id => id.toString());
  }, [state.draftedPlayers]);

  // Browser MCP integration
  const browserMCP = useBrowserMCP(myPlayerIds);
  
  // Transform Browser MCP data to component format
  const dataSources: DataSource[] = useMemo(() => [
    {
      id: 'fantasypros',
      name: 'FantasyPros',
      status: browserMCP.state.healthStatus.fantasypros ? 'connected' : 'error',
      lastUpdate: browserMCP.state.lastUpdate,
      updateInterval: Math.floor(browserMCP.autoRefreshInterval / 60),
      description: 'Expert consensus rankings and news'
    },
    {
      id: 'espn',
      name: 'ESPN Fantasy',
      status: browserMCP.state.healthStatus.espn ? 'connected' : 'error',
      lastUpdate: browserMCP.state.lastUpdate,
      updateInterval: Math.floor(browserMCP.autoRefreshInterval / 60),
      description: 'Player rankings and projections'
    },
    {
      id: 'nfl',
      name: 'NFL.com',
      status: browserMCP.state.healthStatus.nfl ? 'connected' : 'error',
      lastUpdate: browserMCP.state.lastUpdate,
      updateInterval: 5,
      description: 'Official injury reports and news'
    },
    {
      id: 'sleeper',
      name: 'Sleeper API',
      status: browserMCP.state.healthStatus.sleeper ? 'connected' : 'error',
      lastUpdate: browserMCP.state.lastUpdate,
      updateInterval: 10,
      description: 'Real-time ADP and draft data'
    }
  ], [browserMCP.state.healthStatus, browserMCP.state.lastUpdate, browserMCP.autoRefreshInterval]);

  // Calculate live statistics
  const stats = useMemo(() => ({
    liveRankings: browserMCP.rankings.length,
    adpUpdates: browserMCP.rankings.filter(r => 
      Date.now() - r.updated.getTime() < 3600000 // Last hour
    ).length,
    injuryUpdates: browserMCP.injuries.filter(i => 
      Date.now() - i.updated.getTime() < 24 * 3600000 // Last 24 hours
    ).length
  }), [browserMCP.rankings, browserMCP.injuries]);

  // Callback handlers using Browser MCP
  const handleToggleAutoRefresh = useCallback(() => {
    if (browserMCP.isAutoRefreshEnabled) {
      browserMCP.stopAutoRefresh();
    } else {
      browserMCP.startAutoRefresh();
    }
  }, [browserMCP]);

  const handleChangeInterval = useCallback((interval: number) => {
    browserMCP.setAutoRefreshInterval(interval);
  }, [browserMCP]);

  const handleManualRefresh = useCallback(async () => {
    await browserMCP.refreshAll();
  }, [browserMCP]);

  const handleRefreshSource = useCallback(async (sourceId: string) => {
    // Refresh specific data based on source
    switch (sourceId) {
      case 'fantasypros':
        await browserMCP.refreshNews();
        break;
      case 'espn':
        await browserMCP.refreshRankings();
        break;
      case 'nfl':
        await browserMCP.refreshInjuries();
        break;
      default:
        await browserMCP.refreshAll();
    }
  }, [browserMCP]);

  const handleToggleSource = useCallback((sourceId: string) => {
    console.log('Toggling source:', sourceId);
    // In a real implementation, this could disable/enable specific data sources
  }, []);

  const handleClearUpdates = useCallback(() => {
    browserMCP.clearLiveUpdates();
  }, [browserMCP]);

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Live Data Integration
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="w-5 h-5 text-blue-500" />
            <span>Browser MCP Ready</span>
          </div>
        </div>

        <RealTimeStats
          players={state.players}
          liveRankings={stats.liveRankings}
          adpUpdates={stats.adpUpdates}
          injuryUpdates={stats.injuryUpdates}
        />

        <div className="mt-6">
          <AutoRefreshControls
            isAutoRefreshEnabled={browserMCP.isAutoRefreshEnabled}
            refreshInterval={browserMCP.autoRefreshInterval}
            onToggleAutoRefresh={handleToggleAutoRefresh}
            onChangeInterval={handleChangeInterval}
            onManualRefresh={handleManualRefresh}
          />
        </div>
      </div>

      {/* Data Sources and Live Updates Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <DataSourceStatus
          sources={dataSources}
          onRefresh={handleRefreshSource}
          onToggleSource={handleToggleSource}
        />
        
        <LiveUpdatesFeed
          updates={browserMCP.liveUpdates}
          onClearUpdates={handleClearUpdates}
        />
      </div>

      {/* Browser MCP Integration Status */}
      <div className={`border rounded-lg p-6 ${
        browserMCP.state.isInitialized 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start gap-3">
          {browserMCP.state.isInitialized ? (
            <Wifi className="w-6 h-6 text-blue-600 mt-1" />
          ) : (
            <WifiOff className="w-6 h-6 text-red-600 mt-1" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-semibold ${
                browserMCP.state.isInitialized ? 'text-blue-900' : 'text-red-900'
              }`}>
                Browser MCP Integration Status
              </h4>
              
              {browserMCP.state.isInitialized && (
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => browserMCP.clearCache()}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Clear Cache
                  </button>
                  <button
                    onClick={() => browserMCP.checkHealth()}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Test Sources
                  </button>
                </div>
              )}
            </div>
            
            <p className={`text-sm mb-3 ${
              browserMCP.state.isInitialized ? 'text-blue-800' : 'text-red-800'
            }`}>
              {browserMCP.state.isInitialized ? (
                'Browser MCP is actively collecting live data from fantasy platforms. All data sources are monitored and updated automatically based on your refresh settings.'
              ) : (
                browserMCP.state.error || 'Browser MCP service is not available. Please check your connection and try again.'
              )}
            </p>
            
            {browserMCP.state.isInitialized && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {browserMCP.state.isInitialized ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={browserMCP.state.isInitialized ? 'text-green-800' : 'text-red-800'}>
                      Service {browserMCP.state.isInitialized ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {browserMCP.isAutoRefreshEnabled ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-600" />
                  )}
                  <span className={browserMCP.isAutoRefreshEnabled ? 'text-green-800' : 'text-gray-800'}>
                    Auto-refresh {browserMCP.isAutoRefreshEnabled ? 'On' : 'Off'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800">
                    {browserMCP.news.length} News Items
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-800">
                    {browserMCP.rankings.length} Rankings
                  </span>
                </div>
              </div>
            )}
            
            {browserMCP.state.error && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Error:</span>
                  <span>{browserMCP.state.error}</span>
                </div>
              </div>
            )}
            
            {!browserMCP.state.isInitialized && (
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}