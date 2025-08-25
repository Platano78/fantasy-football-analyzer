import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, Target, Volume2, X, Zap, Bell, Timer, TrendingUp, Wifi, WifiOff, Link, Globe, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { useDraftData } from '@/hooks';
import { Player, Position, DraftRoomProvider, DraftRoomConnection, ConnectionStatus } from '@/types';
import { 
  extractLeagueId, 
  validateDraftRoomUrl, 
  createDraftRoomConnection,
  simulateConnection,
  simulateSync,
  getConnectionStatusColor,
  formatTimeSince,
  getProviderDisplayName,
  getProviderExampleUrl 
} from '@/utils/draftRoomConnector';
// import { DraftTimer } from '@/components';

// Memoized timer display with enhanced visual feedback
const TimerDisplay = memo(({ 
  timeRemaining,
  isActive,
  isWarning,
  showExpired,
  currentPicker,
  currentRound,
  totalPicks,
  currentPick
}: {
  timeRemaining: number;
  isActive: boolean;
  isWarning: boolean;
  showExpired: boolean;
  currentPicker: number;
  currentRound: number;
  totalPicks: number;
  currentPick: number;
}) => {
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-lg text-center">
      <div className={`text-8xl font-bold mb-4 transition-colors duration-300 ${
        showExpired 
          ? 'text-red-600 animate-pulse' 
          : isWarning 
            ? 'text-yellow-600' 
            : isActive
              ? 'text-green-600'
              : 'text-gray-600'
      }`}>
        {showExpired ? 'TIME!' : formatTime(timeRemaining)}
      </div>
      <div className="text-xl font-semibold text-gray-700 mb-2">
        Team {currentPicker} • Round {currentRound}
      </div>
      <div className="text-sm text-gray-600">
        Pick {currentPick} of {totalPicks}
      </div>
      <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${
            isWarning ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.max(0, (timeRemaining / 90) * 100)}%` }}
        />
      </div>
    </div>
  );
});

TimerDisplay.displayName = 'TimerDisplay';

// Memoized draft progress component
const DraftProgress = memo(({ 
  currentRound,
  draftedPlayersCount,
  totalPicks,
  draftedByPosition
}: {
  currentRound: number;
  draftedPlayersCount: number;
  totalPicks: number;
  draftedByPosition: Record<Position, number>;
}) => {
  const completionPercentage = (draftedPlayersCount / totalPicks) * 100;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Draft Progress
      </h4>
      
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div>
          <div className="text-2xl font-bold text-blue-600">{currentRound}</div>
          <div className="text-sm text-gray-600">Current Round</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{draftedPlayersCount}</div>
          <div className="text-sm text-gray-600">Players Drafted</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">{totalPicks - draftedPlayersCount}</div>
          <div className="text-sm text-gray-600">Picks Remaining</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Overall Progress</span>
          <span>{completionPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700">Drafted by Position</h5>
        {(['QB', 'RB', 'WR', 'TE', 'DEF', 'K'] as Position[]).map(position => (
          <div key={position} className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{position}</span>
            <span className="font-medium text-gray-900">{draftedByPosition[position] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

DraftProgress.displayName = 'DraftProgress';

// Memoized draft recommendations component
const DraftRecommendations = memo(({ 
  nextRecommendations,
  onPlayerClick
}: {
  nextRecommendations: Player[];
  onPlayerClick: (player: Player) => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Target className="w-5 h-5" />
        Draft Recommendations
      </h3>
      
      <div className="space-y-3">
        {nextRecommendations.slice(0, 5).map((player, index) => (
          <div
            key={player.id}
            onClick={() => onPlayerClick(player)}
            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{player.name}</div>
                <div className="text-sm text-gray-600">{player.position} • {player.team}</div>
                <div className="text-xs text-gray-500">ADP: {player.adp.toFixed(1)}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs px-2 py-1 rounded-full ${
                  index === 0 ? 'bg-green-100 text-green-800' :
                  index === 1 ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {index === 0 ? 'TOP PICK' : `Option ${index + 1}`}
                </div>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  Rank #{player.adp.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

DraftRecommendations.displayName = 'DraftRecommendations';

// Memoized notification center
const NotificationCenter = memo(({ 
  notifications,
  onDismiss,
  onClearAll
}: {
  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    message: string;
    timestamp: Date;
  }>;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h3>
        <button
          onClick={onClearAll}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear All
        </button>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border-l-4 ${
              notification.type === 'error' ? 'bg-red-50 border-red-400' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
              notification.type === 'success' ? 'bg-green-50 border-green-400' :
              'bg-blue-50 border-blue-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-900">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => onDismiss(notification.id)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

NotificationCenter.displayName = 'NotificationCenter';

// Memoized draft room URL input component
const DraftRoomURLInput = memo(({
  onConnect,
  isConnecting
}: {
  onConnect: (provider: DraftRoomProvider, url: string) => void;
  isConnecting: boolean;
}) => {
  const [provider, setProvider] = useState<DraftRoomProvider>('espn');
  const [url, setUrl] = useState('');

  const handleConnect = useCallback(() => {
    if (url.trim()) {
      onConnect(provider, url.trim());
    }
  }, [provider, url, onConnect]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isConnecting) {
      handleConnect();
    }
  }, [handleConnect, isConnecting]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Link className="w-4 h-4" />
        Connect to Draft Room
      </h4>
      
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {(['espn', 'nfl', 'yahoo', 'sleeper'] as DraftRoomProvider[]).map(p => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                provider === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getProviderExampleUrl(provider)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isConnecting}
          />
          <button
            onClick={handleConnect}
            disabled={!url.trim() || isConnecting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              !url.trim() || isConnecting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Connect
              </>
            )}
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>Supported URLs:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>ESPN: fantasy.espn.com/football/draft?leagueId=...</li>
            <li>NFL: fantasy.nfl.com/draftclient?leagueId=...</li>
            <li>Yahoo: football.fantasysports.yahoo.com/league/.../draft</li>
            <li>Sleeper: sleeper.app/draft/...</li>
          </ul>
        </div>
      </div>
    </div>
  );
});

DraftRoomURLInput.displayName = 'DraftRoomURLInput';

// Memoized connection status component
const ConnectionStatusDisplay = memo(({
  connection,
  onDisconnect,
  onSync
}: {
  connection: DraftRoomConnection;
  onDisconnect: () => void;
  onSync: () => void;
}) => {

  const getStatusIcon = useCallback((status: ConnectionStatus) => {
    switch (status) {
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'syncing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <WifiOff className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  }, []);


  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Draft Room Connection
        </h4>
        <button
          onClick={onDisconnect}
          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Disconnect
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Platform</span>
          <span className="text-sm font-medium text-gray-900">{getProviderDisplayName(connection.provider)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor(connection.status)}`}>
            {getStatusIcon(connection.status)}
            {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Last Sync</span>
          <span className="text-sm font-medium text-gray-900">{formatTimeSince(connection.lastSync)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">League ID</span>
          <span className="text-sm font-medium text-gray-900 font-mono">{connection.leagueId}</span>
        </div>
        
        {connection.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{connection.error}</p>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <button
            onClick={onSync}
            disabled={connection.status === 'syncing' || connection.status === 'connecting'}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              connection.status === 'syncing' || connection.status === 'connecting'
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${connection.status === 'syncing' ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>
    </div>
  );
});

ConnectionStatusDisplay.displayName = 'ConnectionStatusDisplay';

// Live Draft Room Data Display
const LiveDraftRoomData = memo(({ 
  draftData,
  connection 
}: { 
  draftData: any;
  connection: DraftRoomConnection; 
}) => {
  if (!draftData) return null;

  return (
    <div className="bg-white rounded-lg border border-green-200 p-4">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-green-600" />
        Live Draft Room - {draftData.leagueName}
      </h4>
      
      <div className="space-y-4">
        {/* Current Pick Status */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">Round {draftData.currentRound}</div>
              <div className="text-xs text-gray-600">Current Round</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">Pick {draftData.currentPick}</div>
              <div className="text-xs text-gray-600">of {draftData.totalRounds * draftData.totalTeams}</div>
            </div>
          </div>
          <div className="text-center mt-2">
            <div className="text-lg font-semibold text-gray-800">{draftData.draftPhase}</div>
            <div className="text-sm text-gray-600 mt-1">{draftData.recommendedStrategy}</div>
          </div>
        </div>

        {/* Timer */}
        {draftData.isDraftActive && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Time Remaining</span>
            </div>
            <div className="text-lg font-bold text-yellow-800">{Math.floor(draftData.timeRemaining / 60)}:{(draftData.timeRemaining % 60).toString().padStart(2, '0')}</div>
          </div>
        )}

        {/* Recent Picks */}
        {draftData.recentPicks && draftData.recentPicks.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Picks</h5>
            <div className="space-y-2">
              {draftData.recentPicks.map((pick: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900">{pick.player}</div>
                    <div className="text-xs text-gray-500">({pick.position})</div>
                  </div>
                  <div className="text-xs text-gray-500">{pick.team}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Players by Position */}
        {draftData.availablePositions && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Available Players</h5>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {Object.entries(draftData.availablePositions).map(([pos, count]) => (
                <div key={pos} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{pos}</span>
                  <span className="text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your Team Info */}
        {draftData.myTeamId && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-800">
              Your Team: Team {draftData.myTeamId} • League ID: {draftData.leagueId}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

LiveDraftRoomData.displayName = 'LiveDraftRoomData';

// Memoized real-time sync indicators
const SyncStatusIndicators = memo(({
  isLiveDraft,
  autoSync,
  lastServerUpdate,
  onToggleAutoSync
}: {
  isLiveDraft: boolean;
  autoSync: boolean;
  lastServerUpdate: Date | null;
  onToggleAutoSync: () => void;
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getUpdateAge = useCallback(() => {
    if (!lastServerUpdate) return 'No updates';
    const diff = Math.floor((currentTime.getTime() - lastServerUpdate.getTime()) / 1000);
    if (diff < 60) return `Updated ${diff}s ago`;
    if (diff < 3600) return `Updated ${Math.floor(diff / 60)}m ago`;
    return `Updated ${Math.floor(diff / 3600)}h ago`;
  }, [currentTime, lastServerUpdate]);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLiveDraft ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-900">Live Draft Active</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Draft Not Started</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">{getUpdateAge()}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Auto-sync</span>
            <button
              onClick={onToggleAutoSync}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                autoSync ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  autoSync ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

SyncStatusIndicators.displayName = 'SyncStatusIndicators';

// Main TrackerView component
export default function TrackerView() {
  const { state, dispatch } = useFantasyFootball();
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    message: string;
    timestamp: Date;
  }>>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [draftSettings] = useState({
    totalTeams: 12,
    rounds: 16,
    timePerPick: 90
  });
  
  const { 
    isDraftActive, 
    isUserTurn, 
    currentPicker, 
    currentRound,
    draftTimer,
    isTimerActive,
    timerWarning,
    showTimerExpired,
    draftPlayer,
    availablePlayers
  } = useDraftData();

  // Memoized computed values
  const totalPicks = useMemo(() => draftSettings.totalTeams * draftSettings.rounds, [draftSettings]);
  const currentPick = useMemo(() => Array.from(state.draftedPlayers).length + 1, [state.draftedPlayers]);
  
  const draftedByPosition = useMemo(() => {
    return Array.from(state.draftedPlayers).reduce((counts, playerId) => {
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        counts[player.position] = (counts[player.position] || 0) + 1;
      }
      return counts;
    }, {} as Record<Position, number>);
  }, [state.draftedPlayers, state.players]);

  const nextRecommendations = useMemo(() => {
    return availablePlayers
      .sort((a, b) => a.adp - b.adp)
      .slice(0, 10);
  }, [availablePlayers]);

  // Notification management
  const addNotification = useCallback((type: 'info' | 'warning' | 'success' | 'error', message: string) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep only last 10
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Timer controls
  const startTimer = useCallback(() => {
    dispatch({ type: 'START_TIMER' });
    addNotification('info', `Timer started for Team ${currentPicker}`);
  }, [dispatch, currentPicker, addNotification]);

  const pauseTimer = useCallback(() => {
    dispatch({ type: 'STOP_TIMER' });
    addNotification('warning', 'Timer paused');
  }, [dispatch, addNotification]);

  const resetTimer = useCallback(() => {
    dispatch({ type: 'STOP_TIMER' });
    addNotification('info', 'Timer reset');
  }, [dispatch, addNotification]);

  const advanceToNextPicker = useCallback(() => {
    // Logic to advance to next picker
    addNotification('success', `Advanced to Team ${currentPicker + 1}`);
  }, [currentPicker, addNotification]);

  const playWarningSound = useCallback(() => {
    // Create audio context and play warning sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
    
    addNotification('info', 'Warning sound played');
  }, [addNotification]);

  const handlePlayerClick = useCallback((player: Player) => {
    if (isDraftActive && isUserTurn) {
      draftPlayer();
      addNotification('success', `Drafted ${player.name} (${player.position})`);
    } else {
      addNotification('info', `Viewing ${player.name} details`);
    }
  }, [isDraftActive, isUserTurn, draftPlayer, addNotification]);

  // Draft room connection handlers
  const handleConnect = useCallback(async (provider: DraftRoomProvider, url: string) => {
    // Validate URL format
    if (!validateDraftRoomUrl(provider, url)) {
      addNotification('error', `Invalid ${getProviderDisplayName(provider)} URL format`);
      return;
    }

    // Extract league ID
    const leagueId = extractLeagueId(provider, url);
    if (!leagueId) {
      addNotification('error', 'Could not extract league ID from URL');
      return;
    }

    // Create connection and set connecting status
    const connection = createDraftRoomConnection(provider, url, leagueId);
    connection.status = 'connecting';
    
    setIsConnecting(true);
    dispatch({ type: 'SET_DRAFT_ROOM_CONNECTION', payload: connection });
    addNotification('info', `Connecting to ${getProviderDisplayName(provider)} draft room...`);

    try {
      // Attempt connection
      const result = await simulateConnection(connection);
      
      if (result.success) {
        dispatch({ type: 'UPDATE_CONNECTION_STATUS', payload: 'connected' });
        dispatch({ type: 'UPDATE_LAST_SERVER_UPDATE', payload: new Date() });
        addNotification('success', `Connected to ${getProviderDisplayName(provider)}!`);
      } else {
        dispatch({ type: 'UPDATE_CONNECTION_STATUS', payload: 'error' });
        addNotification('error', result.error || 'Connection failed');
      }
    } catch (error) {
      dispatch({ type: 'UPDATE_CONNECTION_STATUS', payload: 'error' });
      addNotification('error', 'Connection failed - please try again');
    } finally {
      setIsConnecting(false);
    }
  }, [dispatch, addNotification]);

  const handleDisconnect = useCallback(() => {
    dispatch({ type: 'SET_DRAFT_ROOM_CONNECTION', payload: null });
    dispatch({ type: 'SET_AUTO_SYNC', payload: false });
    dispatch({ type: 'SET_LIVE_DRAFT_STATUS', payload: false });
    addNotification('info', 'Disconnected from draft room');
  }, [dispatch, addNotification]);

  const handleSync = useCallback(async () => {
    if (!state.draftRoomState.connection) return;
    
    dispatch({ type: 'UPDATE_CONNECTION_STATUS', payload: 'syncing' });
    addNotification('info', 'Syncing draft room data...');

    try {
      const result = await simulateSync(state.draftRoomState.connection);
      
      if (result.success) {
        dispatch({ type: 'UPDATE_CONNECTION_STATUS', payload: 'connected' });
        dispatch({ type: 'UPDATE_LAST_SERVER_UPDATE', payload: new Date() });
        addNotification('success', 'Draft room data synced successfully');
        
        // Update draft state with synced data
        if (result.data) {
          dispatch({ type: 'UPDATE_DRAFT_FROM_SYNC', payload: result.data });
        }
      } else {
        dispatch({ type: 'UPDATE_CONNECTION_STATUS', payload: 'error' });
        addNotification('error', result.error || 'Sync failed');
      }
    } catch {
      dispatch({ type: 'UPDATE_CONNECTION_STATUS', payload: 'error' });
      addNotification('error', 'Sync failed - please try again');
    }
  }, [state.draftRoomState.connection, dispatch, addNotification]);

  const handleToggleAutoSync = useCallback(() => {
    const newAutoSync = !state.draftRoomState.autoSync;
    dispatch({ type: 'SET_AUTO_SYNC', payload: newAutoSync });
    addNotification('info', `Auto-sync ${newAutoSync ? 'enabled' : 'disabled'}`);
  }, [state.draftRoomState.autoSync, dispatch, addNotification]);

  // Auto-sync effect
  useEffect(() => {
    if (!state.draftRoomState.autoSync || !state.draftRoomState.connection || 
        state.draftRoomState.connection.status !== 'connected') {
      return;
    }

    const interval = setInterval(() => {
      handleSync();
    }, state.draftRoomState.syncInterval);

    return () => clearInterval(interval);
  }, [state.draftRoomState.autoSync, state.draftRoomState.connection, state.draftRoomState.syncInterval, handleSync]);

  // Effects for automatic notifications
  useEffect(() => {
    if (timerWarning && isTimerActive) {
      addNotification('warning', 'Only 30 seconds remaining!');
    }
  }, [timerWarning, isTimerActive, addNotification]);

  useEffect(() => {
    if (showTimerExpired) {
      addNotification('error', 'Time expired! Auto-advancing pick...');
    }
  }, [showTimerExpired, addNotification]);

  return (
    <div className="space-y-6">
      {/* Draft Timer Control Panel */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Draft Timer Control Panel
          </h3>
          <div className="flex items-center gap-2">
            {isTimerActive ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">Timer Running</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">Timer Stopped</span>
              </>
            )}
          </div>
        </div>

        {/* Large Timer Display */}
        <TimerDisplay
          timeRemaining={draftTimer}
          isActive={isTimerActive}
          isWarning={timerWarning}
          showExpired={showTimerExpired}
          currentPicker={currentPicker}
          currentRound={currentRound}
          totalPicks={totalPicks}
          currentPick={currentPick}
        />

        {/* Timer Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-6">
          <button
            onClick={isTimerActive ? pauseTimer : startTimer}
            className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              isTimerActive 
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isTimerActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isTimerActive ? 'Pause' : 'Start'}
          </button>
          
          <button
            onClick={resetTimer}
            className="py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
          
          <button
            onClick={advanceToNextPicker}
            className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Target className="w-5 h-5" />
            Next Pick
          </button>
          
          <button
            onClick={playWarningSound}
            className="py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Volume2 className="w-5 h-5" />
            Test Sound
          </button>
        </div>

        {/* Draft Progress */}
        <DraftProgress
          currentRound={currentRound}
          draftedPlayersCount={currentPick - 1}
          totalPicks={totalPicks}
          draftedByPosition={draftedByPosition}
        />
      </div>

      {/* Live Draft Room Connection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Live Draft Room Connection
          </h3>
          <div className="flex items-center gap-2">
            {state.draftRoomState.connection ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Not Connected</span>
              </>
            )}
          </div>
        </div>

        {/* Real-time sync status indicators */}
        {state.draftRoomState.connection && (
          <SyncStatusIndicators
            isLiveDraft={state.draftRoomState.isLiveDraft}
            autoSync={state.draftRoomState.autoSync}
            lastServerUpdate={state.draftRoomState.lastServerUpdate}
            onToggleAutoSync={handleToggleAutoSync}
          />
        )}
        
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* URL Input or Connection Status */}
          {!state.draftRoomState.connection ? (
            <DraftRoomURLInput
              onConnect={handleConnect}
              isConnecting={isConnecting}
            />
          ) : (
            <ConnectionStatusDisplay
              connection={state.draftRoomState.connection}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
            />
          )}
          
          {/* Draft Information Panel */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
            <div className="space-y-4">
              <div>
                <div className="font-bold text-lg text-gray-900">{state.draftSettings.draftTime}</div>
                <div className="text-sm text-gray-600">{state.draftSettings.leagueName} League Draft • {draftSettings.timePerPick} seconds per pick</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{state.draftSettings.totalTeams}</div>
                  <div className="text-xs text-gray-600">Teams</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{state.draftSettings.rounds}</div>
                  <div className="text-xs text-gray-600">Rounds</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    state.draftRoomState.connection && state.draftRoomState.connection.status === 'connected'
                      ? 'bg-green-500 animate-pulse'
                      : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {state.draftRoomState.connection ? 'Live Tracking Active' : 'Ready to Connect'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Position {state.draftSettings.position}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Live Draft Room Data - shows synced information */}
        {state.draftRoomState.connection && state.draftRoomState.syncedData && (
          <div className="mt-6">
            <LiveDraftRoomData 
              draftData={state.draftRoomState.syncedData}
              connection={state.draftRoomState.connection}
            />
          </div>
        )}
      </div>

      {/* Draft Recommendations and Notifications Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <DraftRecommendations
          nextRecommendations={nextRecommendations}
          onPlayerClick={handlePlayerClick}
        />
        
        <NotificationCenter
          notifications={notifications}
          onDismiss={dismissNotification}
          onClearAll={clearAllNotifications}
        />
      </div>
    </div>
  );
}