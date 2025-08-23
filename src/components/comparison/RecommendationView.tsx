import { memo, useMemo, useState } from 'react';
import { Target, Star, TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Player, ScoringSystem } from '@/types';

interface RecommendationViewProps {
  players: Player[];
  scoringSystem: ScoringSystem;
}

interface PlayerComparison {
  player1: Player;
  player2: Player;
  recommendation: Recommendation;
}

interface Recommendation {
  winner: Player | null;
  reason: string;
  confidence: 'High' | 'Medium' | 'Low';
  confidenceScore: number;
  pros: string[];
  cons: string[];
  situationalContext: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  upside: 'Low' | 'Medium' | 'High';
  floor: 'Low' | 'Medium' | 'High';
}

const RecommendationView = memo(({ players, scoringSystem }: RecommendationViewProps) => {
  const [expandedComparison, setExpandedComparison] = useState<number | null>(null);

  // Enhanced recommendation algorithm
  const getAdvancedRecommendation = useMemo(() => {
    return (player1: Player, player2: Player): Recommendation => {
      const p1Score = player1[scoringSystem];
      const p2Score = player2[scoringSystem];
      const scoreDiff = Math.abs(p1Score - p2Score);
      const adpDiff = Math.abs(player1.adp - player2.adp);
      
      // Position-specific analysis
      const isSkillPosition = ['RB', 'WR', 'TE'].includes(player1.position);
      const pprBonus = scoringSystem === 'ppr' && isSkillPosition;
      
      // Calculate confidence score (0-100)
      let confidenceScore = 50;
      if (scoreDiff > 3) confidenceScore += 30;
      else if (scoreDiff > 1.5) confidenceScore += 15;
      if (adpDiff > 10) confidenceScore += 10;
      if (player1.tier !== player2.tier) confidenceScore += Math.abs(player1.tier - player2.tier) * 5;
      
      confidenceScore = Math.min(95, confidenceScore);
      
      let winner: Player | null = null;
      let reason = '';
      let pros: string[] = [];
      let cons: string[] = [];
      let situationalContext: string[] = [];
      
      if (scoreDiff < 1) {
        // Close projections - analyze other factors
        const adpWinner = player1.adp > player2.adp ? player2 : player1;
        const adpLoser = player1.adp > player2.adp ? player1 : player2;
        
        if (adpDiff > 5) {
          winner = adpWinner;
          reason = `Similar projections (${scoreDiff.toFixed(1)} pt difference), but ${winner.name} has better draft value`;
          pros.push(`${winner.name}: Better draft position value (ADP ${winner.adp})`);
          pros.push(`${winner.name}: Similar upside with less draft capital`);
          cons.push(`${adpLoser.name}: Higher ADP (${adpLoser.adp}) for similar production`);
        } else {
          reason = 'Projections are too close to call - personal preference and roster construction should decide';
          pros.push(`${player1.name}: ${getPositionalAnalysis(player1, scoringSystem)}`);
          pros.push(`${player2.name}: ${getPositionalAnalysis(player2, scoringSystem)}`);
          situationalContext.push('Consider bye weeks and team schedule');
          situationalContext.push('Factor in injury history and age');
        }
      } else {
        // Clear statistical winner
        winner = p1Score > p2Score ? player1 : player2;
        const loser = p1Score > p2Score ? player2 : player1;
        
        reason = `${winner.name} has a ${scoreDiff.toFixed(1)} point per game advantage in ${scoringSystem.toUpperCase()} scoring`;
        
        // Enhanced pros/cons analysis
        pros.push(`${winner.name}: Higher projected scoring (${winner[scoringSystem].toFixed(1)} vs ${loser[scoringSystem].toFixed(1)})`);
        
        if (winner.tier < loser.tier) {
          pros.push(`${winner.name}: Higher tier player (Tier ${winner.tier} vs Tier ${loser.tier})`);
        }
        
        if (pprBonus) {
          pros.push(`${winner.name}: Benefits from ${scoringSystem.toUpperCase()} scoring format`);
        }
        
        if (winner.adp > loser.adp) {
          cons.push(`${winner.name}: Later ADP means higher draft cost (${winner.adp} vs ${loser.adp})`);
          pros.push(`${loser.name}: Better draft value with earlier ADP`);
        }
        
        // Situational context
        situationalContext.push(`${scoringSystem.toUpperCase()} scoring favors this recommendation`);
        if (isSkillPosition && scoringSystem !== 'standard') {
          situationalContext.push('PPR/Half-PPR formats increase receiving back/slot receiver value');
        }
      }
      
      // Risk assessment
      const riskLevel: 'Low' | 'Medium' | 'High' = 
        scoreDiff < 1 ? 'High' : scoreDiff > 3 ? 'Low' : 'Medium';
      
      const upside: 'Low' | 'Medium' | 'High' = 
        Math.max(p1Score, p2Score) > 20 ? 'High' : 
        Math.max(p1Score, p2Score) > 15 ? 'Medium' : 'Low';
        
      const floor: 'Low' | 'Medium' | 'High' = 
        Math.min(p1Score, p2Score) > 15 ? 'High' : 
        Math.min(p1Score, p2Score) > 10 ? 'Medium' : 'Low';
      
      const confidence: 'High' | 'Medium' | 'Low' = 
        confidenceScore >= 75 ? 'High' : 
        confidenceScore >= 60 ? 'Medium' : 'Low';
      
      return {
        winner,
        reason,
        confidence,
        confidenceScore,
        pros,
        cons,
        situationalContext,
        riskLevel,
        upside,
        floor
      };
    };
  }, [scoringSystem]);

  // Position-specific analysis helper
  const getPositionalAnalysis = (player: Player, system: ScoringSystem): string => {
    switch (player.position) {
      case 'RB':
        return system === 'ppr' ? 'Receiving upside in PPR' : 'Volume-based scorer';
      case 'WR':
        return system === 'ppr' ? 'Target share benefits PPR' : 'Big-play dependent';
      case 'TE':
        return 'Positional scarcity advantage';
      case 'QB':
        return 'Passing volume and rushing upside';
      default:
        return 'Positional value';
    }
  };

  // Generate all possible comparisons
  const comparisons = useMemo((): PlayerComparison[] => {
    const comps: PlayerComparison[] = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        comps.push({
          player1: players[i],
          player2: players[j],
          recommendation: getAdvancedRecommendation(players[i], players[j])
        });
      }
    }
    // Sort by confidence score (highest first)
    return comps.sort((a, b) => b.recommendation.confidenceScore - a.recommendation.confidenceScore);
  }, [players, getAdvancedRecommendation]);

  const toggleExpanded = (index: number) => {
    setExpandedComparison(expandedComparison === index ? null : index);
  };

  const getConfidenceColor = (confidence: string): string => {
    switch (confidence) {
      case 'High': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  if (players.length < 2) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Need More Players</h3>
        <p className="text-gray-500">Add at least 2 players to see head-to-head recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h4 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Head-to-Head Analysis</h4>
        <p className="text-gray-600">Intelligent draft recommendations based on advanced analytics and {scoringSystem.toUpperCase()} scoring</p>
        <div className="mt-2 text-sm text-gray-500">
          {comparisons.length} comparison{comparisons.length > 1 ? 's' : ''} • Sorted by confidence
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="space-y-4">
        {comparisons.map((comp, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {/* Main Comparison Header */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-4">
                {/* Player vs Player */}
                <div className="flex items-center gap-6 flex-1">
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{comp.player1.name}</div>
                    <div className="text-sm text-gray-600">{comp.player1.position} • {comp.player1.team} • ADP {comp.player1.adp}</div>
                    <div className="text-xl font-bold text-blue-600 mt-1">
                      {comp.player1[scoringSystem].toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">proj pts/game</div>
                  </div>
                  
                  <div className="text-2xl text-gray-400 font-bold">VS</div>
                  
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{comp.player2.name}</div>
                    <div className="text-sm text-gray-600">{comp.player2.position} • {comp.player2.team} • ADP {comp.player2.adp}</div>
                    <div className="text-xl font-bold text-blue-600 mt-1">
                      {comp.player2[scoringSystem].toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">proj pts/game</div>
                  </div>
                </div>

                {/* Confidence Badge */}
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-2 rounded-lg border font-medium text-sm ${getConfidenceColor(comp.recommendation.confidence)}`}>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {comp.recommendation.confidence} Confidence
                    </div>
                    <div className="text-xs mt-1">
                      {comp.recommendation.confidenceScore}% sure
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">Recommendation:</span>
                      {comp.recommendation.winner ? (
                        <span className="text-green-600 font-bold flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {comp.recommendation.winner.name}
                        </span>
                      ) : (
                        <span className="text-gray-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          No clear preference
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{comp.recommendation.reason}</p>
                    
                    {/* Quick Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Risk:</span>
                        <span className={`font-semibold ${getRiskColor(comp.recommendation.riskLevel)}`}>
                          {comp.recommendation.riskLevel}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Upside:</span>
                        <span className={`font-semibold ${getRiskColor(comp.recommendation.upside === 'High' ? 'Low' : comp.recommendation.upside === 'Low' ? 'High' : 'Medium')}`}>
                          {comp.recommendation.upside}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Floor:</span>
                        <span className={`font-semibold ${getRiskColor(comp.recommendation.floor === 'High' ? 'Low' : comp.recommendation.floor === 'Low' ? 'High' : 'Medium')}`}>
                          {comp.recommendation.floor}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => toggleExpanded(index)}
                    className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {expandedComparison === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Analysis */}
            {expandedComparison === index && (
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Pros */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-green-700 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Key Advantages
                    </h5>
                    <div className="space-y-2">
                      {comp.recommendation.pros.map((pro, proIndex) => (
                        <div key={proIndex} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                          <span className="text-gray-700">{pro}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cons */}
                  {comp.recommendation.cons.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-semibold text-red-700 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Potential Concerns
                      </h5>
                      <div className="space-y-2">
                        {comp.recommendation.cons.map((con, conIndex) => (
                          <div key={conIndex} className="flex items-start gap-2 text-sm">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                            <span className="text-gray-700">{con}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Situational Context */}
                {comp.recommendation.situationalContext.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h5 className="font-semibold text-blue-700 flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4" />
                      Situational Context
                    </h5>
                    <div className="grid gap-2">
                      {comp.recommendation.situationalContext.map((context, contextIndex) => (
                        <div key={contextIndex} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                          <span className="text-gray-700">{context}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Player Stats Comparison */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h5 className="font-semibold text-gray-700 mb-3">Detailed Comparison</h5>
                  <div className="grid grid-cols-2 gap-4">
                    {[comp.player1, comp.player2].map((player, playerIndex) => (
                      <div key={playerIndex} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="font-medium text-gray-900 mb-2">{player.name}</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">PPR:</span>
                            <span className="font-medium">{player.ppr.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Standard:</span>
                            <span className="font-medium">{player.standard.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Half PPR:</span>
                            <span className="font-medium">{player.halfPpr.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tier:</span>
                            <span className="font-medium">Tier {player.tier}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Health:</span>
                            <span className={`font-medium ${player.injury === 'Healthy' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {player.injury}
                            </span>
                          </div>
                        </div>
                        {player.news && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                            {player.news}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
        <p>Recommendations are based on projected points, ADP value, positional analysis, and {scoringSystem.toUpperCase()} scoring format.</p>
        <p className="mt-1">Consider your league settings, roster needs, and personal preferences when making final decisions.</p>
      </div>
    </div>
  );
});

RecommendationView.displayName = 'RecommendationView';

export default RecommendationView;