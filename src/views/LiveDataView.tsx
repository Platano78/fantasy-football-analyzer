import { memo, useMemo, useCallback } from 'react';
import { RefreshCw, TrendingUp, AlertCircle, CheckCircle, Clock, Activity, Wifi, Database, WifiOff, Globe, Zap } from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { useESPNData } from '@/hooks/useESPNData';
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
          <span>Live Data Ready</span>
        </div>
      </div>

      <div className="space-y-4">
        {sources.map((source) => (
          <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                source.status === 'connected' ? 'bg-green-500' :
                source.status === 'syncing' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`} />
              <div>
                <div className="font-medium text-gray-900">{source.name}</div>
                <div className="text-sm text-gray-600">{source.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right text-sm text-gray-600">
                <div>Every {source.updateInterval}min</div>
                <div className="text-xs">
                  {Math.round((Date.now() - source.lastUpdate.getTime()) / 60000)}m ago
                </div>
              </div>
              <button
                onClick={() => onRefresh(source.id)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                disabled={source.status === 'syncing'}
              >
                <RefreshCw className={`w-4 h-4 ${source.status === 'syncing' ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

DataSourceStatus.displayName = 'DataSourceStatus';

// Memoized auto-refresh controls component
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
  const intervalMinutes = Math.floor(refreshInterval / 60);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Auto-Refresh Settings
        </h3>
        <button
          onClick={onManualRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Now
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">Auto-refresh</span>
          <button
            onClick={onToggleAutoRefresh}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isAutoRefreshEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAutoRefreshEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {isAutoRefreshEnabled && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Refresh Interval</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="30"
                value={intervalMinutes}
                onChange={(e) => onChangeInterval(parseInt(e.target.value) * 60)}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-20">{intervalMinutes} min</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

AutoRefreshControls.displayName = 'AutoRefreshControls';

// Memoized live updates feed component
const LiveUpdatesFeed = memo(({
  updates,
  onClearUpdates
}: {
  updates: LiveUpdate[];
  onClearUpdates: () => void;
}) => {
  const sortedUpdates = useMemo(() => 
    [...updates].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [updates]
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Live Updates ({updates.length})
        </h3>
        {updates.length > 0 && (
          <button
            onClick={onClearUpdates}
            className="text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {sortedUpdates.length > 0 ? (
          sortedUpdates.map((update) => (
            <div key={update.id} className={`p-3 rounded-lg border-l-4 ${
              update.severity === 'high' ? 'bg-red-50 border-red-400' :
              update.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
              'bg-blue-50 border-blue-400'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      update.type === 'injury' ? 'bg-red-100 text-red-800' :
                      update.type === 'ranking' ? 'bg-blue-100 text-blue-800' :
                      update.type === 'adp' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {update.type.toUpperCase()}
                    </span>
                    {update.playerName && (
                      <span className="font-medium text-gray-900">{update.playerName}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{update.message}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round((Date.now() - update.timestamp.getTime()) / 60000)}m ago
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No live updates yet</p>
          </div>
        )}
      </div>
    </div>
  );
});

LiveUpdatesFeed.displayName = 'LiveUpdatesFeed';

// Main LiveDataView component
export const LiveDataView = memo(() => {
  const { state } = useFantasyFootball();
  
  // Get player IDs for my team to highlight relevant updates
  const myPlayerIds = useMemo(() => 
    state.draftedPlayers.map(p => p.id.toString()),
    [state.draftedPlayers]
  );

  // ESPN API integration
  const espnData = useESPNData();
  
  // Transform data sources to component format
  const dataSources: DataSource[] = useMemo(() => [
    {
      id: 'espn-api',
      name: 'ESPN Fantasy API',
      status: espnData.loading ? 'syncing' : espnData.error ? 'error' : 'connected',
      lastUpdate: espnData.lastUpdate,
      updateInterval: 5,
      description: 'Official ESPN fantasy football data'
    }
  ], [espnData.loading, espnData.error, espnData.lastUpdate]);

  // Calculate live statistics from ESPN data
  const stats = useMemo(() => ({
    liveRankings: espnData.rankings.length,
    adpUpdates: espnData.rankings.filter(r => 
      Date.now() - r.updated.getTime() < 3600000 // Last hour
    ).length,
    injuryUpdates: espnData.injuries.filter(i => 
      Date.now() - i.updated.getTime() < 24 * 3600000 // Last 24 hours
    ).length
  }), [espnData.rankings, espnData.injuries]);

  // Mock live updates for demonstration (in real app, these would come from real data sources)
  const mockLiveUpdates: LiveUpdate[] = useMemo(() => [
    {
      id: 'update-1',
      type: 'injury',
      playerId: 123,
      playerName: 'Christian McCaffrey',
      message: 'Listed as questionable for Week 7 with calf injury',
      timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      severity: 'high'
    },
    {
      id: 'update-2',
      type: 'ranking',
      playerId: 456,
      playerName: 'Tyreek Hill',
      message: 'Moved up 2 spots in consensus rankings after strong performance',
      timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      severity: 'medium'
    },
    {
      id: 'update-3',
      type: 'adp',
      playerId: 789,
      playerName: 'Bijan Robinson',
      message: 'ADP decreased by 0.5 rounds over the past week',
      timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
      severity: 'low'
    }
  ], []);

  // Callback handlers
  const handleToggleAutoRefresh = useCallback(() => {
    // In a real implementation, this would control auto-refresh
    console.log('Toggle auto-refresh');
  }, []);

  const handleChangeInterval = useCallback((interval: number) => {
    // In a real implementation, this would change refresh interval
    console.log('Change interval:', interval);
  }, []);

  const handleManualRefresh = useCallback(async () => {
    await espnData.refreshData();
  }, [espnData]);

  const handleRefreshSource = useCallback(async (sourceId: string) => {
    switch (sourceId) {
      case 'espn-api':
        await espnData.refreshData();
        break;
      default:
        await espnData.refreshData();
    }
  }, [espnData]);

  const handleClearUpdates = useCallback(() => {
    // In a real implementation, this would clear live updates
    console.log('Clear updates');
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Live Data Monitoring</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Real-time fantasy football data from ESPN API. Track rankings, injuries, and ADP changes as they happen.
        </p>
        
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Globe className="w-5 h-5 text-blue-500" />
            <span>Live Data Ready</span>
          </div>
        </div>
      </div>

      {/* Live Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.liveRankings}</div>
          <div className="text-sm text-gray-600">Live Rankings</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.adpUpdates}</div>
          <div className="text-sm text-gray-600">ADP Updates (1h)</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.injuryUpdates}</div>
          <div className="text-sm text-gray-600">Injury Updates (24h)</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <DataSourceStatus
            sources={dataSources}
            onRefresh={handleRefreshSource}
            onToggleSource={() => {}}
          />
          
          <AutoRefreshControls
            isAutoRefreshEnabled={false}
            refreshInterval={300} // 5 minutes
            onToggleAutoRefresh={handleToggleAutoRefresh}
            onChangeInterval={handleChangeInterval}
            onManualRefresh={handleManualRefresh}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <LiveUpdatesFeed
            updates={mockLiveUpdates}
            onClearUpdates={handleClearUpdates}
          />
        </div>
      </div>

      {/* ESPN API Integration Status */}
      <div className={`border rounded-lg p-6 ${
        !espnData.error ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start gap-3">
          {!espnData.error ? (
            <Wifi className="w-6 h-6 text-green-600 mt-1" />
          ) : (
            <WifiOff className="w-6 h-6 text-red-600 mt-1" />
          )}
          <div className="flex-1">
            <h4 className={`font-semibold ${
              !espnData.error ? 'text-green-900' : 'text-red-900'
            }`}>
              ESPN API Integration Status
            </h4>
            
            <p className={`text-sm mb-3 ${
              !espnData.error ? 'text-green-800' : 'text-red-800'
            }`}>
              {!espnData.error ? (
                'ESPN API is actively providing live fantasy football data. Rankings and player information are updated automatically.'
              ) : (
                espnData.error || 'ESPN API service is currently unavailable. Please check your connection and try again.'
              )}
            </p>
            
            {!espnData.error && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-800">Service Online</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-800">Auto-refresh Off</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800">{espnData.rankings.length} Rankings</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-800">{espnData.injuries.length} Injuries</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

LiveDataView.displayName = 'LiveDataView';