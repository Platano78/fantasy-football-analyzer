import React, { memo, useMemo, useCallback, useState } from 'react';
import { 
  X, 
  User, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Activity, 
  BarChart3, 
  Calendar, 
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  ArrowUpDown,
  Edit3,
  Save,
  RefreshCw
} from 'lucide-react';
import { Player, Position, Team, ScoringSystem } from '@/types';

// Enhanced team analytics interfaces
interface TeamAnalytics {
  overallScore: number;
  strengthsByPosition: Record<Position, {
    score: number;
    rank: number;
    players: Player[];
    depth: 'excellent' | 'good' | 'average' | 'weak' | 'critical';
  }>;
  weeklyProjections: {
    week: number;
    projectedPoints: number;
    difficulty: 'easy' | 'medium' | 'hard';
    confidence: number;
  }[];
  upcomingMatchups: {
    week: number;
    opponent: Team;
    difficulty: number;
    keyMatchups: string[];
    projectedMargin: number;
  }[];
  tradeOpportunities: TradeRecommendation[];
  waiver: WaiverRecommendation[];
  injuries: InjuryAnalysis[];
  byeWeekImpact: ByeWeekAnalysis[];
}

interface TradeRecommendation {
  id: string;
  type: 'upgrade' | 'depth' | 'positional' | 'value';
  priority: 'high' | 'medium' | 'low';
  targetPlayer: Player;
  offerPlayers: Player[];
  expectedValue: number;
  reasoning: string;
  fairTradeValue: number;
  partnerTeam?: Team;
}

interface WaiverRecommendation {
  player: Player;
  priority: number;
  reasoning: string;
  dropCandidate?: Player;
  percentOwned: number;
  projectedImpact: 'high' | 'medium' | 'low';
}

interface InjuryAnalysis {
  player: Player;
  severity: 'minor' | 'moderate' | 'major';
  expectedReturn: string;
  impact: string;
  replacement: Player;
}

interface ByeWeekAnalysis {
  week: number;
  affectedPlayers: Player[];
  severity: 'manageable' | 'challenging' | 'critical';
  recommendations: string[];
}

// Team roster organization
interface OrganizedRoster {
  starters: Record<Position, Player | null>;
  bench: Player[];
  ir: Player[];
  taxi: Player[];
}

interface TeamDetailModalProps {
  isOpen: boolean;
  team: Team | null;
  players: Player[];
  scoringSystem: ScoringSystem;
  onClose: () => void;
  onPlayerAction?: (action: 'trade' | 'drop' | 'start' | 'bench', player: Player) => void;
  onTeamUpdate?: (updatedTeam: Team) => void;
}

// Memoized position strength indicator
const PositionStrengthIndicator = memo(({ 
  position, 
  strength 
}: {
  position: Position;
  strength: TeamAnalytics['strengthsByPosition'][Position];
}) => {
  const getStrengthColor = (depth: string) => {
    switch (depth) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'average': return 'text-yellow-600 bg-yellow-50';
      case 'weak': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStrengthIcon = (depth: string) => {
    switch (depth) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'average': return <Activity className="w-4 h-4" />;
      case 'weak': return <TrendingDown className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStrengthColor(strength.depth)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">{position}</span>
          {getStrengthIcon(strength.depth)}
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">{strength.score.toFixed(1)}</div>
          <div className="text-xs opacity-75">Rank #{strength.rank}</div>
        </div>
      </div>
      
      <div className="space-y-2">
        {strength.players.slice(0, 3).map(player => (
          <div key={player.id} className="flex items-center justify-between text-sm">
            <span className="font-medium">{player.name}</span>
            <span className="opacity-75">{player.projectedPoints.toFixed(1)} pts</span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t border-current opacity-50">
        <span className="text-xs font-medium capitalize">{strength.depth} Depth</span>
      </div>
    </div>
  );
});

PositionStrengthIndicator.displayName = 'PositionStrengthIndicator';

// Memoized upcoming matchups component
const UpcomingMatchups = memo(({ 
  matchups 
}: {
  matchups: TeamAnalytics['upcomingMatchups'];
}) => {
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 8) return 'text-red-600 bg-red-50';
    if (difficulty >= 6) return 'text-orange-600 bg-orange-50';
    if (difficulty >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-3">
      {matchups.slice(0, 6).map(matchup => (
        <div key={matchup.week} className={`p-3 rounded-lg border ${getDifficultyColor(matchup.difficulty)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Week {matchup.week}</span>
              <span className="text-sm opacity-75">vs {matchup.opponent.name}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {matchup.projectedMargin > 0 ? '+' : ''}{matchup.projectedMargin.toFixed(1)}
              </div>
              <div className="text-xs opacity-75">Projected Margin</div>
            </div>
          </div>
          
          {matchup.keyMatchups.length > 0 && (
            <div className="text-xs space-y-1">
              <div className="font-medium">Key Matchups:</div>
              {matchup.keyMatchups.map((key, index) => (
                <div key={index} className="opacity-75">• {key}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

UpcomingMatchups.displayName = 'UpcomingMatchups';

// Trade recommendations component
const TradeRecommendations = memo(({ 
  trades,
  onTradeAction 
}: {
  trades: TradeRecommendation[];
  onTradeAction: (tradeId: string, action: 'propose' | 'analyze') => void;
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {trades.map(trade => (
        <div key={trade.id} className={`p-4 rounded-lg border ${getPriorityColor(trade.priority)}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{trade.type.charAt(0).toUpperCase() + trade.type.slice(1)} Trade</span>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(trade.priority)}`}>
                  {trade.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-sm mb-2">Target: <span className="font-medium">{trade.targetPlayer.name}</span></p>
              <p className="text-xs opacity-75">{trade.reasoning}</p>
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg">{trade.expectedValue.toFixed(2)}</div>
              <div className="text-xs opacity-75">Expected Value</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">Offer:</span>
            <div className="flex flex-wrap gap-1">
              {trade.offerPlayers.map(player => (
                <span key={player.id} className="px-2 py-1 bg-white rounded text-xs border">
                  {player.name}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="opacity-75">Fair Trade Value: </span>
              <span className="font-medium">{trade.fairTradeValue.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onTradeAction(trade.id, 'analyze')}
                className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 transition-colors"
              >
                Analyze
              </button>
              <button
                onClick={() => onTradeAction(trade.id, 'propose')}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Propose
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

TradeRecommendations.displayName = 'TradeRecommendations';

// Main TeamDetailModal component
export default function TeamDetailModal({
  isOpen,
  team,
  players,
  scoringSystem,
  onClose,
  onPlayerAction,
  onTeamUpdate
}: TeamDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'analytics' | 'matchups' | 'trades' | 'waiver'>('roster');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTeam, setEditedTeam] = useState<Team | null>(null);

  // Generate mock team analytics (in production, this would come from AI analysis)
  const teamAnalytics: TeamAnalytics = useMemo(() => {
    if (!team) return {} as TeamAnalytics;

    return {
      overallScore: 8.2,
      strengthsByPosition: {
        QB: { score: 8.5, rank: 3, players: [], depth: 'good' },
        RB: { score: 9.2, rank: 1, players: [], depth: 'excellent' },
        WR: { score: 7.8, rank: 6, players: [], depth: 'average' },
        TE: { score: 6.5, rank: 9, players: [], depth: 'weak' },
        DEF: { score: 7.0, rank: 8, players: [], depth: 'average' },
        K: { score: 8.0, rank: 4, players: [], depth: 'good' }
      },
      weeklyProjections: Array.from({ length: 8 }, (_, i) => ({
        week: i + 1,
        projectedPoints: 85 + Math.random() * 30,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
        confidence: 0.7 + Math.random() * 0.3
      })),
      upcomingMatchups: [
        {
          week: 8,
          opponent: { id: 2, name: 'Team Alpha', owner: 'Owner A', strategy: 'value_based', tendencies: [], rosterNeeds: { QB: 0, RB: 1, WR: 0, TE: 1, DEF: 0, K: 0 } },
          difficulty: 7,
          keyMatchups: ['CMC vs weak run defense', 'Kelce vs poor TE coverage'],
          projectedMargin: 5.2
        },
        {
          week: 9,
          opponent: { id: 3, name: 'Team Beta', owner: 'Owner B', strategy: 'rb_zero', tendencies: [], rosterNeeds: { QB: 0, RB: 2, WR: 0, TE: 0, DEF: 0, K: 0 } },
          difficulty: 4,
          keyMatchups: ['Strong WR corps vs weak secondary'],
          projectedMargin: 12.8
        }
      ],
      tradeOpportunities: [
        {
          id: '1',
          type: 'upgrade',
          priority: 'high',
          targetPlayer: { id: '99', name: 'Elite WR1', position: 'WR', team: 'DAL', projectedPoints: 18.5, adp: 15, tier: 1, value: 95 },
          offerPlayers: [
            { id: '100', name: 'Solid WR2', position: 'WR', team: 'GB', projectedPoints: 14.2, adp: 35, tier: 3, value: 75 },
            { id: '101', name: 'Handcuff RB', position: 'RB', team: 'SF', projectedPoints: 8.5, adp: 85, tier: 8, value: 25 }
          ],
          expectedValue: 1.35,
          reasoning: 'Upgrade WR1 position with championship upside player',
          fairTradeValue: 1.28,
          partnerTeam: { id: 4, name: 'Team Gamma', owner: 'Owner C', strategy: 'high_upside', tendencies: [], rosterNeeds: { QB: 0, RB: 1, WR: 1, TE: 0, DEF: 0, K: 0 } }
        }
      ],
      waiver: [
        {
          player: { id: '102', name: 'Breakout Candidate', position: 'WR', team: 'MIA', projectedPoints: 12.8, adp: 150, tier: 6, value: 45 },
          priority: 1,
          reasoning: 'High target share, favorable upcoming schedule',
          dropCandidate: { id: '103', name: 'Bench Warmer', position: 'WR', team: 'DEN', projectedPoints: 6.2, adp: 180, tier: 10, value: 15 },
          percentOwned: 15,
          projectedImpact: 'medium'
        }
      ],
      injuries: [
        {
          player: { id: '104', name: 'Star Player', position: 'RB', team: 'LAR', projectedPoints: 20.5, adp: 8, tier: 1, value: 98 },
          severity: 'moderate',
          expectedReturn: '2-3 weeks',
          impact: 'Significant reduction in RB depth',
          replacement: { id: '105', name: 'Backup RB', position: 'RB', team: 'LAR', projectedPoints: 11.2, adp: 120, tier: 7, value: 35 }
        }
      ],
      byeWeekImpact: [
        {
          week: 10,
          affectedPlayers: [
            { id: '106', name: 'QB1', position: 'QB', team: 'KC', projectedPoints: 22.5, adp: 25, tier: 2, value: 85 },
            { id: '107', name: 'WR1', position: 'WR', team: 'KC', projectedPoints: 17.8, adp: 18, tier: 2, value: 90 }
          ],
          severity: 'challenging',
          recommendations: ['Stream QB from waivers', 'Consider starting WR3 in flex']
        }
      ]
    };
  }, [team]);

  // Tab configuration
  const tabs = [
    { id: 'roster', name: 'Roster', icon: Users },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'matchups', name: 'Matchups', icon: Calendar },
    { id: 'trades', name: 'Trades', icon: ArrowUpDown },
    { id: 'waiver', name: 'Waiver', icon: Target }
  ];

  // Event handlers
  const handleSaveTeam = useCallback(() => {
    if (editedTeam && onTeamUpdate) {
      onTeamUpdate(editedTeam);
      setIsEditing(false);
    }
  }, [editedTeam, onTeamUpdate]);

  const handleTradeAction = useCallback((tradeId: string, action: 'propose' | 'analyze') => {
    console.log(`Trade action: ${action} for trade ${tradeId}`);
  }, []);

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{team.name}</h2>
                <p className="text-sm text-gray-600">Owner: {team.owner}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                  Score: {teamAnalytics.overallScore?.toFixed(1) || 'N/A'}
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded capitalize">
                  {team.strategy.replace('_', ' ')}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveTeam}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'roster' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Roster Management</h3>
              {/* Roster content would go here */}
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Roster management interface coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Team Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(teamAnalytics.strengthsByPosition || {}).map(([position, strength]) => (
                  <PositionStrengthIndicator
                    key={position}
                    position={position as Position}
                    strength={strength}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'matchups' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Upcoming Matchups</h3>
              <UpcomingMatchups matchups={teamAnalytics.upcomingMatchups || []} />
            </div>
          )}

          {activeTab === 'trades' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Trade Opportunities</h3>
              <TradeRecommendations
                trades={teamAnalytics.tradeOpportunities || []}
                onTradeAction={handleTradeAction}
              />
            </div>
          )}

          {activeTab === 'waiver' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Waiver Wire Targets</h3>
              {teamAnalytics.waiver && teamAnalytics.waiver.length > 0 ? (
                <div className="space-y-4">
                  {teamAnalytics.waiver.map((waiver, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{waiver.player.name}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                          Priority #{waiver.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{waiver.reasoning}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{waiver.percentOwned}% owned</span>
                        <span className="capitalize">{waiver.projectedImpact} impact</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No waiver recommendations at this time</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}