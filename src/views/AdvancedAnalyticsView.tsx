import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target, 
  Activity, 
  Zap, 
  Trophy, 
  AlertTriangle,
  CheckCircle,
  ArrowUpDown,
  Maximize2,
  RotateCcw,
  Download,
  Settings,
  Eye,
  Brain,
  Layers,
  GitBranch,
  RefreshCw
} from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { Player, Position, Team } from '@/types';

// Advanced analytics interfaces
interface MultiWeekProjection {
  week: number;
  projectedPoints: number;
  confidence: number;
  difficulty: 'easy' | 'medium' | 'hard';
  keyFactors: string[];
  variance: number;
}

interface PlayoffProjection {
  teamId: number;
  teamName: string;
  currentRecord: { wins: number; losses: number; ties: number };
  projectedRecord: { wins: number; losses: number; ties: number };
  playoffProbability: number;
  championshipProbability: number;
  strengthOfSchedule: number;
  trendsAnalysis: {
    direction: 'up' | 'down' | 'stable';
    momentum: number;
    keyMetrics: string[];
  };
}

interface ValueAnalysis {
  player: Player;
  currentValue: number;
  projectedValue: number;
  valueChange: number;
  trend: 'buy' | 'sell' | 'hold';
  reasoning: string[];
  confidence: number;
  timeHorizon: 'short' | 'medium' | 'long';
  riskLevel: 'low' | 'medium' | 'high';
}

interface ScheduleAnalysis {
  week: number;
  teamSchedule: {
    teamId: number;
    teamName: string;
    difficulty: number;
    opponents: string[];
    advantages: string[];
    concerns: string[];
  }[];
  positionalAdvantages: Record<Position, {
    favorableMatchups: number;
    difficultMatchups: number;
    neutralMatchups: number;
  }>;
}

interface TradeOpportunity {
  id: string;
  type: 'win_now' | 'future_value' | 'positional' | 'depth';
  priority: 'high' | 'medium' | 'low';
  teams: [number, number]; // team IDs
  proposal: {
    team1Gives: Player[];
    team1Gets: Player[];
    team2Gives: Player[];
    team2Gets: Player[];
  };
  analysis: {
    team1ValueChange: number;
    team2ValueChange: number;
    fairnessScore: number;
    winProbabilityImpact: number;
  };
  reasoning: string;
  timeline: string;
}

// Memoized projection chart component
const ProjectionChart = memo(({ 
  projections, 
  title 
}: {
  projections: MultiWeekProjection[];
  title: string;
}) => {
  const maxPoints = Math.max(...projections.map(p => p.projectedPoints));
  const minPoints = Math.min(...projections.map(p => p.projectedPoints));
  const range = maxPoints - minPoints;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        {title}
      </h3>
      
      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grid lines */}
          {Array.from({ length: 5 }, (_, i) => (
            <line
              key={`grid-${i}`}
              x1="40"
              y1={30 + (i * 30)}
              x2="380"
              y2={30 + (i * 30)}
              stroke="#e5e5e5"
              strokeWidth="1"
            />
          ))}
          
          {/* Y-axis labels */}
          {Array.from({ length: 5 }, (_, i) => {
            const value = maxPoints - (i * range / 4);
            return (
              <text
                key={`y-label-${i}`}
                x="35"
                y={35 + (i * 30)}
                fontSize="10"
                fill="#6b7280"
                textAnchor="end"
              >
                {value.toFixed(1)}
              </text>
            );
          })}
          
          {/* Projection line and points */}
          <polyline
            points={projections.map((p, i) => 
              `${50 + (i * 45)},${170 - ((p.projectedPoints - minPoints) / range) * 140}`
            ).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {projections.map((projection, index) => {
            const x = 50 + (index * 45);
            const y = 170 - ((projection.projectedPoints - minPoints) / range) * 140;
            const difficultyColor = projection.difficulty === 'hard' ? '#ef4444' : 
                                   projection.difficulty === 'medium' ? '#f59e0b' : '#10b981';
            
            return (
              <g key={projection.week}>
                {/* Confidence interval */}
                <line
                  x1={x}
                  y1={y - (projection.variance * 10)}
                  x2={x}
                  y2={y + (projection.variance * 10)}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  opacity="0.5"
                />
                
                {/* Data point */}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={difficultyColor}
                  stroke="white"
                  strokeWidth="2"
                />
                
                {/* Week label */}
                <text
                  x={x}
                  y="185"
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  W{projection.week}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Easy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Hard</span>
        </div>
      </div>
    </div>
  );
});

ProjectionChart.displayName = 'ProjectionChart';

// Playoff probabilities component
const PlayoffProjections = memo(({ 
  projections 
}: {
  projections: PlayoffProjection[];
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5" />
        Playoff & Championship Probabilities
      </h3>
      
      <div className="space-y-4">
        {projections.slice(0, 8).map(team => (
          <div key={team.teamId} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">{team.teamName}</h4>
                <p className="text-sm text-gray-600">
                  {team.currentRecord.wins}-{team.currentRecord.losses}
                  {team.currentRecord.ties > 0 && `-${team.currentRecord.ties}`}
                  <span className="mx-2">→</span>
                  Proj: {team.projectedRecord.wins}-{team.projectedRecord.losses}
                  {team.projectedRecord.ties > 0 && `-${team.projectedRecord.ties}`}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold">{(team.playoffProbability * 100).toFixed(1)}%</div>
                <div className="text-xs text-gray-600">Playoffs</div>
              </div>
            </div>
            
            {/* Probability bars */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm w-20">Playoffs:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${team.playoffProbability * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12">{(team.playoffProbability * 100).toFixed(0)}%</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm w-20">Champion:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${team.championshipProbability * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12">{(team.championshipProbability * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            {/* Trend indicator */}
            <div className="flex items-center gap-2 mt-3 text-sm">
              {team.trendsAnalysis.direction === 'up' && (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
              {team.trendsAnalysis.direction === 'down' && (
                <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
              )}
              {team.trendsAnalysis.direction === 'stable' && (
                <Activity className="w-4 h-4 text-gray-500" />
              )}
              <span className="capitalize text-gray-600">
                {team.trendsAnalysis.direction} trend
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

PlayoffProjections.displayName = 'PlayoffProjections';

// Value analysis component
const ValueAnalysis = memo(({ 
  analysis 
}: {
  analysis: ValueAnalysis[];
}) => {
  const sortedByValue = useMemo(() => 
    [...analysis].sort((a, b) => b.valueChange - a.valueChange),
    [analysis]
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Target className="w-5 h-5" />
        Player Value Analysis
      </h3>
      
      <div className="space-y-3">
        {sortedByValue.slice(0, 10).map(player => (
          <div key={player.player.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{player.player.name}</span>
                <span className="text-sm text-gray-600">({player.player.position})</span>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  player.trend === 'buy' ? 'bg-green-100 text-green-800' :
                  player.trend === 'sell' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {player.trend.toUpperCase()}
                </span>
              </div>
              
              <div className="text-right">
                <div className={`font-bold ${
                  player.valueChange > 0 ? 'text-green-600' : 
                  player.valueChange < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {player.valueChange > 0 ? '+' : ''}{player.valueChange.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">Value Change</div>
              </div>
            </div>
            
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Current Value:</span>
                <span className="font-medium">{player.currentValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Projected Value:</span>
                <span className="font-medium">{player.projectedValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="font-medium">{(player.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-1 rounded ${
                  player.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                  player.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {player.riskLevel.toUpperCase()} RISK
                </span>
                <span className="capitalize">{player.timeHorizon} term</span>
              </div>
              <ul className="space-y-1">
                {player.reasoning.slice(0, 2).map((reason, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ValueAnalysis.displayName = 'ValueAnalysis';

// Trade optimizer component  
const TradeOptimizer = memo(({ 
  opportunities,
  onAnalyzeTrade 
}: {
  opportunities: TradeOpportunity[];
  onAnalyzeTrade: (tradeId: string) => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ArrowUpDown className="w-5 h-5" />
        Optimized Trade Opportunities
      </h3>
      
      <div className="space-y-4">
        {opportunities.map(trade => (
          <div key={trade.id} className={`border rounded-lg p-4 ${
            trade.priority === 'high' ? 'border-red-300 bg-red-50' :
            trade.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
            'border-blue-300 bg-blue-50'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold capitalize">{trade.type.replace('_', ' ')} Trade</span>
                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                    trade.priority === 'high' ? 'bg-red-100 text-red-800' :
                    trade.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {trade.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{trade.reasoning}</p>
                <p className="text-xs text-gray-500">Timeline: {trade.timeline}</p>
              </div>
              
              <div className="text-right">
                <div className="font-bold text-lg">{trade.analysis.fairnessScore.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Fairness Score</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border rounded p-3">
                <h5 className="font-medium mb-2">Team 1 Gives:</h5>
                <div className="space-y-1 text-sm">
                  {trade.proposal.team1Gives.map(player => (
                    <div key={player.id}>{player.name} ({player.position})</div>
                  ))}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Value Change: {trade.analysis.team1ValueChange > 0 ? '+' : ''}{trade.analysis.team1ValueChange.toFixed(2)}
                </div>
              </div>
              
              <div className="border rounded p-3">
                <h5 className="font-medium mb-2">Team 1 Gets:</h5>
                <div className="space-y-1 text-sm">
                  {trade.proposal.team1Gets.map(player => (
                    <div key={player.id}>{player.name} ({player.position})</div>
                  ))}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Win Probability: {trade.analysis.winProbabilityImpact > 0 ? '+' : ''}{(trade.analysis.winProbabilityImpact * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onAnalyzeTrade(trade.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Analyze Trade
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

TradeOptimizer.displayName = 'TradeOptimizer';

// Main AdvancedAnalyticsView component
export default function AdvancedAnalyticsView() {
  const { state } = useFantasyFootball();
  const [activeTab, setActiveTab] = useState<'projections' | 'playoffs' | 'value' | 'trades'>('projections');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data generation (in production, this would come from AI analysis)
  const analytics = useMemo(() => {
    const projections: MultiWeekProjection[] = Array.from({ length: 8 }, (_, i) => ({
      week: i + 9,
      projectedPoints: 85 + Math.random() * 30,
      confidence: 0.7 + Math.random() * 0.3,
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
      keyFactors: ['Strong matchup', 'Home field advantage', 'Key player return'],
      variance: 5 + Math.random() * 10
    }));

    const playoffProjections: PlayoffProjection[] = Array.from({ length: 12 }, (_, i) => ({
      teamId: i + 1,
      teamName: `Team ${String.fromCharCode(65 + i)}`,
      currentRecord: { wins: 4 + Math.floor(Math.random() * 5), losses: 3 + Math.floor(Math.random() * 5), ties: 0 },
      projectedRecord: { wins: 6 + Math.floor(Math.random() * 7), losses: 6 + Math.floor(Math.random() * 7), ties: 0 },
      playoffProbability: Math.random(),
      championshipProbability: Math.random() * 0.3,
      strengthOfSchedule: 0.4 + Math.random() * 0.4,
      trendsAnalysis: {
        direction: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        momentum: Math.random(),
        keyMetrics: ['Scoring trending up', 'Strong waiver moves', 'Favorable schedule']
      }
    }));

    const valueAnalysis: ValueAnalysis[] = state.players.slice(0, 20).map(player => ({
      player,
      currentValue: 50 + Math.random() * 50,
      projectedValue: 50 + Math.random() * 50,
      valueChange: -10 + Math.random() * 20,
      trend: ['buy', 'sell', 'hold'][Math.floor(Math.random() * 3)] as 'buy' | 'sell' | 'hold',
      reasoning: [
        'Favorable upcoming schedule',
        'Target share increasing',
        'Injury concerns for competition',
        'Strong recent performances'
      ].slice(0, 2 + Math.floor(Math.random() * 2)),
      confidence: 0.6 + Math.random() * 0.4,
      timeHorizon: ['short', 'medium', 'long'][Math.floor(Math.random() * 3)] as 'short' | 'medium' | 'long',
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
    }));

    const tradeOpportunities: TradeOpportunity[] = [
      {
        id: '1',
        type: 'win_now',
        priority: 'high',
        teams: [1, 2],
        proposal: {
          team1Gives: [state.players[0]],
          team1Gets: [state.players[1]],
          team2Gives: [state.players[1]],
          team2Gets: [state.players[0]]
        },
        analysis: {
          team1ValueChange: 2.5,
          team2ValueChange: -1.8,
          fairnessScore: 0.92,
          winProbabilityImpact: 0.08
        },
        reasoning: 'Upgrade at WR1 position for playoff push',
        timeline: 'Execute before Week 10'
      }
    ];

    return {
      projections,
      playoffProjections,
      valueAnalysis,
      tradeOpportunities
    };
  }, [state.players]);

  // Tab configuration
  const tabs = [
    { id: 'projections', name: 'Multi-Week', icon: Calendar },
    { id: 'playoffs', name: 'Playoffs', icon: Trophy },
    { id: 'value', name: 'Value Trends', icon: TrendingUp },
    { id: 'trades', name: 'Trade Optimizer', icon: ArrowUpDown }
  ];

  // Event handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate analytics refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleAnalyzeTrade = useCallback((tradeId: string) => {
    console.log('Analyzing trade:', tradeId);
  }, []);

  const handleExportAnalytics = useCallback(() => {
    console.log('Exporting analytics...');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Advanced Analytics Engine
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>
            <button
              onClick={handleExportAnalytics}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-xs text-gray-600">Teams Analyzed</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">24</div>
            <div className="text-xs text-gray-600">Trade Opportunities</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">156</div>
            <div className="text-xs text-gray-600">Value Insights</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">8</div>
            <div className="text-xs text-gray-600">Weeks Projected</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'projections' && (
          <ProjectionChart projections={analytics.projections} title="Multi-Week Projections" />
        )}

        {activeTab === 'playoffs' && (
          <PlayoffProjections projections={analytics.playoffProjections} />
        )}

        {activeTab === 'value' && (
          <ValueAnalysis analysis={analytics.valueAnalysis} />
        )}

        {activeTab === 'trades' && (
          <TradeOptimizer
            opportunities={analytics.tradeOpportunities}
            onAnalyzeTrade={handleAnalyzeTrade}
          />
        )}
      </div>

      {/* AI Integration Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Brain className="w-6 h-6 text-purple-600 mt-1" />
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">AI-Powered Analytics</h4>
            <p className="text-sm text-purple-800 mb-3">
              Advanced machine learning models analyze player performance, matchup data, injury reports, 
              and market trends to provide predictive insights and optimization recommendations.
            </p>
            <div className="text-xs text-purple-700">
              <span>Models: Linear Regression, Random Forest, Neural Networks</span>
              <span className="mx-2">•</span>
              <span>Confidence: 87% average</span>
              <span className="mx-2">•</span>
              <span>Updated: Every 30 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}