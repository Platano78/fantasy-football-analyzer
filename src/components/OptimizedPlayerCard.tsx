/**
 * Highly optimized PlayerCard component with advanced React performance patterns
 * Demonstrates proper memo usage, callback optimization, and render prevention
 */

import React, { memo, useMemo, useCallback, useRef } from 'react';
import { CheckCircle, AlertTriangle, X, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { Player, ScoringSystem } from '@/types';

// ============================================================================
// TYPE DEFINITIONS FOR OPTIMIZATION
// ============================================================================

interface PlayerCardProps {
  player: Player;
  isDrafted: boolean;
  isRecommended: boolean;
  isSelected: boolean;
  isCompareMode: boolean;
  scoringSystem: ScoringSystem;
  showAdvancedStats?: boolean;
  showTrendIndicator?: boolean;
  onPlayerAction: (playerId: number) => void;
  onPlayerHover?: (playerId: number) => void;
  className?: string;
}

// Custom comparison function for React.memo
const arePlayerPropsEqual = (
  prevProps: PlayerCardProps,
  nextProps: PlayerCardProps
): boolean => {
  // Quick reference equality checks first (most performant)
  if (
    prevProps.player === nextProps.player &&
    prevProps.isDrafted === nextProps.isDrafted &&
    prevProps.isRecommended === nextProps.isRecommended &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isCompareMode === nextProps.isCompareMode &&
    prevProps.scoringSystem === nextProps.scoringSystem &&
    prevProps.showAdvancedStats === nextProps.showAdvancedStats &&
    prevProps.showTrendIndicator === nextProps.showTrendIndicator &&
    prevProps.onPlayerAction === nextProps.onPlayerAction &&
    prevProps.onPlayerHover === nextProps.onPlayerHover &&
    prevProps.className === nextProps.className
  ) {
    return true;
  }

  // If player object is different, check if it's the same player with same relevant data
  if (prevProps.player.id !== nextProps.player.id) {
    return false;
  }

  // Deep comparison for player-specific data that affects rendering
  const playerPropsToCompare: (keyof Player)[] = [
    'name', 'position', 'team', 'adp', 'news', 'injury'
  ];

  for (const prop of playerPropsToCompare) {
    if (prevProps.player[prop] !== nextProps.player[prop]) {
      return false;
    }
  }

  // Compare scoring values
  if (prevProps.player[prevProps.scoringSystem] !== nextProps.player[nextProps.scoringSystem]) {
    return false;
  }

  return true;
};

// ============================================================================
// MEMOIZED SUBCOMPONENTS
// ============================================================================

// Memoized player status indicator
const PlayerStatusIndicator = memo<{
  isCompareMode: boolean;
  isDrafted: boolean;
  isSelected: boolean;
  onClick: () => void;
}>(({ isCompareMode, isDrafted, isSelected, onClick }) => (
  <div className="w-8 h-8 flex items-center justify-center">
    {isCompareMode ? (
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onClick}
        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
      />
    ) : isDrafted ? (
      <X className="w-6 h-6 text-red-500 font-bold" />
    ) : (
      <div 
        className="w-6 h-6 border-2 border-gray-400 rounded-full hover:border-blue-500 cursor-pointer transition-colors"
        onClick={onClick}
      />
    )}
  </div>
));

PlayerStatusIndicator.displayName = 'PlayerStatusIndicator';

// Memoized player info section
const PlayerInfo = memo<{
  name: string;
  position: string;
  team: string;
  adp: number;
  news: string;
  isRecommended: boolean;
  isDrafted: boolean;
  showTrendIndicator: boolean;
  trend?: 'up' | 'down' | 'stable';
}>(({ name, position, team, adp, news, isRecommended, isDrafted, showTrendIndicator, trend = 'stable' }) => {
  // Memoize trend icon to prevent recreation
  const TrendIcon = useMemo(() => {
    if (!showTrendIndicator) return null;
    
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  }, [showTrendIndicator, trend]);

  return (
    <div className={isDrafted ? 'line-through text-gray-500' : ''}>
      <div className="font-semibold text-gray-900 flex items-center gap-2">
        {name}
        {TrendIcon}
        {isRecommended && (
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            RECOMMENDED
          </span>
        )}
      </div>
      <div className="text-sm text-gray-600">
        {position} • {team} • ADP: {adp}
      </div>
      {news && (
        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
          {news}
        </div>
      )}
    </div>
  );
});

PlayerInfo.displayName = 'PlayerInfo';

// Memoized player stats section
const PlayerStats = memo<{
  projectedPoints: number;
  scoringSystem: ScoringSystem;
  injury: string;
  showAdvancedStats: boolean;
  player: Player;
}>(({ projectedPoints, scoringSystem, injury, showAdvancedStats, player }) => {
  // Memoize advanced stats calculation
  const advancedStats = useMemo(() => {
    if (!showAdvancedStats) return null;

    return {
      consistency: Math.random() * 100, // Placeholder - would be real data
      upside: Math.random() * 100,
      floor: projectedPoints * 0.7,
      ceiling: projectedPoints * 1.3
    };
  }, [showAdvancedStats, projectedPoints]);

  return (
    <div className="text-right">
      <div className="font-bold text-lg text-blue-600">
        {projectedPoints.toFixed(1)}
      </div>
      <div className="text-xs text-gray-500">proj. pts/game</div>
      
      {/* Health status */}
      <div className="flex items-center justify-end gap-1 mt-1">
        {injury === 'Healthy' ? (
          <CheckCircle className="w-3 h-3 text-green-500" />
        ) : (
          <AlertTriangle className="w-3 h-3 text-yellow-500" />
        )}
        <span className="text-xs text-gray-500">{injury}</span>
      </div>

      {/* Advanced stats */}
      {showAdvancedStats && advancedStats && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Floor: {advancedStats.floor.toFixed(1)}</div>
            <div>Ceiling: {advancedStats.ceiling.toFixed(1)}</div>
          </div>
        </div>
      )}
    </div>
  );
});

PlayerStats.displayName = 'PlayerStats';

// ============================================================================
// MAIN OPTIMIZED PLAYER CARD COMPONENT
// ============================================================================

const OptimizedPlayerCard: React.FC<PlayerCardProps> = memo(({
  player,
  isDrafted,
  isRecommended,
  isSelected,
  isCompareMode,
  scoringSystem,
  showAdvancedStats = false,
  showTrendIndicator = false,
  onPlayerAction,
  onPlayerHover,
  className = ""
}) => {
  // Memoize projected points to prevent recalculation
  const projectedPoints = useMemo(() => {
    return player[scoringSystem];
  }, [player, scoringSystem]);

  // Memoize click handler to prevent recreation
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Prevent event bubbling for checkbox in compare mode
    if (isCompareMode && (e.target as HTMLElement).type === 'checkbox') {
      return;
    }
    onPlayerAction(player.id);
  }, [player.id, onPlayerAction, isCompareMode]);

  // Memoize hover handler
  const handleMouseEnter = useCallback(() => {
    onPlayerHover?.(player.id);
  }, [player.id, onPlayerHover]);

  // Memoize status indicator click handler
  const handleStatusClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayerAction(player.id);
  }, [player.id, onPlayerAction]);

  // Memoize class names to prevent string concatenation on every render
  const cardClassName = useMemo(() => {
    const baseClasses = "p-3 hover:bg-gray-50 cursor-pointer transition-colors";
    const statusClasses = isDrafted ? " bg-gray-100 opacity-60" : "";
    const recommendedClasses = isRecommended ? " bg-green-50 border-l-4 border-green-500" : "";
    const selectedClasses = isSelected ? " bg-blue-50 border-l-4 border-blue-500" : "";
    
    return `${baseClasses}${statusClasses}${recommendedClasses}${selectedClasses} ${className}`.trim();
  }, [isDrafted, isRecommended, isSelected, className]);

  // Performance tracking ref
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  // Optional: Track re-renders in development
  if (process.env.NODE_ENV === 'development' && renderCountRef.current > 10) {
    console.warn(`PlayerCard for ${player.name} has re-rendered ${renderCountRef.current} times`);
  }

  return (
    <div
      className={cardClassName}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      role="button"
      tabIndex={0}
      aria-label={`${isCompareMode ? 'Select' : 'Draft'} ${player.name}`}
      data-player-id={player.id}
      data-render-count={renderCountRef.current}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <PlayerStatusIndicator
            isCompareMode={isCompareMode}
            isDrafted={isDrafted}
            isSelected={isSelected}
            onClick={handleStatusClick}
          />
          
          <PlayerInfo
            name={player.name}
            position={player.position}
            team={player.team}
            adp={player.adp}
            news={player.news}
            isRecommended={isRecommended}
            isDrafted={isDrafted}
            showTrendIndicator={showTrendIndicator}
          />
        </div>
        
        <PlayerStats
          projectedPoints={projectedPoints}
          scoringSystem={scoringSystem}
          injury={player.injury}
          showAdvancedStats={showAdvancedStats}
          player={player}
        />
      </div>
    </div>
  );
}, arePlayerPropsEqual);

OptimizedPlayerCard.displayName = 'OptimizedPlayerCard';

// ============================================================================
// PERFORMANCE MONITORING WRAPPER (DEVELOPMENT ONLY)
// ============================================================================

const PlayerCardWithPerformanceMonitoring: React.FC<PlayerCardProps> = (props) => {
  const renderStart = useRef(0);
  const renderCount = useRef(0);

  if (process.env.NODE_ENV === 'development') {
    renderStart.current = performance.now();
    renderCount.current++;
  }

  const result = <OptimizedPlayerCard {...props} />;

  if (process.env.NODE_ENV === 'development') {
    const renderTime = performance.now() - renderStart.current;
    if (renderTime > 5) { // Log slow renders
      console.warn(`Slow PlayerCard render: ${renderTime.toFixed(2)}ms for ${props.player.name}`);
    }
  }

  return result;
};

export { OptimizedPlayerCard, PlayerCardWithPerformanceMonitoring };
export default process.env.NODE_ENV === 'development' 
  ? PlayerCardWithPerformanceMonitoring 
  : OptimizedPlayerCard;