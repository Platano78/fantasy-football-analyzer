import { memo, useMemo, useCallback, useState } from 'react';
import { BarChart3, RotateCcw, Download, Target, Search, CheckCircle, AlertTriangle, GripVertical } from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { usePlayerFiltering, useVirtualization } from '@/hooks';
import { Player, Position, ScoringSystem } from '@/types';

// Memoized custom ranking card with drag-and-drop capability
const RankingCard = memo(({ 
  player, 
  index,
  customRank,
  scoringSystem,
  onRankUpdate,
  onClearRank,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging
}: {
  player: Player;
  index: number;
  customRank?: number;
  scoringSystem: ScoringSystem;
  onRankUpdate: (playerId: number, rank: number | undefined) => void;
  onClearRank: (playerId: number) => void;
  onDragStart: (player: Player) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, player: Player) => void;
  isDragging: boolean;
}) => {
  const hasCustomRank = customRank !== undefined;
  
  const handleRankChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onRankUpdate(player.id, isNaN(value) ? undefined : value);
  }, [player.id, onRankUpdate]);

  const handleClearClick = useCallback(() => {
    onClearRank(player.id);
  }, [player.id, onClearRank]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    onDragStart(player);
  }, [player, onDragStart]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    onDragOver(e);
  }, [onDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    onDrop(e, player);
  }, [player, onDrop]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`p-3 hover:bg-gray-100 cursor-move transition-colors ${
        hasCustomRank ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="grid grid-cols-5 gap-4 items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-400" />
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {index + 1}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{player.name}</div>
            <div className="text-sm text-gray-600">{player.position} • {player.team}</div>
          </div>
        </div>
        
        <div className="text-center">
          <input
            type="number"
            value={customRank || ''}
            onChange={handleRankChange}
            placeholder={player.adp.toFixed(1)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
            min="1"
            max="300"
            step="0.1"
          />
        </div>
        
        <div className="text-center text-sm text-gray-600">
          {player.adp.toFixed(1)}
        </div>
        
        <div className="text-center">
          <div className="font-bold text-blue-600">{player[scoringSystem].toFixed(1)}</div>
          <div className="text-xs text-gray-500">pts/game</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {player.injury === 'Healthy' ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-yellow-500" />
            )}
            <span className="text-xs text-gray-500">{player.injury}</span>
          </div>
        </div>
        
        <div className="text-center">
          {hasCustomRank && (
            <button
              onClick={handleClearClick}
              className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

RankingCard.displayName = 'RankingCard';

// Memoized tier display component
const TierDisplay = memo(({ 
  players,
  tierRanges
}: {
  players: Player[];
  tierRanges: Record<Position, { tier1: number; tier2: number; tier3: number }>;
}) => {
  const tiers = useMemo(() => {
    const tierGroups: Record<Position, { tier1: Player[]; tier2: Player[]; tier3: Player[]; tier4: Player[] }> = {
      QB: { tier1: [], tier2: [], tier3: [], tier4: [] },
      RB: { tier1: [], tier2: [], tier3: [], tier4: [] },
      WR: { tier1: [], tier2: [], tier3: [], tier4: [] },
      TE: { tier1: [], tier2: [], tier3: [], tier4: [] },
      DEF: { tier1: [], tier2: [], tier3: [], tier4: [] },
      K: { tier1: [], tier2: [], tier3: [], tier4: [] }
    };

    players.forEach(player => {
      const ranges = tierRanges[player.position];
      if (player.adp <= ranges.tier1) {
        tierGroups[player.position].tier1.push(player);
      } else if (player.adp <= ranges.tier2) {
        tierGroups[player.position].tier2.push(player);
      } else if (player.adp <= ranges.tier3) {
        tierGroups[player.position].tier3.push(player);
      } else {
        tierGroups[player.position].tier4.push(player);
      }
    });

    return tierGroups;
  }, [players, tierRanges]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Target className="w-5 h-5" />
        Position Tiers Overview
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(['QB', 'RB', 'WR', 'TE', 'DEF', 'K'] as Position[]).map(position => (
          <div key={position} className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">{position}</h4>
            <div className="space-y-2">
              {[
                { tier: 'tier1', label: 'Tier 1', color: 'bg-green-100 text-green-800' },
                { tier: 'tier2', label: 'Tier 2', color: 'bg-blue-100 text-blue-800' },
                { tier: 'tier3', label: 'Tier 3', color: 'bg-yellow-100 text-yellow-800' },
                { tier: 'tier4', label: 'Tier 4+', color: 'bg-gray-100 text-gray-800' }
              ].map(({ tier, label, color }) => (
                <div key={tier} className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
                    {label}
                  </span>
                  <span className="text-sm text-gray-600">
                    {tiers[position][tier as keyof typeof tiers[Position]].length} players
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

TierDisplay.displayName = 'TierDisplay';

// Optimized virtual scrolling for rankings list
const VirtualRankingsList = memo(({ 
  players,
  customRankings,
  scoringSystem,
  draggedPlayer,
  onRankUpdate,
  onClearRank,
  onDragStart,
  onDragOver,
  onDrop,
  itemHeight = 75,
  containerHeight = 480
}: {
  players: Player[];
  customRankings: Record<number, number>;
  scoringSystem: ScoringSystem;
  draggedPlayer: Player | null;
  onRankUpdate: (playerId: number, rank: number | undefined) => void;
  onClearRank: (playerId: number) => void;
  onDragStart: (player: Player) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, player: Player) => void;
  itemHeight?: number;
  containerHeight?: number;
}) => {
  const {
    visibleItems,
    totalHeight,
    containerProps,
    getItemProps
  } = useVirtualization(players.slice(0, 100), {
    itemHeight,
    containerHeight,
    overscan: 3
  });

  return (
    <div 
      className="overflow-auto bg-gray-50 rounded-lg"
      {...containerProps}
    >
      <div className="p-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-gray-600 uppercase">
          <div>Rank & Player</div>
          <div className="text-center">Custom Rank</div>
          <div className="text-center">Original ADP</div>
          <div className="text-center">{scoringSystem.toUpperCase()} Proj</div>
          <div className="text-center">Actions</div>
        </div>
      </div>
      
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((player, index) => (
          <div key={player.id} {...getItemProps(index)}>
            <RankingCard
              player={player}
              index={index}
              customRank={customRankings[player.id]}
              scoringSystem={scoringSystem}
              onRankUpdate={onRankUpdate}
              onClearRank={onClearRank}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isDragging={draggedPlayer?.id === player.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualRankingsList.displayName = 'VirtualRankingsList';

// Main RankingsView component
export default function RankingsView() {
  const { state, dispatch } = useFantasyFootball();
  const [customRankings, setCustomRankings] = useState<Record<number, number>>({});
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const {
    players: filteredPlayers,
    searchTerm,
    positionFilter,
    setSearchTerm,
    setPositionFilter,
    clearFilters
  } = usePlayerFiltering();

  // Default tier ranges for each position
  const tierRanges = useMemo(() => ({
    QB: { tier1: 24, tier2: 48, tier3: 72 },
    RB: { tier1: 36, tier2: 72, tier3: 108 },
    WR: { tier1: 48, tier2: 96, tier3: 144 },
    TE: { tier1: 24, tier2: 48, tier3: 72 },
    DEF: { tier1: 36, tier2: 72, tier3: 108 },
    K: { tier1: 24, tier2: 48, tier3: 72 }
  }), []);

  // Memoized sorted players with custom rankings applied
  const rankedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      const aRank = customRankings[a.id] ?? a.adp;
      const bRank = customRankings[b.id] ?? b.adp;
      return aRank - bRank;
    });
  }, [filteredPlayers, customRankings]);

  // Callback handlers for performance
  const updateCustomRanking = useCallback((playerId: number, rank: number | undefined) => {
    setCustomRankings(prev => {
      if (rank === undefined) {
        const { [playerId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [playerId]: rank };
    });
  }, []);

  const clearCustomRank = useCallback((playerId: number) => {
    setCustomRankings(prev => {
      const { [playerId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const resetCustomRankings = useCallback(() => {
    setCustomRankings({});
  }, []);

  const handleDragStart = useCallback((player: Player) => {
    setDraggedPlayer(player);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetPlayer: Player) => {
    e.preventDefault();
    
    if (!draggedPlayer || draggedPlayer.id === targetPlayer.id) {
      setDraggedPlayer(null);
      return;
    }

    const sourceIndex = rankedPlayers.findIndex(p => p.id === draggedPlayer.id);
    const targetIndex = rankedPlayers.findIndex(p => p.id === targetPlayer.id);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      // Update custom rankings to reflect the new order
      const newRankings = { ...customRankings };
      newRankings[draggedPlayer.id] = targetIndex + 1;
      
      // Adjust other rankings if necessary
      if (sourceIndex < targetIndex) {
        for (let i = sourceIndex + 1; i <= targetIndex; i++) {
          const player = rankedPlayers[i];
          if (player.id !== draggedPlayer.id) {
            newRankings[player.id] = (newRankings[player.id] ?? player.adp) - 1;
          }
        }
      } else {
        for (let i = targetIndex; i < sourceIndex; i++) {
          const player = rankedPlayers[i];
          if (player.id !== draggedPlayer.id) {
            newRankings[player.id] = (newRankings[player.id] ?? player.adp) + 1;
          }
        }
      }
      
      setCustomRankings(newRankings);
    }
    
    setDraggedPlayer(null);
  }, [draggedPlayer, rankedPlayers, customRankings]);

  const exportRankings = useCallback(() => {
    const csvContent = [
      ['Rank', 'Player', 'Position', 'Team', 'Custom Rank', 'Original ADP', `${state.scoringSystem.toUpperCase()} Projection`],
      ...rankedPlayers.map((player, index) => [
        index + 1,
        player.name,
        player.position,
        player.team,
        customRankings[player.id] || '',
        player.adp,
        player[state.scoringSystem].toFixed(1)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-rankings-${state.scoringSystem}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  }, [rankedPlayers, customRankings, state.scoringSystem]);

  const handleScoringSystemChange = useCallback((system: ScoringSystem) => {
    dispatch({ type: 'SET_SCORING_SYSTEM', payload: system });
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Custom Player Rankings
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={resetCustomRankings}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Rankings
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 flex items-center gap-1">
            <Target className="w-4 h-4" />
            Drag and drop players to reorder your custom rankings. Your personal rankings will override default projections in the draft board.
          </p>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Players</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search names, teams..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value as Position | 'ALL')}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Positions</option>
              <option value="QB">Quarterbacks</option>
              <option value="RB">Running Backs</option>
              <option value="WR">Wide Receivers</option>
              <option value="TE">Tight Ends</option>
              <option value="DEF">Defenses</option>
              <option value="K">Kickers</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scoring</label>
            <select
              value={state.scoringSystem}
              onChange={(e) => handleScoringSystemChange(e.target.value as ScoringSystem)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ppr">Full PPR</option>
              <option value="halfPpr">Half PPR</option>
              <option value="standard">Standard</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tier Overview */}
      <TierDisplay 
        players={state.players}
        tierRanges={tierRanges}
      />

      {/* Rankings List */}
      <VirtualRankingsList
        players={rankedPlayers}
        customRankings={customRankings}
        scoringSystem={state.scoringSystem}
        draggedPlayer={draggedPlayer}
        onRankUpdate={updateCustomRanking}
        onClearRank={clearCustomRank}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        containerHeight={600}
      />

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Export Rankings</h3>
            <p className="text-sm text-gray-600 mb-6">
              Export your custom rankings as a CSV file. This will include all players with their custom ranks and projections.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={exportRankings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}