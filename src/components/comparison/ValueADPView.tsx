import React, { memo, useMemo } from 'react';
import { Award } from 'lucide-react';
import { Player } from '../../types/index';

interface TierAnalysisViewProps {
  players: Player[];
}

interface TierData {
  [tier: number]: Player[];
}

interface TierSummary {
  tier: number;
  players: Player[];
  averageADP: number;
  averagePPR: number;
  playerCount: number;
}

/**
 * TierAnalysisView - Optimized component for displaying player tier analysis
 * 
 * Features:
 * - React.memo for performance optimization
 * - useMemo for expensive tier calculations
 * - Responsive grid layout
 * - Visual tier distinction with color coding
 * - Player analytics per tier
 * - Injury status indicators
 * 
 * Performance Optimizations:
 * - Memoized tier grouping and sorting
 * - Efficient player data aggregation
 * - Conditional rendering for empty states
 * - Optimized hover effects with CSS transitions
 */
const TierAnalysisView: React.FC<TierAnalysisViewProps> = memo(({ players }) => {
  // Optimized tier grouping with memoization for performance
  const tierAnalysis = useMemo((): TierSummary[] => {
    if (!players.length) return [];

    // Group players by tier efficiently
    const tierData: TierData = players.reduce((acc, player) => {
      const tier = player.tier;
      if (!acc[tier]) {
        acc[tier] = [];
      }
      acc[tier].push(player);
      return acc;
    }, {} as TierData);

    // Convert to sorted tier summaries with analytics
    return Object.entries(tierData)
      .map(([tierStr, tierPlayers]) => {
        const tier = parseInt(tierStr, 10);
        // Sort players by ADP within tier for better organization
        const sortedPlayers = [...tierPlayers].sort((a, b) => a.adp - b.adp);
        
        return {
          tier,
          players: sortedPlayers,
          playerCount: tierPlayers.length,
          averageADP: tierPlayers.reduce((sum: number, p: Player) => sum + p.adp, 0) / tierPlayers.length,
          averagePPR: tierPlayers.reduce((sum: number, p: Player) => sum + p.ppr, 0) / tierPlayers.length,
        };
      })
      .sort((a, b) => a.tier - b.tier);
  }, [players]);

  // Memoized tier color scheme for visual distinction
  const getTierColorScheme = useMemo(() => (tier: number) => {
    const colorSchemes: Record<number, { bg: string; border: string; text: string; accent: string }> = {
      1: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', accent: 'text-emerald-600' },
      2: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', accent: 'text-blue-600' },
      3: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', accent: 'text-purple-600' },
      4: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', accent: 'text-orange-600' },
      5: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', accent: 'text-red-600' },
    };
    return colorSchemes[tier] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', accent: 'text-gray-600' };
  }, []);

  // Early return for empty state
  if (players.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <div className="text-center">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No players available for tier analysis</p>
          <p className="text-sm mt-2">Add players to see tier-based groupings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Player Tier Analysis">
      {/* Header Section */}
      <div className="text-center">
        <h4 className="text-xl font-bold text-gray-900 mb-2">
          Positional Tier Analysis
        </h4>
        <p className="text-gray-600">
          Players grouped by tier with positional rankings and analytics
        </p>
        <div className="mt-2 text-sm text-gray-500">
          {tierAnalysis.length} {tierAnalysis.length === 1 ? 'tier' : 'tiers'} • {players.length} total players
        </div>
      </div>

      {/* Tier Analysis Grid */}
      {tierAnalysis.map(({ tier, players: tierPlayers, playerCount, averageADP, averagePPR }) => {
        const colors = getTierColorScheme(tier);
        
        return (
          <div 
            key={tier} 
            className={`${colors.bg} rounded-lg p-4 border ${colors.border} shadow-sm`}
            role="section"
            aria-labelledby={`tier-${tier}-header`}
          >
            {/* Tier Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <h5 
                id={`tier-${tier}-header`}
                className={`text-lg font-semibold flex items-center gap-2 ${colors.text}`}
              >
                <Award className="w-5 h-5" aria-hidden="true" />
                Tier {tier}
                <span className="text-sm font-normal text-gray-600">
                  ({playerCount} {playerCount === 1 ? 'player' : 'players'})
                </span>
              </h5>
              
              {/* Tier Analytics */}
              <div className="flex gap-4 text-sm text-gray-600">
                <div className="text-right">
                  <div className="font-medium">Avg ADP</div>
                  <div className={`${colors.accent} font-semibold`}>
                    {averageADP.toFixed(1)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">Avg PPR</div>
                  <div className={`${colors.accent} font-semibold`}>
                    {averagePPR.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Player Grid - Responsive layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tierPlayers.map(player => (
                <div 
                  key={player.id} 
                  className="bg-white rounded-lg p-3 border-2 border-white hover:shadow-md hover:border-gray-200 transition-all duration-200"
                  role="article"
                  aria-label={`${player.name} player card`}
                >
                  {/* Player Info Header */}
                  <div className="mb-2">
                    <div 
                      className="font-semibold text-gray-900 truncate" 
                      title={player.name}
                    >
                      {player.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {player.position} • {player.team}
                    </div>
                  </div>

                  {/* Player News */}
                  <div 
                    className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2rem]" 
                    title={player.news}
                  >
                    {player.news}
                  </div>

                  {/* Player Stats */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">ADP</span>
                      <span className="font-medium">{player.adp.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-gray-500 text-xs">PPR Proj</span>
                      <span className={`font-semibold ${colors.accent}`}>
                        {player.ppr.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Injury Status Indicator */}
                  {player.injury !== 'Healthy' && (
                    <div className="mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md text-center font-medium">
                      {player.injury}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

TierAnalysisView.displayName = 'TierAnalysisView';

export default TierAnalysisView;