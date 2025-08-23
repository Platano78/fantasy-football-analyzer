import { memo, useMemo, useCallback, useState } from 'react';
import { Users, Play, Pause, RotateCcw, TrendingUp, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { useDraftSimulation, usePlayerFiltering, usePlayerComparison, useVirtualization } from '@/hooks';
import { Player, Position, ScoringSystem } from '@/types';
import { DraftTimer, PlayerComparisonModal, DraftBoardFilters } from '@/components';

// Memoized PlayerCard component for optimal re-rendering
const PlayerCard = memo(({ 
  player, 
  isDrafted, 
  isRecommended, 
  isSelected, 
  isCompareMode, 
  scoringSystem,
  onPlayerAction 
}: {
  player: Player;
  isDrafted: boolean;
  isRecommended: boolean;
  isSelected: boolean;
  isCompareMode: boolean;
  scoringSystem: ScoringSystem;
  onPlayerAction: (playerId: number) => void;
}) => {
  const handleClick = useCallback(() => {
    onPlayerAction(player.id);
  }, [player.id, onPlayerAction]);

  return (
    <div
      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        isDrafted ? 'bg-gray-100 opacity-60' : ''
      } ${isRecommended ? 'bg-green-50 border-l-4 border-green-500' : ''} ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            {isCompareMode ? (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            ) : isDrafted ? (
              <X className="w-6 h-6 text-red-500 font-bold" />
            ) : (
              <div className="w-6 h-6 border-2 border-gray-400 rounded-full hover:border-blue-500" />
            )}
          </div>
          
          <div className={isDrafted ? 'line-through text-gray-500' : ''}>
            <div className="font-semibold text-gray-900">
              {player.name}
              {isRecommended && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  RECOMMENDED
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {player.position} • {player.team} • ADP: {player.adp}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {player.news}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-bold text-lg text-blue-600">
            {player[scoringSystem].toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">proj. pts/game</div>
          <div className="flex items-center gap-1 mt-1">
            {player.injury === 'Healthy' ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-yellow-500" />
            )}
            <span className="text-xs text-gray-500">{player.injury}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';


// Memoized draft info sidebar
const DraftInfo = memo(({ 
  currentPicker,
  currentRound,
  isTimerActive,
  nextPick,
  draftedPlayersCount,
  players
}: {
  currentPicker: number;
  currentRound: number;
  isTimerActive: boolean;
  nextPick: Player | null;
  draftedPlayersCount: Record<Position, number>;
  players: Player[];
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Injustice League Info
      </h3>
      
      <div className="space-y-2 mb-4">
        <div className="text-sm">
          <span className="font-medium text-gray-700">Current Turn:</span>
          <span className={`ml-1 font-bold ${isTimerActive ? 'text-green-600' : 'text-blue-600'}`}>
            Team {currentPicker}
          </span>
        </div>
        <div className="text-sm">
          <span className="font-medium text-gray-700">Round:</span>
          <span className="text-gray-600 ml-1">{currentRound}</span>
        </div>
        {nextPick && (
          <div className="text-sm">
            <span className="font-medium text-green-700">Suggested Pick:</span>
            <div className="font-bold text-green-800">{nextPick.name}</div>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-sm">
          <span className="font-medium text-gray-700">Roster:</span>
          <span className="text-gray-600 ml-1">1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX, 1 K, 1 DEF</span>
        </div>
        <div className="text-sm">
          <span className="font-medium text-gray-700">Scoring:</span>
          <span className="text-gray-600 ml-1">Full PPR + Big Play Bonuses</span>
        </div>
        <div className="text-sm">
          <span className="font-medium text-gray-700">Bench:</span>
          <span className="text-gray-600 ml-1">9 spots + 2 Reserve</span>
        </div>
      </div>

      <div className="space-y-3">
        {(['QB', 'RB', 'WR', 'TE', 'DEF', 'K'] as Position[]).map(position => (
          <div key={position} className="flex justify-between items-center">
            <span className="font-medium text-gray-700">{position}</span>
            <span className="text-gray-600">{draftedPlayersCount[position] || 0} drafted</span>
          </div>
        ))}
      </div>
    </div>
  );
});

DraftInfo.displayName = 'DraftInfo';

// Memoized simulation controls
const SimulationControls = memo(({ 
  isDraftActive,
  onStartSimulation,
  onStopSimulation,
  onResetDraft
}: {
  isDraftActive: boolean;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onResetDraft: () => void;
}) => {
  return (
    <div className="flex gap-2 mb-4">
      {!isDraftActive ? (
        <button
          onClick={onStartSimulation}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Start Simulation
        </button>
      ) : (
        <button
          onClick={onStopSimulation}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Pause className="w-4 h-4" />
          Stop Simulation
        </button>
      )}
      
      <button
        onClick={onResetDraft}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Reset Draft
      </button>
    </div>
  );
});

SimulationControls.displayName = 'SimulationControls';

// Optimized virtual scrolling implementation for player list
const VirtualPlayerList = memo(({ 
  players,
  draftedPlayers,
  selectedPlayers,
  isCompareMode,
  scoringSystem,
  nextPick,
  onPlayerAction,
  itemHeight = 85,
  containerHeight = 480
}: {
  players: Player[];
  draftedPlayers: Set<number>;
  selectedPlayers: Set<number>;
  isCompareMode: boolean;
  scoringSystem: ScoringSystem;
  nextPick: Player | null;
  onPlayerAction: (playerId: number) => void;
  itemHeight?: number;
  containerHeight?: number;
}) => {
  const {
    visibleItems,
    totalHeight,
    containerProps,
    getItemProps
  } = useVirtualization(players, {
    itemHeight,
    containerHeight,
    overscan: 5 // Render 5 extra items above/below for smoother scrolling
  });

  return (
    <div 
      className="overflow-auto"
      {...containerProps}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((player, index) => {
          const isDrafted = draftedPlayers.has(player.id);
          const isRecommended = nextPick?.id === player.id;
          const isSelected = selectedPlayers.has(player.id);
          
          return (
            <div key={player.id} {...getItemProps(index)}>
              <PlayerCard
                player={player}
                isDrafted={isDrafted}
                isRecommended={isRecommended}
                isSelected={isSelected}
                isCompareMode={isCompareMode}
                scoringSystem={scoringSystem}
                onPlayerAction={onPlayerAction}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualPlayerList.displayName = 'VirtualPlayerList';

// Main DraftView component
export default function DraftView() {
  const { state, dispatch } = useFantasyFootball();
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  
  const { 
    isDraftActive, 
    isUserTurn, 
    currentPicker, 
    currentRound,
    draftTimer,
    isTimerActive,
    timerWarning,
    showTimerExpired,
    startSimulation,
    stopSimulation,
    draftPlayer,
    resetDraft,
    availablePlayers
  } = useDraftSimulation();
  
  const {
    players: filteredPlayers,
    searchTerm,
    positionFilter,
    setSearchTerm,
    setPositionFilter,
    clearFilters
  } = usePlayerFiltering();

  const {
    isCompareMode,
    selectedPlayers,
    selectedPlayersList,
    togglePlayer,
    toggleCompareMode,
    exportComparison
  } = usePlayerComparison();

  // Memoized computed values for performance
  const nextPick = useMemo(() => {
    if (!isUserTurn || !availablePlayers.length) return null;
    return availablePlayers.reduce((best, player) => 
      player.adp < best.adp ? player : best
    );
  }, [isUserTurn, availablePlayers]);

  const draftedPlayersCount = useMemo(() => {
    return Array.from(state.draftedPlayers).reduce((counts, playerId) => {
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        counts[player.position] = (counts[player.position] || 0) + 1;
      }
      return counts;
    }, {} as Record<Position, number>);
  }, [state.draftedPlayers, state.players]);

  // Callback handlers for performance
  const handlePlayerAction = useCallback((playerId: number) => {
    if (isCompareMode) {
      togglePlayer(playerId);
    } else if (isDraftActive && isUserTurn) {
      draftPlayer(playerId);
    } else if (!isDraftActive) {
      // Toggle drafted status for manual selection
      if (state.draftedPlayers.has(playerId)) {
        dispatch({ 
          type: 'DESELECT_PLAYER', 
          payload: { playerId, teamId: currentPicker } 
        });
      } else {
        dispatch({ 
          type: 'DRAFT_PLAYER', 
          payload: { playerId, teamId: currentPicker } 
        });
      }
    }
  }, [isCompareMode, isDraftActive, isUserTurn, togglePlayer, draftPlayer, dispatch, state.draftedPlayers, currentPicker]);

  const handleScoringSystemChange = useCallback((system: ScoringSystem) => {
    dispatch({ type: 'SET_SCORING_SYSTEM', payload: system });
  }, [dispatch]);

  const handleOpenComparison = useCallback(() => {
    setShowComparisonModal(true);
  }, []);

  const handleCloseComparison = useCallback(() => {
    setShowComparisonModal(false);
  }, []);

  const startTimer = useCallback(() => {
    dispatch({ type: 'START_TIMER' });
  }, [dispatch]);

  const stopTimer = useCallback(() => {
    dispatch({ type: 'STOP_TIMER' });
  }, [dispatch]);

  const resetTimer = useCallback(() => {
    dispatch({ type: 'STOP_TIMER' });
    // Reset timer to default time
  }, [dispatch]);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Draft Board */}
      <div className="lg:col-span-2">
        <SimulationControls
          isDraftActive={isDraftActive}
          onStartSimulation={startSimulation}
          onStopSimulation={stopSimulation}
          onResetDraft={resetDraft}
        />

        <DraftBoardFilters
          searchTerm={searchTerm}
          positionFilter={positionFilter}
          scoringSystem={state.scoringSystem}
          isCompareMode={isCompareMode}
          selectedPlayersCount={selectedPlayers.size}
          onSearchChange={setSearchTerm}
          onPositionFilterChange={setPositionFilter}
          onScoringSystemChange={handleScoringSystemChange}
          onToggleCompareMode={toggleCompareMode}
          onOpenComparison={handleOpenComparison}
          onClearFilters={clearFilters}
        />

        {/* Draft Board */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Player Rankings - {state.scoringSystem.toUpperCase()}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isDraftActive && isUserTurn ? (
                <span className="text-green-600 font-medium">YOUR TURN - Click a player to draft</span>
              ) : isDraftActive ? (
                <span className="text-blue-600">AI is drafting... Wait for your turn</span>
              ) : isCompareMode ? 
                'Select players with checkboxes to compare • Up to 4 players' :
                'Click ○ to draft players • Click ✕ to undo • Toggle Compare Mode for player analysis'
              }
            </p>
          </div>
          
          <VirtualPlayerList
            players={filteredPlayers}
            draftedPlayers={state.draftedPlayers}
            selectedPlayers={selectedPlayers}
            isCompareMode={isCompareMode}
            scoringSystem={state.scoringSystem}
            nextPick={nextPick}
            onPlayerAction={handlePlayerAction}
            containerHeight={480}
          />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="space-y-6">
        <DraftTimer
          timeRemaining={draftTimer}
          isActive={isTimerActive}
          isWarning={timerWarning}
          showExpired={showTimerExpired}
          currentPicker={currentPicker}
          currentRound={currentRound}
          onStart={startTimer}
          onStop={stopTimer}
          onReset={resetTimer}
        />
        
        <DraftInfo
          currentPicker={currentPicker}
          currentRound={currentRound}
          isTimerActive={isTimerActive}
          nextPick={nextPick}
          draftedPlayersCount={draftedPlayersCount}
          players={state.players}
        />
      </div>

      {/* Player Comparison Modal */}
      <PlayerComparisonModal
        isOpen={showComparisonModal}
        players={selectedPlayersList}
        scoringSystem={state.scoringSystem}
        onClose={handleCloseComparison}
        onExport={exportComparison}
      />
    </div>
  );
}