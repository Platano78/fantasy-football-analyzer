import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, Target, Volume2, Eye, X, Zap, Bell, Timer, TrendingUp } from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { useDraftSimulation } from '@/hooks';
import { Player, Position } from '@/types';
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

// Main TrackerView component
export default function TrackerView() {
  const { state, dispatch } = useFantasyFootball();
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    message: string;
    timestamp: Date;
  }>>([]);
  const [isDraftTracking, setIsDraftTracking] = useState(false);
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
  } = useDraftSimulation();

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
      draftPlayer(player.id);
      addNotification('success', `Drafted ${player.name} (${player.position})`);
    } else {
      addNotification('info', `Viewing ${player.name} details`);
    }
  }, [isDraftActive, isUserTurn, draftPlayer, addNotification]);

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

      {/* Live Draft Tracker */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Live Draft Tracker
          </h3>
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-600">Ready</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg text-gray-900">SUNDAY, AUGUST 24 • 9:00 PM EDT</div>
              <div className="text-sm text-gray-600">Injustice League Draft • {draftSettings.timePerPick} seconds per pick</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-xs text-gray-600">Days Away</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDraftTracking(!isDraftTracking)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isDraftTracking
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isDraftTracking ? (
                <>
                  <X className="w-4 h-4" />
                  Stop Tracking
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Tracking
                </>
              )}
            </button>
            
            <div className="text-sm text-gray-600">
              {isDraftTracking ? 'Monitoring draft room...' : 'Click to begin live draft tracking'}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Auto-sync enabled</span>
          </div>
        </div>
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