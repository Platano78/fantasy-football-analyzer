import { memo, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { Player, ScoringSystem } from '@/types';

interface StatsComparisonViewProps {
  players: Player[];
  scoringSystem: ScoringSystem;
}

/**
 * Performance-optimized component for side-by-side player statistical comparison
 * Features:
 * - React.memo wrapper to prevent unnecessary re-renders
 * - useMemo for expensive chart data calculations
 * - Responsive design with proper spacing
 * - PPR/Standard/Half-PPR scoring system support
 * - Recharts integration for visual comparisons
 */
const StatsComparisonView = memo(({ 
  players, 
  scoringSystem 
}: StatsComparisonViewProps) => {
  // Memoize chart data calculation to prevent recalculation on every render
  const chartData = useMemo(() => {
    return players.map(player => ({
      name: player.name.split(' ').slice(-1)[0], // Last name only for chart readability
      fullName: player.name,
      ppr: player.ppr,
      standard: player.standard,
      halfPpr: player.halfPpr,
      adp: player.adp,
      tier: player.tier
    }));
  }, [players]);

  // Memoize scoring system value for scatter chart
  const scoringSystemValue = useMemo(() => {
    return scoringSystem;
  }, [scoringSystem]);

  return (
    <div className="space-y-6">
      {/* Side-by-side stat comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {players.map((player) => (
          <div key={player.id} className="bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900">{player.name}</div>
              <div className="text-sm text-gray-600">
                {player.position} • {player.team}
              </div>
              
              {/* Injury status indicator */}
              {player.injury !== 'Healthy' && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    player.injury === 'Out' || player.injury === 'IR'
                      ? 'bg-red-100 text-red-800'
                      : player.injury === 'Doubtful'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {player.injury}
                  </span>
                </div>
              )}

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

              {/* Player news */}
              {player.news && (
                <div className="mt-3 text-xs text-gray-500 italic">
                  {player.news}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projected Points Comparison Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold mb-4 text-gray-900">
            Projected Points Comparison
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value.toFixed(1), 
                  name.toUpperCase()
                ]}
                labelFormatter={(label: string) => `Player: ${label}`}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="ppr" fill="#3b82f6" name="PPR" radius={[2, 2, 0, 0]} />
              <Bar dataKey="standard" fill="#ef4444" name="Standard" radius={[2, 2, 0, 0]} />
              <Bar dataKey="halfPpr" fill="#10b981" name="Half PPR" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ADP vs Projection Scatter Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold mb-4 text-gray-900">
            ADP vs Projection ({scoringSystem.toUpperCase()})
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="adp" 
                name="ADP"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: 'ADP', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                dataKey={scoringSystemValue} 
                name="Projection"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: 'Projected Points', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: number, name: string) => [
                  name === 'adp' ? value : value.toFixed(1), 
                  name === 'adp' ? 'ADP' : 'Projected Points'
                ]}
                labelFormatter={() => ''}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Scatter 
                dataKey={scoringSystemValue} 
                fill="#8884d8" 
                stroke="#6366f1"
                strokeWidth={2}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
StatsComparisonView.displayName = 'StatsComparisonView';

export default StatsComparisonView;