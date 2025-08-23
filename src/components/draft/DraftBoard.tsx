import React, { memo, useCallback, useMemo } from 'react';
import { X, CheckCircle, Star, AlertTriangle, Users } from 'lucide-react';
import { useVirtualization } from '@/hooks/useVirtualization';
import { Player, Position, ScoringSystem } from '@/types';

interface DraftBoardProps {
  players: Player[];
  draftedPlayers: Set<number>;
  searchTerm: string;
  positionFilter: Position | 'ALL';
  scoringSystem: ScoringSystem;
  isCompareMode: boolean;
  selectedPlayers: Set<number>;
  customRankings: Record<number, number>;
  onPlayerDraft: (playerId: number) => void;
  onPlayerSelect: (playerId: number) => void;
  onSearchChange: (term: string) => void;
  onPositionFilterChange: (position: Position | 'ALL') => void;
}

interface PlayerCardProps {
  player: Player;
  index: number;
  isDrafted: boolean;
  isSelected: boolean;
  isCompareMode: boolean;
  scoringSystem: ScoringSystem;
  customRank?: number;
  onDraft: (playerId: number) => void;
  onSelect: (playerId: number) => void;
  style?: React.CSSProperties;
}

// Memoized Player Card Component for optimal performance
const PlayerCard = memo<PlayerCardProps>(({
  player,
  index,
  isDrafted,
  isSelected,
  isCompareMode,
  scoringSystem,
  customRank,
  onDraft,
  onSelect,
  style
}) => {
  const handleClick = useCallback(() => {
    if (isCompareMode) {
      onSelect(player.id);
    } else {
      onDraft(player.id);
    }
  }, [isCompareMode, onSelect, onDraft, player.id]);

  const projection = useMemo(() => {
    return player[scoringSystem];
  }, [player, scoringSystem]);

  const displayRank = useMemo(() => {
    return customRank || index + 1;
  }, [customRank, index]);

  const getInjuryStatusColor = useCallback((injury: string) => {
    switch (injury.toLowerCase()) {
      case 'out':
      case 'ir':
        return 'text-red-600';
      case 'questionable':
        return 'text-yellow-600';
      case 'doubtful':
        return 'text-orange-600';
      default:
        return 'text-green-600';
    }
  }, []);

  const getTierColor = useCallback((tier: number) => {
    if (tier <= 2) return 'bg-green-100 text-green-800';
    if (tier <= 4) return 'bg-blue-100 text-blue-800';
    if (tier <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }, []);

  return (
    <div
      style={style}
      className={`
        flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 
        cursor-pointer transition-all duration-150 
        ${isDrafted ? 'bg-red-50 opacity-60' : 'bg-white'}
        ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
        ${customRank ? 'border-l-4 border-l-purple-500' : ''}
      `}
      onClick={handleClick}
    >
      {/* Player Info Section */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Selection/Draft Status */}
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
          {isCompareMode ? (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
          ) : isDrafted ? (
            <X className="w-6 h-6 text-red-500" />
          ) : (
            <div className="w-6 h-6 border-2 border-gray-400 rounded-full hover:border-blue-500 transition-colors" />
          )}
        </div>

        {/* Rank Badge */}
        <div className="flex-shrink-0">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
            ${customRank ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}
          `}>
            {displayRank}
          </div>
          {customRank && (
            <div className="text-xs text-purple-600 text-center mt-1">Custom</div>
          )}
        </div>

        {/* Player Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{player.name}</h3>
            {player.tier <= 2 && (
              <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(player.tier)}`}>
                {player.position}
              </span>
              <span className="text-gray-600">{player.team}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className={`text-xs ${getInjuryStatusColor(player.injury)}`}>
                {player.injury !== 'Healthy' && (
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                )}
                {player.injury}
              </span>
            </div>
          </div>

          {/* Player News */}
          {player.news && (
            <div className="text-xs text-gray-600 mt-1 truncate">
              {player.news}
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex items-center gap-6 text-sm text-right">
        {/* Projection */}
        <div className="text-center">
          <div className="font-semibold text-gray-900">{projection.toFixed(1)}</div>
          <div className="text-xs text-gray-600">{scoringSystem.toUpperCase()} Proj</div>
        </div>

        {/* ADP */}
        <div className="text-center">
          <div className="font-semibold text-gray-700">{player.adp.toFixed(1)}</div>
          <div className="text-xs text-gray-600">ADP</div>
        </div>

        {/* Tier Badge */}
        <div className="text-center">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(player.tier)}`}>
            T{player.tier}
          </div>
        </div>
      </div>
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';

// Main DraftBoard Component
const DraftBoard = memo<DraftBoardProps>(({
  players,
  draftedPlayers,
  searchTerm,
  positionFilter,
  scoringSystem,
  isCompareMode,
  selectedPlayers,
  customRankings,
  onPlayerDraft,
  onPlayerSelect,
  onSearchChange,
  onPositionFilterChange
}) => {
  // Memoized filtered and sorted players list
  const filteredPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      const matchesSearch = searchTerm === '' || 
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPosition = positionFilter === 'ALL' || player.position === positionFilter;
      
      return matchesSearch && matchesPosition;
    });

    // Sort players with custom rankings applied
    filtered.sort((a, b) => {
      // Drafted players go to bottom
      const aDrafted = draftedPlayers.has(a.id);
      const bDrafted = draftedPlayers.has(b.id);
      
      if (aDrafted && !bDrafted) return 1;
      if (!aDrafted && bDrafted) return -1;
      if (aDrafted && bDrafted) return a.adp - b.adp;

      // Apply custom rankings
      const aRank = customRankings[a.id] || a.adp;
      const bRank = customRankings[b.id] || b.adp;
      
      return aRank - bRank;
    });

    return filtered;
  }, [players, searchTerm, positionFilter, draftedPlayers, customRankings]);

  // Memoized player statistics for performance indicators
  const playerStats = useMemo(() => {
    const total = filteredPlayers.length;
    const drafted = filteredPlayers.filter(p => draftedPlayers.has(p.id)).length;
    const available = total - drafted;
    
    const positionBreakdown = filteredPlayers.reduce((acc, player) => {
      if (!draftedPlayers.has(player.id)) {
        acc[player.position] = (acc[player.position] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      drafted,
      available,
      positionBreakdown
    };
  }, [filteredPlayers, draftedPlayers]);

  // Optimized event handlers
  const handlePlayerDraft = useCallback((playerId: number) => {
    onPlayerDraft(playerId);
  }, [onPlayerDraft]);

  const handlePlayerSelect = useCallback((playerId: number) => {
    onPlayerSelect(playerId);
  }, [onPlayerSelect]);

  // Virtual scrolling configuration
  const ITEM_HEIGHT = 120; // Height per player card in pixels
  const CONTAINER_HEIGHT = 600; // Visible container height
  
  const {
    visibleItems,
    totalHeight,
    getItemProps,
    containerProps
  } = useVirtualization(filteredPlayers, {
    itemHeight: ITEM_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    overscan: 5 // Render 5 extra items above/below visible area
  });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with Stats */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Draft Board
          </h2>
          
          <div className="text-sm text-gray-600">
            Showing {playerStats.available} of {playerStats.total} available players
          </div>
        </div>

        {/* Position breakdown */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(playerStats.positionBreakdown).map(([position, count]) => (
            <button
              key={position}
              onClick={() => onPositionFilterChange(position as Position)}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${positionFilter === position 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              {position}: {count}
            </button>
          ))}
          {positionFilter !== 'ALL' && (
            <button
              onClick={() => onPositionFilterChange('ALL')}
              className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Virtualized Player List */}
      <div className="relative">
        {filteredPlayers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No players found matching your criteria.</p>
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="mt-2 text-blue-600 hover:text-blue-700 underline"
              >
                Clear search to see all players
              </button>
            )}
          </div>
        ) : (
          <div 
            {...containerProps}
            className="overflow-auto"
            style={{ 
              height: Math.min(CONTAINER_HEIGHT, filteredPlayers.length * ITEM_HEIGHT),
              position: 'relative'
            }}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              {visibleItems.map((player, virtualIndex) => {
                const actualIndex = filteredPlayers.findIndex(p => p.id === player.id);
                return (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    index={actualIndex}
                    isDrafted={draftedPlayers.has(player.id)}
                    isSelected={selectedPlayers.has(player.id)}
                    isCompareMode={isCompareMode}
                    scoringSystem={scoringSystem}
                    customRank={customRankings[player.id]}
                    onDraft={handlePlayerDraft}
                    onSelect={handlePlayerSelect}
                    style={getItemProps(virtualIndex).style}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer with Compare Mode Status */}
      {isCompareMode && (
        <div className="p-4 border-t border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Compare Mode Active - {selectedPlayers.size} of 4 players selected
              </span>
            </div>
            
            {selectedPlayers.size >= 2 && (
              <div className="text-xs text-blue-600">
                Click "Compare Selected Players" in the filters to view comparison
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

DraftBoard.displayName = 'DraftBoard';

export default DraftBoard;