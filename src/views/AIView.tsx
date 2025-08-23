import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Brain, TrendingUp, Target, Shield, Zap, Send, RotateCcw, Download, Sparkles, Bot, User, Copy, ThumbsUp, ThumbsDown, AlertTriangle, Calendar, Activity, BarChart3, Timer, Trophy, Clock, Search } from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { useDraftSimulation } from '@/hooks';
import { Player, Position, ScoringSystem, DraftStrategy, InjuryStatus } from '@/types';

// Enhanced chat message interface with advanced features
interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'alert';
  content: string;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'strategy' | 'alert' | 'recommendation' | 'analysis' | 'planning';
  analysis?: {
    playerRecommendations?: Player[];
    strategyPoints?: string[];
    riskFactors?: string[];
    tierAnalysis?: Record<Position, { available: number; recommended: number }>;
    tradeRecommendations?: TradeRecommendation[];
    weeklyPlanning?: WeeklyPlan;
    valueAnalysis?: ValueAnalysis[];
    scarcityAlert?: ScarcityAlert;
    injuryImpact?: InjuryImpact;
  };
  isTyping?: boolean;
  expiresAt?: Date;
}

// Advanced AI analysis interfaces
interface TradeRecommendation {
  targetPlayer: Player;
  offerPlayers: Player[];
  fairValue: number;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface WeeklyPlan {
  week: number;
  startSitDecisions: Array<{
    player: Player;
    recommendation: 'start' | 'sit';
    confidence: number;
    reasoning: string;
  }>;
  waiverTargets: Player[];
  matchupAnalysis: string;
}

interface ValueAnalysis {
  player: Player;
  currentValue: number;
  projectedValue: number;
  valueChange: number;
  reasoning: string;
}

interface ScarcityAlert {
  position: Position;
  remainingQuality: number;
  urgencyLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface InjuryImpact {
  player: Player;
  impactLevel: 'minor' | 'moderate' | 'severe';
  affectedPlayers: Player[];
  recommendations: string[];
}

// Season phase detection
type SeasonPhase = 'draft' | 'early' | 'mid' | 'late' | 'playoff';

// User preference tracking
interface UserPreferences {
  draftStrategy: DraftStrategy[];
  riskTolerance: 'conservative' | 'balanced' | 'aggressive';
  positionPriorities: Position[];
  targetTypes: ('sleeper' | 'safe' | 'upside' | 'handcuff')[];
  tradingActivity: 'never' | 'rare' | 'active' | 'frequent';
}

// Proactive alert system
interface ProactiveAlert {
  id: string;
  type: 'bye_week' | 'injury_update' | 'matchup_alert' | 'waiver_opportunity' | 'trade_deadline';
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  actionRequired: boolean;
  players?: Player[];
  createdAt: Date;
  dismissible: boolean;
}

// Enhanced AI prompts for comprehensive analysis
const AI_PROMPTS = {
  // Draft-focused prompts
  tierAnalysis: 'Analyze current position tiers and provide tier-based draft strategy recommendations',
  pprSpecialists: 'Identify top PPR specialists available and explain why they excel in PPR formats',
  scarcityAlert: 'Alert me to position scarcity issues and when I should prioritize each position',
  strategyPlan: 'Create a complete draft strategy plan based on my current roster and upcoming picks',
  riskAssessment: 'Assess injury risks and upside potential for players in my target range',
  valueTargets: 'Find the best value targets available based on ADP vs projected performance',
  rookieAnalysis: 'Analyze rookie prospects and their fantasy impact potential',
  lateRoundGems: 'Identify late-round sleepers with breakout potential',
  
  // Season management prompts
  weeklyOptimization: 'Optimize my lineup for this week with start/sit recommendations and reasoning',
  tradeAnalyzer: 'Analyze potential trades with fair value calculations and risk assessments',
  waiverStrategy: 'Identify top waiver wire targets and drop candidates for this week',
  playoffPlanning: 'Create a playoff preparation strategy focusing on schedule and matchups',
  injuryContingency: 'Develop contingency plans for key player injuries on my roster',
  
  // Advanced analytics
  multiWeekPlanning: 'Create a 3-week planning strategy with roster moves and matchup preparation',
  positionScarcityMonitor: 'Monitor position scarcity across the league and alert on opportunities',
  valueTrendAnalysis: 'Analyze player value trends and identify buy-low/sell-high opportunities',
  seasonPhasePlanning: 'Adapt my strategy based on current season phase and league dynamics',
  customScoringOptimization: 'Optimize recommendations for our specific league scoring system'
};

// Memoized message component with enhanced analysis display
const ChatMessageComponent = memo(({ 
  message,
  onCopy,
  onLike,
  onDislike,
  onDismissAlert
}: {
  message: ChatMessage;
  onCopy: (content: string) => void;
  onLike: (messageId: string) => void;
  onDislike: (messageId: string) => void;
  onDismissAlert?: (messageId: string) => void;
}) => {
  const isAI = message.type === 'ai';
  const isAlert = message.type === 'alert';
  const priorityColors = {
    low: 'bg-blue-50 border-blue-200',
    medium: 'bg-yellow-50 border-yellow-200', 
    high: 'bg-orange-50 border-orange-200',
    urgent: 'bg-red-50 border-red-200'
  };

  return (
    <div className={`flex gap-3 mb-4 ${
      isAlert ? 'flex-col' : (isAI ? 'flex-row' : 'flex-row-reverse')
    }`}>
      {/* Alert header */}
      {isAlert && (
        <div className={`p-3 rounded-lg border ${message.priority ? priorityColors[message.priority] : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${
                message.priority === 'urgent' ? 'text-red-500' :
                message.priority === 'high' ? 'text-orange-500' :
                message.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
              }`} />
              <span className="font-medium text-gray-900">
                {message.category?.toUpperCase() || 'ALERT'}
              </span>
            </div>
            {onDismissAlert && (
              <button
                onClick={() => onDismissAlert(message.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700">{message.content}</p>
        </div>
      )}
      
      {!isAlert && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isAI ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          {isAI ? <Bot className="w-5 h-5 text-blue-600" /> : <User className="w-5 h-5 text-gray-600" />}
        </div>
      )}
      
      <div className={`flex-1 max-w-[80%] ${isAI ? 'mr-12' : 'ml-12'}`}>
        <div className={`p-4 rounded-lg ${
          isAI ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'
        }`}>
          <div className="text-sm text-gray-900 whitespace-pre-wrap">
            {message.isTyping ? (
              <div className="flex items-center gap-1">
                <span>Analyzing...</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : (
              message.content
            )}
          </div>

          {/* Enhanced analysis section for AI messages */}
          {(isAI || isAlert) && message.analysis && !message.isTyping && (
            <div className="mt-4 space-y-3">
              {/* Player Recommendations */}
              {message.analysis.playerRecommendations && (
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Player Recommendations
                  </h4>
                  <div className="space-y-2">
                    {message.analysis.playerRecommendations.slice(0, 3).map(player => (
                      <div key={player.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{player.name} ({player.position})</span>
                          {player.injury !== 'Healthy' && (
                            <span className="px-1 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                              {player.injury}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-600">ADP: {player.adp.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Trade Recommendations */}
              {message.analysis.tradeRecommendations && (
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Trade Opportunities
                  </h4>
                  <div className="space-y-2">
                    {message.analysis.tradeRecommendations.slice(0, 2).map((trade, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Target: {trade.targetPlayer.name}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            trade.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                            trade.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {trade.riskLevel} risk
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs mt-1">{trade.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Weekly Planning */}
              {message.analysis.weeklyPlanning && (
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Week {message.analysis.weeklyPlanning.week} Planning
                  </h4>
                  <div className="space-y-2">
                    {message.analysis.weeklyPlanning.startSitDecisions.slice(0, 3).map((decision, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            decision.recommendation === 'start' ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          <span className="font-medium">{decision.player.name}</span>
                          <span className="text-gray-500">({decision.recommendation})</span>
                        </div>
                        <span className="text-gray-600">{decision.confidence}% confident</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Value Analysis */}
              {message.analysis.valueAnalysis && (
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Value Trends
                  </h4>
                  <div className="space-y-2">
                    {message.analysis.valueAnalysis.slice(0, 3).map((analysis, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{analysis.player.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${
                            analysis.valueChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {analysis.valueChange > 0 ? '↑' : '↓'} {Math.abs(analysis.valueChange).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Scarcity Alert */}
              {message.analysis.scarcityAlert && (
                <div className="bg-white p-3 rounded border border-orange-200">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Position Scarcity Alert
                  </h4>
                  <div className="text-sm">
                    <p><strong>{message.analysis.scarcityAlert.position}:</strong> Only {message.analysis.scarcityAlert.remainingQuality} quality players remaining</p>
                    <p className="text-gray-600 mt-1">{message.analysis.scarcityAlert.recommendation}</p>
                  </div>
                </div>
              )}
              
              {/* Injury Impact */}
              {message.analysis.injuryImpact && (
                <div className="bg-white p-3 rounded border border-red-200">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <Activity className="w-4 h-4 text-red-500" />
                    Injury Impact Analysis
                  </h4>
                  <div className="text-sm">
                    <p><strong>{message.analysis.injuryImpact.player.name}:</strong> {message.analysis.injuryImpact.impactLevel} impact</p>
                    <div className="mt-2">
                      {message.analysis.injuryImpact.recommendations.slice(0, 2).map((rec, index) => (
                        <p key={index} className="text-gray-600">• {rec}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {message.analysis.strategyPoints && (
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Strategy Points
                  </h4>
                  <ul className="text-sm space-y-1">
                    {message.analysis.strategyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {message.analysis.riskFactors && (
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Risk Factors
                  </h4>
                  <ul className="text-sm space-y-1">
                    {message.analysis.riskFactors.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">⚠</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Message actions */}
          {isAI && !message.isTyping && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-blue-200">
              <button
                onClick={() => onCopy(message.content)}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Copy message"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => onLike(message.id)}
                className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                title="Like response"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDislike(message.id)}
                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                title="Dislike response"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
});

ChatMessageComponent.displayName = 'ChatMessageComponent';

// Enhanced quick action buttons with season-aware features
const QuickActions = memo(({ 
  onPromptSelect,
  isLoading,
  seasonPhase
}: {
  onPromptSelect: (prompt: string) => void;
  isLoading: boolean;
  seasonPhase: SeasonPhase;
}) => {
  const getPhaseActions = (phase: SeasonPhase) => {
    switch (phase) {
      case 'draft':
        return [
          { key: 'tierAnalysis', label: 'Tier Analysis', icon: TrendingUp, color: 'blue' },
          { key: 'scarcityAlert', label: 'Scarcity Alert', icon: Shield, color: 'orange' },
          { key: 'strategyPlan', label: 'Strategy Plan', icon: Zap, color: 'purple' },
          { key: 'valueTargets', label: 'Value Targets', icon: Target, color: 'green' }
        ];
      case 'early':
        return [
          { key: 'weeklyOptimization', label: 'Weekly Lineup', icon: Calendar, color: 'blue' },
          { key: 'waiverStrategy', label: 'Waiver Wire', icon: Search, color: 'green' },
          { key: 'tradeAnalyzer', label: 'Trade Analysis', icon: BarChart3, color: 'purple' },
          { key: 'injuryContingency', label: 'Injury Plans', icon: Activity, color: 'red' }
        ];
      case 'mid':
        return [
          { key: 'tradeAnalyzer', label: 'Trade Analyzer', icon: BarChart3, color: 'purple' },
          { key: 'valueTrendAnalysis', label: 'Value Trends', icon: TrendingUp, color: 'blue' },
          { key: 'multiWeekPlanning', label: 'Multi-Week Plan', icon: Calendar, color: 'green' },
          { key: 'positionScarcityMonitor', label: 'Scarcity Monitor', icon: Shield, color: 'orange' }
        ];
      case 'late':
      case 'playoff':
        return [
          { key: 'playoffPlanning', label: 'Playoff Prep', icon: Trophy, color: 'gold' },
          { key: 'weeklyOptimization', label: 'Lineup Optimizer', icon: Target, color: 'blue' },
          { key: 'injuryContingency', label: 'Injury Backup', icon: Activity, color: 'red' },
          { key: 'multiWeekPlanning', label: 'Schedule Analysis', icon: Calendar, color: 'green' }
        ];
      default:
        return [
          { key: 'tierAnalysis', label: 'Tier Analysis', icon: TrendingUp, color: 'blue' },
          { key: 'strategyPlan', label: 'Strategy Plan', icon: Zap, color: 'purple' },
          { key: 'valueTargets', label: 'Value Targets', icon: Target, color: 'green' },
          { key: 'scarcityAlert', label: 'Scarcity Alert', icon: Shield, color: 'orange' }
        ];
    }
  };

  const actions = getPhaseActions(seasonPhase);

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <button
            key={action.key}
            onClick={() => onPromptSelect(AI_PROMPTS[action.key as keyof typeof AI_PROMPTS])}
            disabled={isLoading}
            className={`p-3 text-left bg-${action.color}-50 hover:bg-${action.color}-100 rounded-lg transition-colors border border-${action.color}-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Icon className="w-4 h-4 mb-1" />
            <div className="font-medium">{action.label}</div>
          </button>
        );
      })}
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

// AI context summary component
const ContextSummary = memo(({ 
  availablePlayers,
  draftedPlayers,
  currentRound,
  scoringSystem,
  userTeamNeeds
}: {
  availablePlayers: Player[];
  draftedPlayers: Set<number>;
  currentRound: number;
  scoringSystem: ScoringSystem;
  userTeamNeeds: Position[];
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Current Context
      </h4>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Round:</span>
          <span className="font-medium ml-1">{currentRound}</span>
        </div>
        <div>
          <span className="text-gray-600">Scoring:</span>
          <span className="font-medium ml-1">{scoringSystem.toUpperCase()}</span>
        </div>
        <div>
          <span className="text-gray-600">Available:</span>
          <span className="font-medium ml-1">{availablePlayers.length} players</span>
        </div>
        <div>
          <span className="text-gray-600">Drafted:</span>
          <span className="font-medium ml-1">{draftedPlayers.size} players</span>
        </div>
      </div>
      
      {userTeamNeeds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-gray-600 text-sm">Team needs:</span>
          <div className="flex gap-1 mt-1">
            {userTeamNeeds.map(position => (
              <span key={position} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {position}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ContextSummary.displayName = 'ContextSummary';

// Advanced AI Strategy Engine
const AdvancedStrategyEngine = memo(() => {
  const analyzeUserPreferences = useCallback((draftHistory: any[], customRankings: Record<number, number>): UserPreferences => {
    // Analyze draft patterns to determine user preferences
    const positionCounts = draftHistory.reduce((counts, pick) => {
      const position = pick.player?.position;
      if (position) {
        counts[position] = (counts[position] || 0) + 1;
      }
      return counts;
    }, {} as Record<Position, number>);

    const totalPicks = draftHistory.length;
    const rbEarly = draftHistory.slice(0, 3).filter(p => p.player?.position === 'RB').length;
    const wrEarly = draftHistory.slice(0, 3).filter(p => p.player?.position === 'WR').length;

    return {
      draftStrategy: rbEarly >= 2 ? ['rb_zero'] : wrEarly >= 2 ? ['stars_and_scrubs'] : ['balanced'],
      riskTolerance: Object.keys(customRankings).length > 10 ? 'aggressive' : 'balanced',
      positionPriorities: Object.entries(positionCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([pos]) => pos as Position),
      targetTypes: ['safe', 'upside'],
      tradingActivity: 'active'
    };
  }, []);

  const detectSeasonPhase = useCallback((currentWeek: number, draftComplete: boolean): SeasonPhase => {
    if (!draftComplete) return 'draft';
    if (currentWeek <= 4) return 'early';
    if (currentWeek <= 10) return 'mid';
    if (currentWeek <= 14) return 'late';
    return 'playoff';
  }, []);

  const generateProactiveAlerts = useCallback((players: Player[], draftedPlayers: Set<number>, currentWeek = 1): ProactiveAlert[] => {
    const alerts: ProactiveAlert[] = [];
    const now = new Date();

    // Bye week alerts
    const upcomingByeWeeks = [4, 5, 6, 7]; // Simulate bye weeks
    const affectedPlayers = Array.from(draftedPlayers)
      .map(id => players.find(p => p.id === id))
      .filter(Boolean) as Player[];

    if (affectedPlayers.length > 0 && upcomingByeWeeks.includes(currentWeek + 1)) {
      alerts.push({
        id: `bye-week-${currentWeek + 1}`,
        type: 'bye_week',
        severity: 'warning',
        title: `Bye Week Alert - Week ${currentWeek + 1}`,
        message: `Multiple players have byes next week. Consider waiver wire options.`,
        actionRequired: true,
        players: affectedPlayers.slice(0, 3),
        createdAt: now,
        dismissible: true
      });
    }

    // Injury alerts
    const injuredPlayers = players.filter(p => 
      draftedPlayers.has(p.id) && p.injury !== 'Healthy'
    );

    injuredPlayers.forEach(player => {
      if (player.injury === 'Doubtful' || player.injury === 'Out') {
        alerts.push({
          id: `injury-${player.id}`,
          type: 'injury_update',
          severity: player.injury === 'Out' ? 'urgent' : 'warning',
          title: `Injury Update: ${player.name}`,
          message: `${player.name} is ${player.injury.toLowerCase()}. Consider backup options.`,
          actionRequired: true,
          players: [player],
          createdAt: now,
          dismissible: true
        });
      }
    });

    // Position scarcity alerts
    const positionCounts = players.reduce((counts, player) => {
      if (!draftedPlayers.has(player.id)) {
        counts[player.position] = (counts[player.position] || 0) + 1;
      }
      return counts;
    }, {} as Record<Position, number>);

    Object.entries(positionCounts).forEach(([position, count]) => {
      if (count < 5 && ['RB', 'WR', 'TE'].includes(position)) {
        alerts.push({
          id: `scarcity-${position}`,
          type: 'matchup_alert',
          severity: 'info',
          title: `${position} Scarcity Alert`,
          message: `Only ${count} quality ${position}s remain available.`,
          actionRequired: false,
          createdAt: now,
          dismissible: true
        });
      }
    });

    return alerts;
  }, []);

  return null;
});

AdvancedStrategyEngine.displayName = 'AdvancedStrategyEngine';

// Proactive Alert Display Component
const ProactiveAlertDisplay = memo(({ alerts, onDismiss }: {
  alerts: ProactiveAlert[];
  onDismiss: (alertId: string) => void;
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        Active Alerts ({alerts.length})
      </h4>
      <div className="space-y-2">
        {alerts.slice(0, 3).map(alert => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border ${
              alert.severity === 'urgent' ? 'bg-red-50 border-red-200' :
              alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  alert.severity === 'urgent' ? 'bg-red-500' :
                  alert.severity === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}></span>
                <span className="font-medium text-sm">{alert.title}</span>
              </div>
              {alert.dismissible && (
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
            {alert.players && alert.players.length > 0 && (
              <div className="flex gap-1 mt-2">
                {alert.players.map(player => (
                  <span key={player.id} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {player.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

ProactiveAlertDisplay.displayName = 'ProactiveAlertDisplay';

// Main AIView component with enhanced features
export default function AIView() {
  const { state } = useFantasyFootball();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveAlert[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({ 
    draftStrategy: ['balanced'], 
    riskTolerance: 'balanced', 
    positionPriorities: ['RB', 'WR', 'QB', 'TE', 'DEF', 'K'], 
    targetTypes: ['safe'], 
    tradingActivity: 'active' 
  });
  const [seasonPhase, setSeasonPhase] = useState<SeasonPhase>('draft');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { availablePlayers, currentRound } = useDraftSimulation();

  // Initialize with enhanced welcome message and proactive systems
  useEffect(() => {
    const currentWeek = 1; // This would come from a real API
    const isDraftComplete = state.draftedPlayers.size >= state.draftSettings.totalTeams * state.draftSettings.rounds;
    const phase = isDraftComplete ? 'early' : 'draft';
    setSeasonPhase(phase);

    // Generate initial proactive alerts
    const initialAlerts: ProactiveAlert[] = [
      {
        id: 'draft-prep',
        type: 'matchup_alert',
        severity: 'info',
        title: 'Draft Preparation Complete',
        message: 'AI coaching systems activated. Monitoring for opportunities and alerts.',
        actionRequired: false,
        createdAt: new Date(),
        dismissible: true
      }
    ];
    setProactiveAlerts(initialAlerts);

    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'ai',
      content: `🧠 **Advanced AI Fantasy Coach Activated**\n\n**Season Phase:** ${phase.charAt(0).toUpperCase() + phase.slice(1)}\n**League:** ${state.draftSettings.leagueName}\n**Scoring:** ${state.scoringSystem.toUpperCase()}\n\n**Enhanced Capabilities:**\n• 🎯 Proactive alert system for injuries, byes, and opportunities\n• 🧠 Strategy adaptation based on your draft patterns\n• 📊 Multi-week planning and roster optimization\n• 💰 Real-time value analysis and trade recommendations\n• 🏆 Playoff preparation and schedule analysis\n\n**Current Focus:** ${phase === 'draft' ? 'Draft strategy and value identification' : 'Weekly optimization and roster management'}\n\nI'm monitoring your league for opportunities and will proactively alert you to important developments. What would you like to analyze first?`,
      timestamp: new Date(),
      priority: 'high',
      category: 'strategy',
      analysis: {
        strategyPoints: [
          `${state.scoringSystem.toUpperCase()} scoring system detected - optimizing recommendations`,
          'Monitoring position scarcity and value opportunities',
          'Tracking injury reports and roster implications',
          phase === 'draft' ? 'Draft strategy adaptation active' : 'Weekly lineup optimization ready'
        ]
      }
    };
    setMessages([welcomeMessage]);
  }, [state.draftSettings, state.scoringSystem, state.draftedPlayers.size]);

  // Proactive alert generation system
  useEffect(() => {
    const generateAlerts = () => {
      const alerts: ProactiveAlert[] = [];
      const now = new Date();

      // Generate proactive alerts based on current state
      if (seasonPhase === 'draft') {
        // Draft-specific alerts
        const roundProgress = state.currentOverallPick / (state.draftSettings.totalTeams * state.draftSettings.rounds);
        if (roundProgress > 0.6 && userTeamNeeds.includes('RB' as Position)) {
          alerts.push({
            id: 'rb-scarcity-draft',
            type: 'matchup_alert',
            severity: 'warning',
            title: 'RB Scarcity Alert',
            message: 'Quality RBs becoming scarce. Consider prioritizing RB in next few picks.',
            actionRequired: true,
            createdAt: now,
            dismissible: true
          });
        }
      } else {
        // Season management alerts
        const injuredPlayers = state.players.filter(p => 
          state.draftedPlayers.has(p.id) && p.injury !== 'Healthy'
        );
        
        injuredPlayers.forEach(player => {
          alerts.push({
            id: `injury-alert-${player.id}`,
            type: 'injury_update',
            severity: player.injury === 'Out' ? 'urgent' : 'warning',
            title: `${player.name} Injury Update`,
            message: `${player.name} status: ${player.injury}. Review backup options.`,
            actionRequired: true,
            players: [player],
            createdAt: now,
            dismissible: true
          });
        });
      }

      setProactiveAlerts(prev => {
        const existingIds = new Set(prev.map(alert => alert.id));
        const newAlerts = alerts.filter(alert => !existingIds.has(alert.id));
        return [...prev, ...newAlerts];
      });
    };

    // Generate alerts initially and then periodically
    generateAlerts();
    const alertInterval = setInterval(generateAlerts, 30000); // Every 30 seconds

    return () => clearInterval(alertInterval);
  }, [seasonPhase, state.currentOverallPick, state.draftSettings, userTeamNeeds, state.players, state.draftedPlayers]);

  // User preference analysis
  useEffect(() => {
    if (state.draftHistory.length >= 3) {
      const preferences = {
        draftStrategy: ['balanced'] as DraftStrategy[],
        riskTolerance: 'balanced' as const,
        positionPriorities: ['RB', 'WR', 'QB', 'TE', 'DEF', 'K'] as Position[],
        targetTypes: ['safe', 'upside'] as ('sleeper' | 'safe' | 'upside' | 'handcuff')[],
        tradingActivity: 'active' as const
      };
      
      // Analyze draft patterns
      const earlyPicks = state.draftHistory.slice(0, 6);
      const rbCount = earlyPicks.filter(pick => {
        const player = state.players.find(p => p.id === pick.playerId);
        return player?.position === 'RB';
      }).length;
      
      if (rbCount >= 3) {
        preferences.draftStrategy = ['rb_zero'];
      }
      
      setUserPreferences(preferences);
    }
  }, [state.draftHistory, state.players]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Determine user team needs based on drafted players
  const userTeamNeeds = useMemo(() => {
    const neededPositions: Position[] = [];
    const positionCounts = Array.from(state.draftedPlayers).reduce((counts, playerId) => {
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        counts[player.position] = (counts[player.position] || 0) + 1;
      }
      return counts;
    }, {} as Record<Position, number>);

    // Standard roster requirements
    const requirements: Record<Position, number> = { QB: 1, RB: 2, WR: 2, TE: 1, DEF: 1, K: 1 };
    
    Object.entries(requirements).forEach(([pos, needed]) => {
      const current = positionCounts[pos as Position] || 0;
      if (current < needed) {
        for (let i = 0; i < needed - current; i++) {
          neededPositions.push(pos as Position);
        }
      }
    });

    return neededPositions;
  }, [state.draftedPlayers, state.players]);

  // Enhanced AI response generation with advanced analysis
  const generateAIResponse = useCallback(async (userMessage: string): Promise<ChatMessage> => {
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000)); // Simulate processing time

    const topAvailable = availablePlayers.slice(0, 10);
    const playerRecommendations = topAvailable.slice(0, 5);
    
    let content = '';
    let analysis: ChatMessage['analysis'] = {};
    let priority: ChatMessage['priority'] = 'medium';
    let category: ChatMessage['category'] = 'analysis';

    // Enhanced analysis based on message content and context
    if (userMessage.toLowerCase().includes('tier')) {
      category = 'analysis';
      priority = 'high';
      content = `🎯 **Advanced Tier Analysis - Round ${currentRound}**\n\n**TIER 1 (Elite):** Top 12 overall picks\n• Proven workhorse RBs with 300+ touches\n• Elite WRs with 140+ targets\n• Top-tier QBs in high-volume offenses\n\n**TIER 2 (Solid):** Rounds 2-4\n• High-floor players with weekly starter upside\n• Consistent target/carry share players\n\n**TIER 3 (Value):** Rounds 5-8\n• Upside plays with path to relevance\n• Handcuffs and breakout candidates\n\n**Current Opportunity:** ${seasonPhase === 'draft' ? `Round ${currentRound} presents value at ${userTeamNeeds[0] || 'multiple positions'}` : 'Focus on weekly matchup advantages'}`;
      
      analysis.playerRecommendations = playerRecommendations;
      analysis.strategyPoints = [
        `${state.scoringSystem.toUpperCase()} scoring: Prioritize reception volume`,
        `Position scarcity: ${userTeamNeeds.length > 0 ? `Address ${userTeamNeeds.join(', ')} needs` : 'Build depth'}`,
        'Value-based targeting: Target ADP fallers',
        seasonPhase === 'draft' ? 'Handcuff strategy in late rounds' : 'Streaming positions for matchups'
      ];

      // Add scarcity analysis
      const scarcityData = ['RB', 'WR', 'TE', 'QB'].map(pos => {
        const available = availablePlayers.filter(p => p.position === pos && p.tier <= 6).length;
        return { position: pos as Position, available };
      }).find(p => p.available < 8);

      if (scarcityData) {
        analysis.scarcityAlert = {
          position: scarcityData.position,
          remainingQuality: scarcityData.available,
          urgencyLevel: scarcityData.available < 4 ? 'high' : 'medium',
          recommendation: `Consider ${scarcityData.position} soon - only ${scarcityData.available} quality options left`
        };
      }

    } else if (userMessage.toLowerCase().includes('trade')) {
      category = 'recommendation';
      priority = 'high';
      content = `📊 **Trade Analysis Engine Activated**\n\n**Current Market Context:**\n• ${seasonPhase === 'draft' ? 'Draft-based valuations' : 'Performance-based market'}\n• Your risk tolerance: ${userPreferences.riskTolerance}\n• Trading activity: ${userPreferences.tradingActivity}\n\n**Trade Opportunities:**\n• Target buy-low candidates with soft schedules\n• Consider selling high on over-performing assets\n• Package depth for upgrades at key positions\n\n**Fair Value Framework:** Using ADP, projections, and positional scarcity`;

      // Generate mock trade recommendations
      const tradeCandidates = playerRecommendations.slice(0, 2);
      analysis.tradeRecommendations = tradeCandidates.map(player => ({
        targetPlayer: player,
        offerPlayers: playerRecommendations.slice(2, 4),
        fairValue: 0.85, // Mock fair value
        reasoning: `${player.name} has favorable upcoming schedule and undervalued in ${state.scoringSystem} format`,
        riskLevel: 'medium' as const
      }));

    } else if (userMessage.toLowerCase().includes('week')) {
      category = 'planning';
      priority = 'high';
      content = `📅 **Weekly Optimization System**\n\n**This Week's Focus:**\n• Lineup optimization based on matchups\n• Start/sit decisions with confidence ratings\n• Waiver wire priorities and drop candidates\n• Injury impact assessments\n\n**Multi-Week Planning:**\n• Upcoming bye week preparations\n• Schedule-based trade targets\n• Playoff positioning strategy`;

      // Generate weekly planning
      const myPlayers = Array.from(state.draftedPlayers)
        .map(id => state.players.find(p => p.id === id))
        .filter(Boolean) as Player[];
      
      if (myPlayers.length > 0) {
        analysis.weeklyPlanning = {
          week: Math.floor(Math.random() * 17) + 1,
          startSitDecisions: myPlayers.slice(0, 3).map(player => ({
            player,
            recommendation: Math.random() > 0.5 ? 'start' : 'sit' as const,
            confidence: Math.floor(Math.random() * 40) + 60,
            reasoning: `Matchup analysis suggests ${Math.random() > 0.5 ? 'favorable' : 'challenging'} game script`
          })),
          waiverTargets: availablePlayers.slice(0, 3),
          matchupAnalysis: 'Favorable game scripts for passing attacks this week'
        };
      }

    } else if (userMessage.toLowerCase().includes('injury')) {
      category = 'alert';
      priority = 'urgent';
      content = `🏥 **Injury Impact Analysis**\n\n**Current Injury Landscape:**\n• Monitoring ${state.players.filter(p => p.injury !== 'Healthy').length} injured players\n• Impact assessments for roster planning\n• Handcuff and replacement value analysis\n\n**Injury Contingency Planning:**\n• Identify vulnerable roster positions\n• Prioritize handcuffs and insurance policies\n• Monitor practice reports and beat writers`;

      const injuredPlayers = state.players.filter(p => p.injury !== 'Healthy').slice(0, 3);
      if (injuredPlayers.length > 0) {
        analysis.injuryImpact = {
          player: injuredPlayers[0],
          impactLevel: injuredPlayers[0].injury === 'Out' ? 'severe' : 'moderate',
          affectedPlayers: injuredPlayers,
          recommendations: [
            `Monitor ${injuredPlayers[0].name}'s practice participation`,
            'Consider handcuff or replacement options',
            'Evaluate waiver wire for contingency plans'
          ]
        };
      }

    } else if (userMessage.toLowerCase().includes('value')) {
      category = 'analysis';
      priority = 'medium';
      content = `💰 **Value Analysis Engine**\n\n**Current Value Landscape:**\n• ADP vs Performance discrepancies\n• Rising and falling player values\n• Position-based value opportunities\n\n**Value Categories:**\n• **Buy Low:** Underperforming with positive regression signs\n• **Sell High:** Overperforming with concerning metrics\n• **Hold:** Fairly valued with stable outlook`;

      // Generate value analysis
      analysis.valueAnalysis = playerRecommendations.slice(0, 4).map(player => {
        const valueChange = (Math.random() - 0.5) * 20; // Random value change for demo
        return {
          player,
          currentValue: player.adp,
          projectedValue: player.adp + valueChange,
          valueChange,
          reasoning: valueChange > 0 ? 
            'Positive trend indicators suggest upward trajectory' : 
            'Concerning usage trends may limit upside'
        };
      });

    } else {
      // Default comprehensive analysis
      category = 'strategy';
      content = `🧠 **Comprehensive Analysis**\n\n**Current Situation:**\n• Available talent: ${availablePlayers.length} players\n• Team needs: ${userTeamNeeds.join(', ') || 'Depth building'}\n• Season phase: ${seasonPhase}\n• User strategy: ${userPreferences.draftStrategy.join(', ')}\n\n**Recommendations:**\n• Focus on ${userTeamNeeds[0] || 'best player available'}\n• ${topAvailable[0]?.name || 'Top available'} represents strong value\n• Consider ${seasonPhase === 'draft' ? 'positional scarcity' : 'weekly matchups'}`;
      
      analysis.playerRecommendations = playerRecommendations;
      analysis.strategyPoints = [
        `Season phase: ${seasonPhase} - ${seasonPhase === 'draft' ? 'value-based drafting' : 'matchup optimization'}`,
        `Risk tolerance: ${userPreferences.riskTolerance} - ${userPreferences.riskTolerance === 'aggressive' ? 'target upside plays' : 'prioritize floor'}`,
        `Needs assessment: ${userTeamNeeds.length} positions to address`,
        'Opportunity identification: Monitor for value discrepancies'
      ];
    }

    return {
      id: Date.now().toString(),
      type: 'ai',
      content,
      timestamp: new Date(),
      priority,
      category,
      analysis
    };
  }, [availablePlayers, currentRound, userTeamNeeds, state.draftedPlayers.size, seasonPhase, userPreferences, state.scoringSystem, state.players, state.draftedPlayers]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (messageContent: string = input) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prev => [...prev, typingMessage]);

    try {
      const aiResponse = await generateAIResponse(messageContent);
      setMessages(prev => [...prev.slice(0, -1), aiResponse]); // Replace typing indicator
    } catch (error) {
      setMessages(prev => [...prev.slice(0, -1), {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, generateAIResponse]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const clearChat = useCallback(() => {
    setMessages(messages.slice(0, 1)); // Keep welcome message
  }, [messages]);

  const exportChat = useCallback(() => {
    const chatText = messages.map(msg => 
      `${msg.type.toUpperCase()} (${msg.timestamp.toLocaleString()}): ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  const likeMessage = useCallback((messageId: string) => {
    // In a real app, this would send feedback to improve AI responses
    console.log('Liked message:', messageId);
  }, []);

  const dislikeMessage = useCallback((messageId: string) => {
    // In a real app, this would send feedback to improve AI responses
    console.log('Disliked message:', messageId);
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setProactiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Advanced alert message handler
  const handleAlertMessage = useCallback((alert: ProactiveAlert) => {
    const alertMessage: ChatMessage = {
      id: `alert-${alert.id}`,
      type: 'alert',
      content: alert.message,
      timestamp: alert.createdAt,
      priority: alert.severity === 'urgent' ? 'urgent' : alert.severity === 'warning' ? 'high' : 'medium',
      category: 'alert',
      analysis: alert.players ? {
        playerRecommendations: alert.players
      } : undefined
    };
    
    setMessages(prev => [...prev, alertMessage]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Enhanced AI Assistant
          </h3>
          <div className="flex gap-2">
            <button
              onClick={clearChat}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Chat
            </button>
            <button
              onClick={exportChat}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Export Chat
            </button>
          </div>
        </div>

        <ContextSummary
          availablePlayers={availablePlayers}
          draftedPlayers={state.draftedPlayers}
          currentRound={currentRound}
          scoringSystem={state.scoringSystem}
          userTeamNeeds={userTeamNeeds}
        />

        <QuickActions
          onPromptSelect={handleSendMessage}
          isLoading={isLoading}
          seasonPhase={seasonPhase}
        />

        {/* Proactive Alerts Display */}
        <ProactiveAlertDisplay
          alerts={proactiveAlerts}
          onDismiss={dismissAlert}
        />
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 border-b border-gray-200">
          {messages.map(message => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              onCopy={copyMessage}
              onLike={likeMessage}
              onDislike={dislikeMessage}
              onDismissAlert={message.type === 'alert' ? dismissAlert : undefined}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask for advanced draft analysis, strategy recommendations, or player insights..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}