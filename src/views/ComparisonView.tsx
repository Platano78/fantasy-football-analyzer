import { memo, useMemo, useCallback, useState } from 'react';
import { ArrowLeftRight, Download, BarChart2, Award, TrendingUp, Target, Users, X, Star } from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { usePlayerComparison, usePlayerFiltering, useVirtualization } from '@/hooks';
import { Player, Position, ScoringSystem } from '@/types';
import { PlayerComparisonModal } from '@/components';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line
} from 'recharts';

// Performance-optimized sub-components with React.memo

// Memoized PlayerSelectionCard for comparison mode
const PlayerSelectionCard = memo(({
  player,
  isSelected,
  onToggle,
  scoringSystem,
  maxSelections
}: {
  player: Player;
  isSelected: boolean;
  onToggle: (playerId: number) => void;
  scoringSystem: ScoringSystem;
  maxSelections: boolean;
}) => {
  const handleToggle = useCallback(() => {
    if (!isSelected && maxSelections) return;
    onToggle(player.id);
  }, [player.id, onToggle, isSelected, maxSelections]);

  return (
    <div
      className={`p-3 cursor-pointer transition-all duration-200 rounded-lg border-2 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      } ${maxSelections && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <div className="font-semibold text-gray-900">{player.name}</div>
            <div className="text-sm text-gray-600">
              {player.position} • {player.team} • Tier {player.tier}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-blue-600">
            {player[scoringSystem].toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">proj. pts</div>
        </div>
      </div>
    </div>
  );
});

PlayerSelectionCard.displayName = 'PlayerSelectionCard';

// Memoized Stats Comparison Component
const StatsComparisonView = memo(({
  players,
  scoringSystem
}: {
  players: Player[];
  scoringSystem: ScoringSystem;
}) => {
  const chartData = useMemo(() => {
    return players.map(player => ({
      name: player.name.split(' ').pop(), // Use last name for charts
      fullName: player.name,
      ppr: player.ppr,
      standard: player.standard,
      halfPpr: player.halfPpr,
      adp: player.adp,
      tier: player.tier
    }));
  }, [players]);

  if (players.length < 2) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Select at least 2 players to compare</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Side-by-side stat comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {players.map(player => (
          <div key={player.id} className="bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900">{player.name}</div>
              <div className="text-sm text-gray-600">{player.position} • {player.team}</div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ADP:</span>
                  <span className="text-sm font-semibold">{player.adp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">PPR:</span>
                  <span className="text-sm font-semibold">{player.ppr.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Standard:</span>
                  <span className="text-sm font-semibold">{player.standard.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Half PPR:</span>
                  <span className="text-sm font-semibold">{player.halfPpr.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tier:</span>
                  <span className="text-sm font-semibold">{player.tier}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold mb-4">Projected Points Comparison</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                typeof value === 'number' ? value.toFixed(1) : value,
                typeof name === 'string' ? name.toUpperCase() : name
              ]} />
              <Bar dataKey="ppr" fill="#3b82f6" name="PPR" />
              <Bar dataKey="standard" fill="#ef4444" name="Standard" />
              <Bar dataKey="halfPpr" fill="#10b981" name="Half PPR" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold mb-4">ADP vs Projection</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="adp" 
                name="ADP" 
                label={{ value: 'ADP (Draft Position)', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                dataKey={scoringSystem} 
                name={scoringSystem.toUpperCase()} 
                label={{ value: 'Projected Points', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip 
                formatter={(value, name, _props) => {
                  if (name === 'adp') return [value, 'ADP'];
                  return [
                    typeof value === 'number' ? value.toFixed(1) : value,
                    scoringSystem.toUpperCase()
                  ];
                }}
                labelFormatter={(label) => `${chartData.find(d => d.adp === label)?.fullName || ''}`}
              />
              <Scatter dataKey={scoringSystem} fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

StatsComparisonView.displayName = 'StatsComparisonView';

// Memoized Tier Analysis Component
const TierAnalysisView = memo(({ players }: { players: Player[] }) => {
  const tierData = useMemo(() => {
    const tierGroups = players.reduce((acc, player) => {
      if (!acc[player.tier]) {
        acc[player.tier] = [];
      }
      acc[player.tier].push(player);
      return acc;
    }, {} as Record<number, Player[]>);

    return Object.entries(tierGroups)
      .map(([tier, tierPlayers]) => ({
        tier: parseInt(tier),
        players: tierPlayers,
        averageADP: tierPlayers.reduce((sum, p) => sum + p.adp, 0) / tierPlayers.length,
        averagePPR: tierPlayers.reduce((sum, p) => sum + p.ppr, 0) / tierPlayers.length,
      }))
      .sort((a, b) => a.tier - b.tier);
  }, [players]);

  if (players.length < 2) {
    return (
      <div className="text-center py-12">
        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Select players to analyze tier distribution</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tierData.map(({ tier, players: tierPlayers, averageADP, averagePPR }) => (
          <div key={tier} className="bg-gray-50 rounded-lg p-4">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-blue-600">Tier {tier}</div>
              <div className="text-sm text-gray-600">{tierPlayers.length} players</div>
              <div className="text-xs text-gray-500 mt-1">
                Avg ADP: {averageADP.toFixed(1)} • Avg PPR: {averagePPR.toFixed(1)}
              </div>
            </div>
            <div className="space-y-2">
              {tierPlayers.map(player => (
                <div key={player.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <div>
                    <div className="font-medium text-sm">{player.name}</div>
                    <div className="text-xs text-gray-500">{player.position} • {player.team}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{player.ppr.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">PPR</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

TierAnalysisView.displayName = 'TierAnalysisView';

// Memoized Value vs ADP Analysis Component
const ValueADPView = memo(({
  players,
  scoringSystem
}: {
  players: Player[];
  scoringSystem: ScoringSystem;
}) => {
  const valueData = useMemo(() => {
    return players.map(player => ({
      name: player.name,
      adp: player.adp,
      projection: player[scoringSystem],
      value: player[scoringSystem] - (50 - player.adp), // Simple value calculation
      tier: player.tier
    })).sort((a, b) => b.value - a.value);
  }, [players, scoringSystem]);

  if (players.length < 2) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Select players to analyze value vs ADP</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold mb-4">Value Chart</h4>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={valueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="adp" label={{ value: 'ADP', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Projected Points', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value, name) => [
                name === 'adp' ? value : (typeof value === 'number' ? value.toFixed(1) : value), 
                name === 'adp' ? 'ADP' : 'Projected Points'
              ]}
              labelFormatter={(label) => `ADP: ${label}`}
            />
            <Line dataKey="projection" stroke="#8884d8" strokeWidth={3} dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {valueData.map(player => (
          <div key={player.name} className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-lg">{player.name}</div>
                <div className="text-sm text-gray-600">Tier {player.tier}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                player.value > 2 ? 'bg-green-100 text-green-800' :
                player.value > 0 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {player.value > 0 ? '+' : ''}{player.value.toFixed(1)} value
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">ADP:</span>
                <span className="ml-2 font-semibold">{player.adp}</span>
              </div>
              <div>
                <span className="text-gray-600">Projection:</span>
                <span className="ml-2 font-semibold">{player.projection.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ValueADPView.displayName = 'ValueADPView';

// Memoized Head-to-Head Recommendations Component
const RecommendationView = memo(({
  players,
  scoringSystem
}: {
  players: Player[];
  scoringSystem: ScoringSystem;
}) => {
  const recommendations = useMemo(() => {
    if (players.length < 2) return [];

    const getRecommendation = (player1: Player, player2: Player) => {
      const diff = player1[scoringSystem] - player2[scoringSystem];
      const winner = diff > 0 ? player1 : player2;
      const absDiff = Math.abs(diff);
      
      return {
        winner,
        loser: winner === player1 ? player2 : player1,
        difference: absDiff,
        reason: `${absDiff.toFixed(1)} point advantage in ${scoringSystem.toUpperCase()} scoring`,
        confidence: absDiff > 3 ? "High" : absDiff > 1.5 ? "Medium" : "Low"
      };
    };

    const comparisons = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        comparisons.push({
          player1: players[i],
          player2: players[j],
          recommendation: getRecommendation(players[i], players[j])
        });
      }
    }
    return comparisons;
  }, [players, scoringSystem]);

  if (players.length < 2) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Select at least 2 players for head-to-head analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-xl font-bold text-gray-900 mb-2">Head-to-Head Recommendations</h4>
        <p className="text-gray-600">AI-powered draft recommendations based on your scoring system</p>
      </div>

      <div className="space-y-4">
        {recommendations.map((comp, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-semibold">{comp.player1.name}</div>
                  <div className="text-sm text-gray-600">{comp.player1.position}</div>
                </div>
                <ArrowLeftRight className="w-5 h-5 text-gray-400" />
                <div className="text-center">
                  <div className="font-semibold">{comp.player2.name}</div>
                  <div className="text-sm text-gray-600">{comp.player2.position}</div>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold ${
                comp.recommendation.confidence === 'High' ? 'bg-green-100 text-green-800' :
                comp.recommendation.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                <Star className="w-4 h-4" />
                {comp.recommendation.confidence} Confidence
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {comp.recommendation.winner.name}
                  </div>
                  <div className="text-sm text-gray-600">{comp.recommendation.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    +{comp.recommendation.difference.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">points advantage</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

RecommendationView.displayName = 'RecommendationView';

// Main ComparisonView component
const ComparisonView = memo(() => {
  const { state } = useFantasyFootball();
  const { 
    filteredPlayers, 
    searchTerm, 
    setSearchTerm, 
    positionFilter, 
    setPositionFilter 
  } = usePlayerFiltering();
  
  const {
    selectedPlayers,
    selectedPlayersList,
    togglePlayer,
    clearSelection,
    exportComparison,
    canCompare,
    maxSelections
  } = usePlayerComparison();

  const [localComparisonView, setLocalComparisonView] = useState('stats');
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Use virtualization for large player lists
  const { 
    visibleItems: visiblePlayers,
    totalHeight,
    containerProps,
    getItemProps
  } = useVirtualization<Player>(filteredPlayers, {
    itemHeight: 80,
    containerHeight: 600,
    overscan: 5
  });

  const handleExport = useCallback(() => {
    exportComparison();
  }, [exportComparison]);

  const handleOpenModal = useCallback(() => {
    if (canCompare) {
      setShowComparisonModal(true);
    }
  }, [canCompare]);

  const handleCloseModal = useCallback(() => {
    setShowComparisonModal(false);
  }, []);

  const selectedPlayersArray = useMemo(() => {
    return selectedPlayersList;
  }, [selectedPlayersList]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Player Comparison Tool
          </h3>
          <div className="flex gap-2">
            {selectedPlayers.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Selection ({selectedPlayers.size})
              </button>
            )}
            {canCompare && (
              <>
                <button
                  onClick={handleOpenModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Compare Players
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value as Position | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Positions</option>
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
            <option value="DEF">DEF</option>
            <option value="K">K</option>
          </select>
        </div>

        {/* Selected Players Summary */}
        {selectedPlayers.size > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900">
                  Selected Players ({selectedPlayers.size}/6)
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPlayersArray.map(player => (
                    <span
                      key={player.id}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {player.name}
                      <button
                        onClick={() => togglePlayer(player.id)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Selection Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold mb-4">Select Players to Compare</h4>
          <div 
            className="overflow-auto max-h-96"
            {...containerProps}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              {visiblePlayers.map((player, index) => (
                <div key={player.id} {...getItemProps(index)}>
                  <PlayerSelectionCard
                    player={player}
                    isSelected={selectedPlayers.has(player.id)}
                    onToggle={togglePlayer}
                    scoringSystem={state.scoringSystem}
                    maxSelections={maxSelections}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Analysis Panel */}
        <div className="lg:col-span-2">
          {selectedPlayers.size >= 2 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Comparison Tabs */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'stats', name: 'Stats Comparison', icon: BarChart2 },
                    { id: 'tiers', name: 'Tier Analysis', icon: Award },
                    { id: 'value', name: 'Value vs ADP', icon: TrendingUp },
                    { id: 'recommendations', name: 'Head-to-Head', icon: Target }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setLocalComparisonView(tab.id)}
                        className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                          localComparisonView === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Comparison Content */}
              {localComparisonView === 'stats' && (
                <StatsComparisonView 
                  players={selectedPlayersArray} 
                  scoringSystem={state.scoringSystem} 
                />
              )}
              {localComparisonView === 'tiers' && (
                <TierAnalysisView players={selectedPlayersArray} />
              )}
              {localComparisonView === 'value' && (
                <ValueADPView 
                  players={selectedPlayersArray} 
                  scoringSystem={state.scoringSystem} 
                />
              )}
              {localComparisonView === 'recommendations' && (
                <RecommendationView 
                  players={selectedPlayersArray} 
                  scoringSystem={state.scoringSystem} 
                />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start Comparing Players
              </h3>
              <p className="text-gray-600 mb-6">
                Select 2 or more players from the left panel to begin your analysis
              </p>
              <div className="text-sm text-gray-500">
                Compare up to 6 players at once with detailed statistics, tier analysis, and AI-powered recommendations
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      <PlayerComparisonModal
        isOpen={showComparisonModal}
        players={selectedPlayersArray}
        scoringSystem={state.scoringSystem}
        onClose={handleCloseModal}
        onExport={handleExport}
      />
    </div>
  );
});

ComparisonView.displayName = 'ComparisonView';

export default ComparisonView;