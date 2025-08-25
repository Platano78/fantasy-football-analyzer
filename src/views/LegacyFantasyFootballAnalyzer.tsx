import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { Search, Users, TrendingUp, MessageCircle, Download, Settings, X, Clock, AlertTriangle, CheckCircle, Brain, Zap, Globe, Play, Eye, Camera, RefreshCw, Target, Shield, BarChart3, Star, Pause, RotateCcw, Volume2, UserCheck, FileText, BarChart2, Award, GitCompare } from 'lucide-react';

// Expanded player database for realistic draft simulation
const MOCK_PLAYERS = [
  // QB Tier 1
  { id: 1, name: 'Josh Allen', position: 'QB', team: 'BUF', adp: 3.2, ppr: 26.8, standard: 26.8, halfPpr: 26.8, injury: 'Healthy', news: 'Bonus scoring boosts QB1 upside', tier: 1 },
  { id: 2, name: 'Lamar Jackson', position: 'QB', team: 'BAL', adp: 4.1, ppr: 26.2, standard: 26.2, halfPpr: 26.2, injury: 'Healthy', news: 'Rushing yards = huge bonus potential', tier: 1 },
  { id: 3, name: 'Jalen Hurts', position: 'QB', team: 'PHI', adp: 5.3, ppr: 25.1, standard: 25.1, halfPpr: 25.1, injury: 'Healthy', news: 'Top-3 rushing QB with bonuses', tier: 1 },
  
  // QB Tier 2
  { id: 4, name: 'Joe Burrow', position: 'QB', team: 'CIN', adp: 7.2, ppr: 24.1, standard: 24.1, halfPpr: 24.1, injury: 'Healthy', news: 'Big play bonus upside', tier: 2 },
  { id: 5, name: 'Dak Prescott', position: 'QB', team: 'DAL', adp: 8.7, ppr: 23.4, standard: 23.4, halfPpr: 23.4, injury: 'Healthy', news: 'Passing yard bonuses help', tier: 2 },
  { id: 101, name: 'Tua Tagovailoa', position: 'QB', team: 'MIA', adp: 9.1, ppr: 22.8, standard: 22.8, halfPpr: 22.8, injury: 'Healthy', news: 'High volume passing offense', tier: 2 },
  { id: 102, name: 'Aaron Rodgers', position: 'QB', team: 'NYJ', adp: 10.4, ppr: 22.3, standard: 22.3, halfPpr: 22.3, injury: 'Healthy', news: 'Comeback season potential', tier: 2 },
  
  // RB Tier 1
  { id: 6, name: 'Christian McCaffrey', position: 'RB', team: 'SF', adp: 1.1, ppr: 25.8, standard: 20.3, halfPpr: 23.1, injury: 'Healthy', news: 'PPR + bonus scoring monster', tier: 1 },
  { id: 7, name: 'Austin Ekeler', position: 'RB', team: 'LAC', adp: 2.3, ppr: 22.4, standard: 16.8, halfPpr: 19.6, injury: 'Healthy', news: '70+ catches = PPR gold', tier: 1 },
  { id: 8, name: 'Derrick Henry', position: 'RB', team: 'BAL', adp: 2.8, ppr: 19.2, standard: 18.9, halfPpr: 19.1, injury: 'Healthy', news: '100+ yard game bonuses', tier: 1 },
  { id: 9, name: 'Saquon Barkley', position: 'RB', team: 'PHI', adp: 3.1, ppr: 21.6, standard: 17.1, halfPpr: 19.4, injury: 'Healthy', news: 'Eagles passing game helps PPR', tier: 1 },
  
  // RB Tier 2
  { id: 10, name: 'Bijan Robinson', position: 'RB', team: 'ATL', adp: 4.2, ppr: 20.8, standard: 16.4, halfPpr: 18.6, injury: 'Healthy', news: 'Receiving upside in PPR', tier: 2 },
  { id: 103, name: 'Jonathan Taylor', position: 'RB', team: 'IND', adp: 4.8, ppr: 20.2, standard: 18.1, halfPpr: 19.2, injury: 'Healthy', news: 'Bounce-back season expected', tier: 2 },
  { id: 104, name: 'Nick Chubb', position: 'RB', team: 'CLE', adp: 5.1, ppr: 19.8, standard: 18.4, halfPpr: 19.1, injury: 'Healthy', news: 'Workhorse back when healthy', tier: 2 },
  { id: 105, name: 'Alvin Kamara', position: 'RB', team: 'NO', adp: 5.4, ppr: 19.5, standard: 15.2, halfPpr: 17.4, injury: 'Healthy', news: 'PPR specialist', tier: 2 },
  { id: 106, name: 'Jahmyr Gibbs', position: 'RB', team: 'DET', adp: 6.2, ppr: 18.9, standard: 15.8, halfPpr: 17.4, injury: 'Healthy', news: 'Dynamic Lions offense', tier: 2 },
  
  // WR Tier 1
  { id: 13, name: 'Tyreek Hill', position: 'WR', team: 'MIA', adp: 1.8, ppr: 21.9, standard: 15.2, halfPpr: 18.6, injury: 'Healthy', news: '140+ targets = PPR machine', tier: 1 },
  { id: 14, name: 'Cooper Kupp', position: 'WR', team: 'LAR', adp: 2.1, ppr: 21.4, standard: 14.7, halfPpr: 18.1, injury: 'Healthy', news: 'When healthy = target monster', tier: 1 },
  { id: 15, name: 'Stefon Diggs', position: 'WR', team: 'HOU', adp: 2.7, ppr: 20.8, standard: 14.3, halfPpr: 17.6, injury: 'Healthy', news: 'Houston targets = PPR gold', tier: 1 },
  { id: 16, name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', adp: 3.4, ppr: 20.1, standard: 13.8, halfPpr: 17.0, injury: 'Healthy', news: '120+ targets in Lions offense', tier: 1 },
  { id: 17, name: 'CeeDee Lamb', position: 'WR', team: 'DAL', adp: 3.8, ppr: 19.8, standard: 13.5, halfPpr: 16.7, injury: 'Healthy', news: 'Dallas WR1 target share', tier: 1 },
  
  // WR Tier 2
  { id: 107, name: 'Davante Adams', position: 'WR', team: 'LV', adp: 4.1, ppr: 19.5, standard: 13.2, halfPpr: 16.4, injury: 'Healthy', news: 'Elite route runner', tier: 2 },
  { id: 108, name: 'A.J. Brown', position: 'WR', team: 'PHI', adp: 4.4, ppr: 19.2, standard: 13.8, halfPpr: 16.5, injury: 'Healthy', news: 'Big play potential', tier: 2 },
  { id: 109, name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN', adp: 4.7, ppr: 18.9, standard: 13.1, halfPpr: 16.0, injury: 'Healthy', news: 'Burrow\'s favorite target', tier: 2 },
  { id: 110, name: 'DK Metcalf', position: 'WR', team: 'SEA', adp: 5.2, ppr: 18.4, standard: 12.8, halfPpr: 15.6, injury: 'Healthy', news: 'Red zone monster', tier: 2 },
  { id: 111, name: 'DeVonta Smith', position: 'WR', team: 'PHI', adp: 5.8, ppr: 17.9, standard: 12.1, halfPpr: 15.0, injury: 'Healthy', news: 'Consistent target share', tier: 2 },
  
  // TE Tier 1-2
  { id: 21, name: 'Travis Kelce', position: 'TE', team: 'KC', adp: 3.9, ppr: 15.8, standard: 12.3, halfPpr: 14.1, injury: 'Healthy', news: 'Still the TE1', tier: 1 },
  { id: 22, name: 'Mark Andrews', position: 'TE', team: 'BAL', adp: 5.8, ppr: 13.2, standard: 10.7, halfPpr: 12.0, injury: 'Healthy', news: 'Lamar\'s security blanket', tier: 2 },
  { id: 112, name: 'T.J. Hockenson', position: 'TE', team: 'MIN', adp: 7.2, ppr: 12.4, standard: 9.8, halfPpr: 11.1, injury: 'Healthy', news: 'Target hog when healthy', tier: 2 },
  { id: 113, name: 'Kyle Pitts', position: 'TE', team: 'ATL', adp: 8.1, ppr: 11.8, standard: 9.2, halfPpr: 10.5, injury: 'Healthy', news: 'Ceiling play', tier: 2 },
  { id: 114, name: 'George Kittle', position: 'TE', team: 'SF', adp: 8.7, ppr: 11.5, standard: 9.4, halfPpr: 10.5, injury: 'Healthy', news: 'YAC monster', tier: 2 },
  
  // Defense & Kicker
  { id: 36, name: 'San Francisco 49ers', position: 'DEF', team: 'SF', adp: 12.1, ppr: 9.2, standard: 9.2, halfPpr: 9.2, injury: 'Healthy', news: 'Elite pass rush', tier: 1 },
  { id: 115, name: 'Buffalo Bills', position: 'DEF', team: 'BUF', adp: 12.8, ppr: 8.8, standard: 8.8, halfPpr: 8.8, injury: 'Healthy', news: 'Strong all-around unit', tier: 1 },
  { id: 116, name: 'Dallas Cowboys', position: 'DEF', team: 'DAL', adp: 13.2, ppr: 8.5, standard: 8.5, halfPpr: 8.5, injury: 'Healthy', news: 'Takeaway specialists', tier: 2 },
  
  { id: 39, name: 'Justin Tucker', position: 'K', team: 'BAL', adp: 14.1, ppr: 8.9, standard: 8.9, halfPpr: 8.9, injury: 'Healthy', news: 'Most accurate kicker', tier: 1 },
  { id: 117, name: 'Harrison Butker', position: 'K', team: 'KC', adp: 14.8, ppr: 8.4, standard: 8.4, halfPpr: 8.4, injury: 'Healthy', news: 'High-scoring offense', tier: 1 },
  { id: 118, name: 'Tyler Bass', position: 'K', team: 'BUF', adp: 15.2, ppr: 8.1, standard: 8.1, halfPpr: 8.1, injury: 'Healthy', news: 'Consistent leg', tier: 2 }
];

// Mock team names and draft strategies for simulation
const MOCK_TEAMS = [
  { 
    id: 1, 
    name: 'Draft Sharks', 
    owner: 'Alex M.', 
    strategy: 'value_based', 
    tendencies: ['takes_best_available', 'early_rb_heavy'],
    rosterNeeds: { QB: 1, RB: 3, WR: 3, TE: 1, DEF: 1, K: 1 }
  },
  { 
    id: 2, 
    name: 'Fantasy Fanatics', 
    owner: 'Jordan K.', 
    strategy: 'position_scarcity', 
    tendencies: ['early_te', 'streams_defense'],
    rosterNeeds: { QB: 1, RB: 3, WR: 3, TE: 2, DEF: 1, K: 1 }
  },
  { 
    id: 3, 
    name: 'Gridiron Gurus', 
    owner: 'Sam L.', 
    strategy: 'balanced', 
    tendencies: ['consistent_picks', 'avoids_risk'],
    rosterNeeds: { QB: 2, RB: 3, WR: 3, TE: 1, DEF: 1, K: 1 }
  },
  { 
    id: 4, 
    name: 'The Touchdown Club', 
    owner: 'Taylor R.', 
    strategy: 'high_upside', 
    tendencies: ['rookie_heavy', 'late_qb'],
    rosterNeeds: { QB: 1, RB: 4, WR: 4, TE: 1, DEF: 1, K: 1 }
  },
  { 
    id: 5, 
    name: 'Championship Chasers', 
    owner: 'Morgan P.', 
    strategy: 'rb_zero', 
    tendencies: ['wr_heavy_start', 'late_rb_stacking'],
    rosterNeeds: { QB: 1, RB: 3, WR: 4, TE: 1, DEF: 1, K: 1 }
  },
  { 
    id: 6, 
    name: 'Your Team', 
    owner: 'You', 
    strategy: 'user_controlled', 
    tendencies: ['strategic_picks'],
    rosterNeeds: { QB: 1, RB: 3, WR: 3, TE: 1, DEF: 1, K: 1 }
  },
  { 
    id: 7, 
    name: 'End Zone Elites', 
    owner: 'Casey T.', 
    strategy: 'adp_based', 
    tendencies: ['follows_rankings', 'safe_picks'],
    rosterNeeds: { QB: 1, RB: 3, WR: 3, TE: 1, DEF: 1, K: 1 }
  },
  { 
    id: 8, 
    name: 'Pigskin Pros', 
    owner: 'Riley H.', 
    strategy: 'contrarian', 
    tendencies: ['reaches_for_sleepers', 'early_qb'],
    rosterNeeds: { QB: 2, RB: 2, WR: 3, TE: 2, DEF: 1, K: 1 }
  },
  { 
    id: 9, 
    name: 'Draft Day Legends', 
    owner: 'Avery S.', 
    strategy: 'positional_runs', 
    tendencies: ['creates_runs', 'handcuff_heavy'],
    rosterNeeds: { QB: 1, RB: 4, WR: 3, TE: 1, DEF: 1, K: 1 }
  },
  { 
    id: 10, 
    name: 'Fantasy Football IQ', 
    owner: 'Quinn B.', 
    strategy: 'analytics_based', 
    tendencies: ['target_share_focus', 'efficiency_metrics'],
    rosterNeeds: { QB: 1, RB: 3, WR: 4, TE: 1, DEF: 1, K: 1 }
  },
  { 
    id: 11, 
    name: 'The Waiver Warriors', 
    owner: 'Drew C.', 
    strategy: 'stars_and_scrubs', 
    tendencies: ['top_heavy', 'streams_positions'],
    rosterNeeds: { QB: 1, RB: 3, WR: 3, TE: 1, DEF: 2, K: 1 }
  },
  { 
    id: 12, 
    name: 'Fourth Down Phenoms', 
    owner: 'Reese F.', 
    strategy: 'boom_bust', 
    tendencies: ['high_ceiling_picks', 'ignores_floor'],
    rosterNeeds: { QB: 1, RB: 3, WR: 4, TE: 1, DEF: 1, K: 1 }
  }
];

// Draft simulation engine utilities
const DraftSimulationUtils = {
  // Generate snake draft order for 12 teams
  generateSnakeDraftOrder: (totalTeams = 12, rounds = 17) => {
    const order = [];
    for (let round = 1; round <= rounds; round++) {
      if (round % 2 === 1) {
        // Odd rounds: 1, 2, 3, ..., 12
        for (let pick = 1; pick <= totalTeams; pick++) {
          order.push({
            round,
            pick,
            teamId: pick,
            overallPick: (round - 1) * totalTeams + pick
          });
        }
      } else {
        // Even rounds: 12, 11, 10, ..., 1
        for (let pick = totalTeams; pick >= 1; pick--) {
          order.push({
            round,
            pick: totalTeams - pick + 1,
            teamId: pick,
            overallPick: (round - 1) * totalTeams + (totalTeams - pick + 1)
          });
        }
      }
    }
    return order;
  },

  // Calculate AI pick based on team strategy and available players
  calculateAIPick: (availablePlayers, team, draftHistory, currentRound, scoringSystem) => {
    const teamRoster = draftHistory.filter(pick => pick.teamId === team.id);
    const positionCounts = teamRoster.reduce((counts, pick) => {
      counts[pick.player.position] = (counts[pick.player.position] || 0) + 1;
      return counts;
    }, {});

    // Filter players based on strategy and needs
    let candidates = availablePlayers.filter(player => {
      // Basic availability check
      if (!player || player.injury === 'Out') return false;
      
      // Position scarcity logic
      const positionNeed = (team.rosterNeeds[player.position] || 0) - (positionCounts[player.position] || 0);
      if (positionNeed <= 0 && currentRound <= 10) return false; // Don't draft unneeded positions early
      
      return true;
    });

    if (candidates.length === 0) {
      candidates = availablePlayers.filter(p => p && p.injury !== 'Out');
    }

    // Apply team strategy
    switch (team.strategy) {
      case 'value_based':
        candidates = candidates.filter(p => p.adp <= currentRound * 1.2);
        break;
      case 'position_scarcity':
        if (currentRound <= 3) candidates = candidates.filter(p => ['RB', 'WR', 'TE'].includes(p.position));
        break;
      case 'rb_zero':
        if (currentRound <= 6) candidates = candidates.filter(p => p.position !== 'RB');
        break;
      case 'early_qb':
        if (currentRound <= 3 && !(positionCounts['QB'] > 0)) {
          candidates = candidates.filter(p => p.position === 'QB');
        }
        break;
      case 'high_upside':
        candidates = candidates.filter(p => p.tier <= 2 || p.adp >= currentRound);
        break;
    }

    if (candidates.length === 0) {
      candidates = availablePlayers.filter(p => p && p.injury !== 'Out').slice(0, 10);
    }

    // Sort by value and add some randomness
    candidates.sort((a, b) => {
      const aValue = a[scoringSystem] + (Math.random() - 0.5) * 2;
      const bValue = b[scoringSystem] + (Math.random() - 0.5) * 2;
      return bValue - aValue;
    });

    return candidates[0] || availablePlayers[0];
  },

  // Get current picker based on overall pick number
  getCurrentPicker: (overallPick, draftOrder) => {
    const currentPick = draftOrder.find(pick => pick.overallPick === overallPick);
    return currentPick ? currentPick.teamId : 1;
  },

  // Check if it's user's turn
  isUserTurn: (currentTeamId, userTeamId = 6) => {
    return currentTeamId === userTeamId;
  }
};

// Comparison View Components
const StatsComparisonView = ({ players, scoringSystem }) => {
  const chartData = players.map(player => ({
    name: player.name.split(' ').slice(-1)[0], // Last name only for chart
    fullName: player.name,
    ppr: player.ppr,
    standard: player.standard,
    halfPpr: player.halfPpr,
    adp: player.adp,
    tier: player.tier
  }));

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
              <Tooltip formatter={(value, name) => [value.toFixed(1), name.toUpperCase()]} />
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
              <XAxis dataKey="adp" name="ADP" />
              <YAxis dataKey={scoringSystem} name="Projection" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                formatter={(value, name) => [
                  name === 'adp' ? value : value.toFixed(1), 
                  name === 'adp' ? 'ADP' : 'Projected Points'
                ]}
                labelFormatter={() => ''}
              />
              <Scatter dataKey={scoringSystem} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const TierAnalysisView = ({ players }) => {
  const tierData = players.reduce((acc, player) => {
    const tier = player.tier;
    if (!acc[tier]) {
      acc[tier] = [];
    }
    acc[tier].push(player);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-xl font-bold text-gray-900 mb-2">Positional Tier Analysis</h4>
        <p className="text-gray-600">Players grouped by tier with positional rankings</p>
      </div>

      {Object.entries(tierData).map(([tier, tierPlayers]) => (
        <div key={tier} className="bg-gray-50 rounded-lg p-4">
          <h5 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Tier {tier}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tierPlayers.map(player => (
              <div key={player.id} className="bg-white rounded-lg p-3 border-2 border-blue-200">
                <div className="font-semibold text-gray-900">{player.name}</div>
                <div className="text-sm text-gray-600">{player.position} • {player.team}</div>
                <div className="text-xs text-gray-500 mt-1">{player.news}</div>
                <div className="mt-2 flex justify-between text-sm">
                  <span>ADP: {player.adp}</span>
                  <span className="font-semibold text-blue-600">{player.ppr.toFixed(1)} PPR</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ValueADPView = ({ players, scoringSystem }) => {
  const valueData = players.map(player => ({
    name: player.name,
    shortName: player.name.split(' ').slice(-1)[0],
    adp: player.adp,
    projection: player[scoringSystem],
    value: player[scoringSystem] - (15 - player.adp), // Simple value calculation
    position: player.position,
    team: player.team
  }));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-xl font-bold text-gray-900 mb-2">Value vs ADP Analysis</h4>
        <p className="text-gray-600">Comparing projected points to average draft position</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="text-lg font-semibold mb-4">Value Chart</h5>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={valueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="adp" label={{ value: 'ADP', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Projected Points', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value, name) => [
                name === 'adp' ? value : value.toFixed(1), 
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
          <div key={player.name} className={`p-4 rounded-lg border-2 ${
            player.value > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-gray-900">{player.name}</div>
                <div className="text-sm text-gray-600">{player.position} • {player.team}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">ADP: {player.adp}</div>
                <div className="text-sm font-semibold">Proj: {player.projection.toFixed(1)}</div>
                <div className={`text-sm font-bold ${player.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Value: {player.value > 0 ? '+' : ''}{player.value.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecommendationView = ({ players, scoringSystem }) => {
  const getRecommendation = (player1, player2) => {
    const p1Score = player1[scoringSystem];
    const p2Score = player2[scoringSystem];
    const adpDiff = Math.abs(player1.adp - player2.adp);
    
    if (Math.abs(p1Score - p2Score) < 1) {
      return {
        winner: adpDiff > 2 ? (player1.adp > player2.adp ? player2 : player1) : null,
        reason: adpDiff > 2 ? "Similar projections, take the earlier ADP" : "Too close to call - personal preference",
        confidence: adpDiff > 2 ? "Medium" : "Low"
      };
    }
    
    const winner = p1Score > p2Score ? player1 : player2;
    const diff = Math.abs(p1Score - p2Score);
    
    return {
      winner,
      reason: `${diff.toFixed(1)} point advantage in ${scoringSystem.toUpperCase()} scoring`,
      confidence: diff > 3 ? "High" : diff > 1.5 ? "Medium" : "Low"
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-xl font-bold text-gray-900 mb-2">Head-to-Head Recommendations</h4>
        <p className="text-gray-600">AI-powered draft recommendations based on your scoring system</p>
      </div>

      <div className="space-y-4">
        {comparisons.map((comp, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-semibold">{comp.player1.name}</div>
                  <div className="text-sm text-gray-600">{comp.player1.position} • ADP {comp.player1.adp}</div>
                  <div className="text-lg font-bold text-blue-600">{comp.player1[scoringSystem].toFixed(1)}</div>
                </div>
                <div className="text-2xl text-gray-400">VS</div>
                <div className="text-center">
                  <div className="font-semibold">{comp.player2.name}</div>
                  <div className="text-sm text-gray-600">{comp.player2.position} • ADP {comp.player2.adp}</div>
                  <div className="text-lg font-bold text-blue-600">{comp.player2[scoringSystem].toFixed(1)}</div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                comp.recommendation.confidence === 'High' ? 'bg-green-100 text-green-800' :
                comp.recommendation.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {comp.recommendation.confidence} Confidence
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Recommendation:</span>
                {comp.recommendation.winner ? (
                  <span className="text-green-600 font-bold">{comp.recommendation.winner.name}</span>
                ) : (
                  <span className="text-gray-600 font-bold">No clear preference</span>
                )}
              </div>
              <p className="text-sm text-gray-600">{comp.recommendation.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FantasyFootballAnalyzer = () => {
  // Core state management 
  const [players, setPlayers] = useState(MOCK_PLAYERS);
  const [isLoading, setIsLoading] = useState(false);
  const [draftedPlayers, setDraftedPlayers] = useState(new Set());
  const [currentView, setCurrentView] = useState('draft');
  const [scoringSystem, setScoringSystem] = useState('ppr');
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [aiMessages, setAiMessages] = useState([]);
  const [draftSettings] = useState({
    position: 6, 
    totalTeams: 12, 
    rounds: 17, 
    leagueName: "Injustice",
    draftTime: "Sunday, Aug 24, 2025 9:00pm EDT",
    timePerPick: 60
  });
  const [aiInput, setAiInput] = useState('');

  // Enhanced features state
  const [isUpdatingData, setIsUpdatingData] = useState(false);
  const [isDraftTracking, setIsDraftTracking] = useState(false);
  
  // Player comparison state
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonView, setComparisonView] = useState('stats');
  
  // Draft Timer System
  const [draftTimer, setDraftTimer] = useState(draftSettings.timePerPick);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentPicker, setCurrentPicker] = useState(1);
  const [currentRoundState, setCurrentRoundState] = useState(1);
  const [draftOrder, setDraftOrder] = useState([]);
  const [timerWarning, setTimerWarning] = useState(false);
  const [showTimerExpired, setShowTimerExpired] = useState(false);
  const audioRef = useRef(null);

  // Draft simulation state
  const [isDraftSimulationActive, setIsDraftSimulationActive] = useState(false);
  const [draftHistory, setDraftHistory] = useState([]);
  const [currentOverallPick, setCurrentOverallPick] = useState(1);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1500); // ms between AI picks
  const [teams, setTeams] = useState(MOCK_TEAMS);
  const timerRef = useRef(null);
  const simulationRef = useRef(null);
  
  // Custom rankings and export state
  const [customRankings, setCustomRankings] = useState({});
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  const [showExportModal, setShowExportModal] = useState(false);

  // Custom rankings functions
  const updateCustomRanking = useCallback((playerId, newRank) => {
    setCustomRankings(prev => ({
      ...prev,
      [playerId]: newRank
    }));
  }, []);

  const resetCustomRankings = useCallback(() => {
    setCustomRankings({});
  }, []);

  const handleDragStart = useCallback((player) => {
    setDraggedPlayer(player);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e, targetPlayer) => {
    e.preventDefault();
    if (draggedPlayer && draggedPlayer.id !== targetPlayer.id) {
      // Swap custom rankings
      const draggedRank = customRankings[draggedPlayer.id] || draggedPlayer.adp;
      const targetRank = customRankings[targetPlayer.id] || targetPlayer.adp;
      
      setCustomRankings(prev => ({
        ...prev,
        [draggedPlayer.id]: targetRank,
        [targetPlayer.id]: draggedRank
      }));
    }
    setDraggedPlayer(null);
  }, [draggedPlayer, customRankings]);

  // Filtered players
  const filteredPlayers = useMemo(() => {
    return players
      .filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            player.team.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPosition = positionFilter === 'ALL' || player.position === positionFilter;
        return matchesSearch && matchesPosition;
      })
      .sort((a, b) => {
        if (draftedPlayers.has(a.id) && !draftedPlayers.has(b.id)) return 1;
        if (!draftedPlayers.has(a.id) && draftedPlayers.has(b.id)) return -1;
        
        // Use custom rankings if available, otherwise fall back to projections
        const aRank = customRankings[a.id] !== undefined ? customRankings[a.id] : a[scoringSystem];
        const bRank = customRankings[b.id] !== undefined ? customRankings[b.id] : b[scoringSystem];
        
        // For custom rankings, lower number = higher rank (ascending)
        // For projections, higher number = higher rank (descending)
        if (customRankings[a.id] !== undefined || customRankings[b.id] !== undefined) {
          return aRank - bRank; // ascending for custom ranks
        }
        return bRank - aRank; // descending for projections
      });
  }, [players, searchTerm, positionFilter, draftedPlayers, scoringSystem, customRankings]);

  // Stable dependency objects to prevent circular hook dependencies
  const stableExportDependencies = useMemo(() => ({
    filteredPlayers,
    customRankings,
    draftedPlayers,
    exportFormat,
    players,
    draftSettings
  }), [filteredPlayers, customRankings, draftedPlayers, exportFormat, players, draftSettings]);

  // Export functions
  const exportDraftData = useCallback(() => {
    const { filteredPlayers, customRankings, draftedPlayers, exportFormat } = stableExportDependencies;
    if (!filteredPlayers || filteredPlayers.length === 0) return;
    const exportData = filteredPlayers.map(player => ({
      name: player.name,
      position: player.position,
      team: player.team,
      adp: player.adp,
      customRank: customRankings[player.id] || player.adp,
      pprProjection: player.ppr,
      standardProjection: player.standard,
      halfPprProjection: player.halfPpr,
      tier: player.tier,
      injury: player.injury,
      news: player.news,
      drafted: draftedPlayers.has(player.id)
    }));

    if (exportFormat === 'csv') {
      const csv = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(player => Object.values(player).join(','))
      ].join('\\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fantasy-draft-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fantasy-draft-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }
  }, [stableExportDependencies]);

  const exportDraftResults = useCallback(() => {
    const { filteredPlayers, draftedPlayers, players, draftSettings, customRankings } = stableExportDependencies;
    if (!filteredPlayers || filteredPlayers.length === 0) return;
    const draftSummary = {
      leagueInfo: draftSettings,
      draftDate: new Date().toISOString(),
      totalPicks: Array.from(draftedPlayers).length,
      myPicks: Array.from(draftedPlayers)
        .map(id => players.find(p => p.id === id))
        .filter(Boolean),
      availablePlayers: filteredPlayers
        .filter(p => !draftedPlayers.has(p.id))
        .slice(0, 20),
      customRankings: customRankings
    };

    const json = JSON.stringify(draftSummary, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `draft-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }, [stableExportDependencies]);

  // Draft simulation functions
  const initializeDraft = useCallback(() => {
    const order = DraftSimulationUtils.generateSnakeDraftOrder(draftSettings.totalTeams, draftSettings.rounds);
    setDraftOrder(order);
    setCurrentOverallPick(1);
    setCurrentPicker(DraftSimulationUtils.getCurrentPicker(1, order));
    setIsUserTurn(DraftSimulationUtils.isUserTurn(DraftSimulationUtils.getCurrentPicker(1, order), draftSettings.position));
    setDraftHistory([]);
    setDraftedPlayers(new Set());
  }, [draftSettings]);

  const logDraftPick = useCallback((player, teamId, overallPick) => {
    const pick = {
      id: Date.now(),
      player,
      teamId,
      overallPick,
      round: Math.ceil(overallPick / draftSettings.totalTeams),
      pickInRound: ((overallPick - 1) % draftSettings.totalTeams) + 1,
      timestamp: new Date(),
      team: teams.find(t => t.id === teamId)
    };
    
    setDraftHistory(prev => [...prev, pick]);
    setDraftedPlayers(prev => new Set([...prev, player.id]));
    
    return pick;
  }, [draftSettings.totalTeams, teams]);

  const processAIPick = useCallback(() => {
    if (!isDraftSimulationActive || isUserTurn) return;
    
    const availablePlayers = players.filter(p => !draftedPlayers.has(p.id));
    const currentTeam = teams.find(t => t.id === currentPicker);
    const currentRound = Math.ceil(currentOverallPick / draftSettings.totalTeams);
    
    if (availablePlayers.length === 0 || !currentTeam) return;
    
    const selectedPlayer = DraftSimulationUtils.calculateAIPick(
      availablePlayers, 
      currentTeam, 
      draftHistory, 
      currentRound, 
      scoringSystem
    );
    
    if (selectedPlayer) {
      logDraftPick(selectedPlayer, currentTeam.id, currentOverallPick);
      advanceDraftPick();
    }
  }, [isDraftSimulationActive, isUserTurn, players, draftedPlayers, teams, currentPicker, currentOverallPick, draftHistory, draftSettings.totalTeams, scoringSystem, logDraftPick]);

  const advanceDraftPick = useCallback(() => {
    const nextPick = currentOverallPick + 1;
    const maxPicks = draftSettings.totalTeams * draftSettings.rounds;
    
    if (nextPick > maxPicks) {
      // Draft complete
      setIsDraftSimulationActive(false);
      setIsTimerActive(false);
      return;
    }
    
    const nextTeamId = DraftSimulationUtils.getCurrentPicker(nextPick, draftOrder);
    const nextIsUserTurn = DraftSimulationUtils.isUserTurn(nextTeamId, draftSettings.position);
    
    setCurrentOverallPick(nextPick);
    setCurrentPicker(nextTeamId);
    setIsUserTurn(nextIsUserTurn);
    setCurrentRoundState(Math.ceil(nextPick / draftSettings.totalTeams));
    
    // Reset timer for next pick
    setDraftTimer(draftSettings.timePerPick);
    setTimerWarning(false);
    setShowTimerExpired(false);
  }, [currentOverallPick, draftSettings, draftOrder]);

  const makeUserPick = useCallback((playerId) => {
    if (!isUserTurn || !isDraftSimulationActive) return;
    
    const player = players.find(p => p.id === playerId);
    if (!player || draftedPlayers.has(playerId)) return;
    
    logDraftPick(player, draftSettings.position, currentOverallPick);
    advanceDraftPick();
  }, [isUserTurn, isDraftSimulationActive, players, draftedPlayers, draftSettings.position, currentOverallPick, logDraftPick, advanceDraftPick]);

  const startDraftSimulation = useCallback(() => {
    initializeDraft();
    setIsDraftSimulationActive(true);
    setIsTimerActive(true);
  }, [initializeDraft]);

  const pauseDraftTimer = useCallback(() => {
    setIsDraftSimulationActive(false);
    setIsTimerActive(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (simulationRef.current) clearTimeout(simulationRef.current);
  }, []);

  const resetDraftSimulation = useCallback(() => {
    pauseDraftTimer();
    setDraftHistory([]);
    setDraftedPlayers(new Set());
    setCurrentOverallPick(1);
    setCurrentPicker(1);
    setIsUserTurn(false);
    setCurrentRoundState(1);
    setDraftTimer(draftSettings.timePerPick);
    setTimerWarning(false);
    setShowTimerExpired(false);
  }, [pauseDraftTimer, draftSettings.timePerPick]);

  // AI simulation effect
  useEffect(() => {
    if (isDraftSimulationActive && !isUserTurn && currentOverallPick <= draftSettings.totalTeams * draftSettings.rounds) {
      simulationRef.current = setTimeout(() => {
        processAIPick();
      }, simulationSpeed);
    }
    
    return () => {
      if (simulationRef.current) clearTimeout(simulationRef.current);
    };
  }, [isDraftSimulationActive, isUserTurn, currentOverallPick, processAIPick, simulationSpeed, draftSettings]);

  // Initialize data
  useEffect(() => {
    setPlayers(MOCK_PLAYERS);
    setAiMessages([
      { id: 1, type: 'assistant', content: 'Welcome to your INJUSTICE LEAGUE draft assistant! I know your league uses Full PPR + Bonus scoring in a 12-team format. Your draft is Sunday, Aug 24 at 9:00 PM EDT (3 days away). Ready to prep for draft domination?' }
    ]);
    
    // Initialize draft order for snake draft
    const order = [];
    for (let round = 1; round <= draftSettings.rounds; round++) {
      for (let pick = 1; pick <= draftSettings.totalTeams; pick++) {
        const teamNumber = round % 2 === 1 ? pick : draftSettings.totalTeams - pick + 1;
        order.push({ round, pick, team: teamNumber });
      }
    }
    setDraftOrder(order);
  }, []);

  // Timer countdown effect
  useEffect(() => {
    let interval = null;
    
    if (isTimerActive && draftTimer > 0) {
      interval = setInterval(() => {
        setDraftTimer(timer => {
          const newTimer = timer - 1;
          
          // Warning at 10 seconds
          if (newTimer === 10) {
            setTimerWarning(true);
            playWarningSound();
          }
          
          // Timer expired
          if (newTimer === 0) {
            setTimerWarning(false);
            setShowTimerExpired(true);
            setIsTimerActive(false);
            playExpiredSound();
            
            // Auto-advance to next picker after 3 seconds
            setTimeout(() => {
              advanceToNextPicker();
              setShowTimerExpired(false);
            }, 3000);
          }
          
          return newTimer;
        });
      }, 1000);
    } else if (!isTimerActive) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isTimerActive, draftTimer]);

  // Audio alert functions
  const playWarningSound = () => {
    // Create audio context for warning beep
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  };

  const playExpiredSound = () => {
    // Create audio context for expired sound
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 400;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  // Timer control functions
  const startTimer = () => {
    setIsTimerActive(true);
    setTimerWarning(false);
    setShowTimerExpired(false);
  };

  const pauseTimer = () => {
    setIsTimerActive(false);
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    setDraftTimer(draftSettings.timePerPick);
    setTimerWarning(false);
    setShowTimerExpired(false);
  };

  const advanceToNextPicker = () => {
    const totalPicks = Array.from(draftedPlayers).length;
    const nextPickIndex = totalPicks;
    
    if (nextPickIndex < draftOrder.length) {
      const nextPick = draftOrder[nextPickIndex];
      setCurrentPicker(nextPick.team);
      setCurrentRoundState(nextPick.round);
      setDraftTimer(draftSettings.timePerPick);
      setTimerWarning(false);
      setShowTimerExpired(false);
    }
  };

  // Draft functionality
  const togglePlayerDrafted = useCallback((playerId) => {
    if (isDraftSimulationActive && isUserTurn) {
      // During simulation, use makeUserPick
      makeUserPick(playerId);
    } else if (!isDraftSimulationActive) {
      // Manual draft mode
      setDraftedPlayers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(playerId)) {
          newSet.delete(playerId);
        } else {
          newSet.add(playerId);
          // Auto-advance to next picker when a player is drafted
          if (isTimerActive) {
            setTimeout(() => {
              advanceToNextPicker();
            }, 1000); // Give 1 second delay for visual feedback
          }
        }
        return newSet;
      });
    }
  }, [isDraftSimulationActive, isUserTurn, makeUserPick, isTimerActive]);

  const resetDraft = useCallback(() => {
    if (isDraftSimulationActive) {
      resetDraftSimulation();
    } else {
      setDraftedPlayers(new Set());
      setCurrentPicker(1);
      setCurrentRoundState(1);
      setDraftTimer(draftSettings.timePerPick);
      setIsTimerActive(false);
      setTimerWarning(false);
      setShowTimerExpired(false);
    }
  }, [isDraftSimulationActive, resetDraftSimulation, draftSettings.timePerPick]);

  // Player comparison functionality
  const togglePlayerSelection = useCallback((playerId) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else if (newSet.size < 4) { // Limit to 4 players for comparison
        newSet.add(playerId);
      }
      return newSet;
    });
  }, []);

  const clearPlayerSelection = useCallback(() => {
    setSelectedPlayers(new Set());
  }, []);

  const openComparison = useCallback(() => {
    if (selectedPlayers.size >= 2) {
      setShowComparisonModal(true);
    }
  }, [selectedPlayers.size]);

  const exportComparison = useCallback(() => {
    const selectedPlayerData = players.filter(p => selectedPlayers.has(p.id));
    const csvData = [
      ['Name', 'Position', 'Team', 'ADP', 'PPR', 'Standard', 'Half PPR', 'Tier', 'Injury', 'News'],
      ...selectedPlayerData.map(p => [
        p.name, p.position, p.team, p.adp, p.ppr, p.standard, p.halfPpr, p.tier, p.injury, p.news
      ])
    ];
    
    const csvString = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'player_comparison.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [players, selectedPlayers]);

  // Memoized derived values to fix TDZ issues
  const currentRound = useMemo(() => 
    Math.floor(Array.from(draftedPlayers).length / draftSettings.totalTeams) + 1,
    [draftedPlayers, draftSettings.totalTeams]
  );

  const nextPick = useMemo(() => 
    filteredPlayers?.find(p => !draftedPlayers.has(p.id)),
    [filteredPlayers, draftedPlayers]
  );

  // Loading state guard
  if (isLoading || !players || players.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Legacy Fantasy Football Analyzer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Timer Expired Notification */}
      {showTimerExpired && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-pulse">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">TIME EXPIRED!</h2>
            <p className="text-gray-600 mb-4">
              Team {currentPicker}'s time is up. Advancing to next picker...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Auto-advancing in 3 seconds</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              🏈 INJUSTICE LEAGUE - Draft Analyzer
            </h1>
            <div className="flex items-center gap-6">
              {/* Timer Display */}
              <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border-2 transition-all ${
                showTimerExpired 
                  ? 'bg-red-100 border-red-500 animate-pulse' 
                  : timerWarning 
                    ? 'bg-yellow-100 border-yellow-500' 
                    : isTimerActive
                      ? 'bg-green-100 border-green-500'
                      : 'bg-gray-100 border-gray-300'
              }`}>
                <Clock className={`w-5 h-5 ${
                  showTimerExpired 
                    ? 'text-red-600' 
                    : timerWarning 
                      ? 'text-yellow-600' 
                      : isTimerActive
                        ? 'text-green-600'
                        : 'text-gray-600'
                }`} />
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    showTimerExpired 
                      ? 'text-red-600' 
                      : timerWarning 
                        ? 'text-yellow-600' 
                        : isTimerActive
                          ? 'text-green-600'
                          : 'text-gray-600'
                  }`}>
                    {showTimerExpired ? 'TIME!' : `${Math.floor(draftTimer / 60)}:${(draftTimer % 60).toString().padStart(2, '0')}`}
                  </div>
                  <div className="text-xs text-gray-600">
                    Team {currentPicker} • Round {currentRoundState}
                  </div>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={isTimerActive ? pauseTimer : startTimer}
                  className={`p-2 rounded-lg transition-colors ${
                    isTimerActive 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  title={isTimerActive ? 'Pause Timer' : 'Start Timer'}
                >
                  {isTimerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={resetTimer}
                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                
                <button
                  onClick={advanceToNextPicker}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  title="Next Picker"
                >
                  Next Pick
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <div className="font-semibold text-blue-600">SUNDAY AUG 24 • 9:00 PM EDT</div>
                <div className="text-xs">3 Days Away • 12 Teams • PPR + Bonuses</div>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Round {currentRound}</span> • 
                <span className="ml-1">{Array.from(draftedPlayers).length}/{draftSettings.totalTeams * draftSettings.rounds} Drafted</span>
                {isDraftSimulationActive && (
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      isUserTurn ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isUserTurn ? 'YOUR TURN' : `${teams.find(t => t.id === currentPicker)?.name.split(' ')[0]} picking`}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!isDraftSimulationActive && currentView === 'draft' && (
                  <button
                    onClick={startDraftSimulation}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Simulation
                  </button>
                )}
                
                <button
                  onClick={resetDraft}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reset Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'draft', name: 'Draft Board', icon: Users },
              { id: 'compare', name: 'Player Compare', icon: GitCompare },
              { id: 'rankings', name: 'Custom Rankings', icon: BarChart3 },
              { id: 'simulation', name: 'Draft Simulation', icon: Play },
              { id: 'live-data', name: 'Live Data', icon: Globe },
              { id: 'draft-tracker', name: 'Draft Tracker', icon: Eye },
              { id: 'enhanced-ai', name: 'Enhanced AI', icon: Brain }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    currentView === tab.id
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
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Draft Board Tab (Original) */}
        {currentView === 'draft' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Draft Board */}
            <div className="lg:col-span-2">
              {/* Controls */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
                      onChange={(e) => setPositionFilter(e.target.value)}
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
                      value={scoringSystem}
                      onChange={(e) => setScoringSystem(e.target.value)}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ppr">Full PPR</option>
                      <option value="halfPpr">Half PPR</option>
                      <option value="standard">Standard</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end flex-col gap-2">
                    <button
                      onClick={() => setIsCompareMode(!isCompareMode)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                        isCompareMode 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      Compare Mode
                    </button>
                    
                    {isCompareMode && selectedPlayers.size > 0 && (
                      <div className="flex gap-2">
                        <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                          {selectedPlayers.size}/4 selected
                        </div>
                        {selectedPlayers.size >= 2 && (
                          <button
                            onClick={openComparison}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Compare
                          </button>
                        )}
                      </div>
                    )}
                    
                    {!isCompareMode && (
                      <div className="text-sm space-y-1">
                        <div className={`font-medium ${isTimerActive ? 'text-green-600' : 'text-blue-600'}`}>
                          Current Turn: Team {currentPicker}
                        </div>
                        {nextPick && (
                          <div>
                            <div className="font-medium text-green-600">Suggested Pick:</div>
                            <div className="font-bold text-green-800">{nextPick.name}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Draft Board */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Player Rankings - {scoringSystem.toUpperCase()}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {isDraftSimulationActive && isUserTurn ? (
                      <span className="text-green-600 font-medium">YOUR TURN - Click a player to draft</span>
                    ) : isDraftSimulationActive ? (
                      <span className="text-blue-600">AI is drafting... Wait for your turn</span>
                    ) : isCompareMode ? 
                      'Select players with checkboxes to compare • Up to 4 players' :
                      'Click ○ to draft players • Click ✕ to undo • Toggle Compare Mode for player analysis'
                    }
                  </p>
                </div>
                
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredPlayers?.slice(0, 100).map((player) => {
                    const isDrafted = draftedPlayers.has(player.id);
                    const isRecommended = nextPick?.id === player.id;
                    const isSelected = selectedPlayers.has(player.id);
                    
                    return (
                      <div
                        key={player.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isDrafted ? 'bg-gray-100 opacity-60' : ''
                        } ${isRecommended ? 'bg-green-50 border-l-4 border-green-500' : ''} ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => isCompareMode ? togglePlayerSelection(player.id) : togglePlayerDrafted(player.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center">
                              {isCompareMode ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                              ) : isDrafted ? (
                                <X className="w-6 h-6 text-red-500 font-bold" />
                              ) : (
                                <div className="w-6 h-6 border-2 border-gray-400 rounded-full hover:border-blue-500" />
                              )}
                            </div>
                            
                            <div className={isDrafted ? 'line-through text-gray-500' : ''}>
                              <div className="font-semibold text-gray-900">
                                {player.name}
                                {isRecommended && (
                                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    RECOMMENDED
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {player.position} • {player.team} • ADP: {player.adp}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {player.news}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-bold text-lg text-blue-600">
                              {player[scoringSystem].toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">proj. pts/game</div>
                            <div className="flex items-center gap-1 mt-1">
                              {player.injury === 'Healthy' ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                              )}
                              <span className="text-xs text-gray-500">{player.injury}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Draft Stats */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Injustice League Info
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Roster:</span>
                    <span className="text-gray-600 ml-1">1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX, 1 K, 1 DEF</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Scoring:</span>
                    <span className="text-gray-600 ml-1">Full PPR + Big Play Bonuses</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Bench:</span>
                    <span className="text-gray-600 ml-1">9 spots + 2 Reserve</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {['QB', 'RB', 'WR', 'TE', 'DEF', 'K'].map(position => {
                    const draftedCount = Array.from(draftedPlayers)
                      .filter(id => players.find(p => p.id === id)?.position === position)
                      .length;
                    
                    return (
                      <div key={position} className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{position}</span>
                        <span className="text-gray-600">{draftedCount} drafted</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Data Integration Tab */}
        {currentView === 'live-data' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Live Data Integration
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <span>Browser MCP Ready</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{players.length}</div>
                  <div className="text-xs text-gray-600">Current Players</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-xs text-gray-600">Live Rankings</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-xs text-gray-600">ADP Updates</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-xs text-gray-600">Injury Updates</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900">Ready to collect live data</div>
                    <div className="text-sm text-gray-600">Expand from {players.length} to 200+ players</div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setIsUpdatingData(true);
                    setTimeout(() => setIsUpdatingData(false), 3000);
                  }}
                  disabled={isUpdatingData}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isUpdatingData
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isUpdatingData ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isUpdatingData ? 'Updating...' : 'Update All Data'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Draft Tracker Tab */}
        {currentView === 'draft-tracker' && (
          <div className="space-y-6">
            {/* Draft Timer Control Panel */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Draft Timer Control Panel
                </h3>
                <div className="flex items-center gap-2">
                  {isTimerActive ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-600">Timer Running</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-600">Timer Stopped</span>
                    </>
                  )}
                </div>
              </div>

              {/* Large Timer Display */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-lg mb-6 text-center">
                <div className={`text-8xl font-bold mb-4 ${
                  showTimerExpired 
                    ? 'text-red-600 animate-pulse' 
                    : timerWarning 
                      ? 'text-yellow-600' 
                      : isTimerActive
                        ? 'text-green-600'
                        : 'text-gray-600'
                }`}>
                  {showTimerExpired ? 'TIME!' : `${Math.floor(draftTimer / 60)}:${(draftTimer % 60).toString().padStart(2, '0')}`}
                </div>
                <div className="text-xl font-semibold text-gray-700 mb-2">
                  Team {currentPicker} • Round {currentRoundState}
                </div>
                <div className="text-sm text-gray-600">
                  Pick {Array.from(draftedPlayers).length + 1} of {draftSettings.totalTeams * draftSettings.rounds}
                </div>
              </div>

              {/* Timer Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <button
                  onClick={isTimerActive ? pauseTimer : startTimer}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isTimerActive 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isTimerActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isTimerActive ? 'Pause' : 'Start'}
                </button>
                
                <button
                  onClick={resetTimer}
                  className="py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
                
                <button
                  onClick={advanceToNextPicker}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Target className="w-5 h-5" />
                  Next Pick
                </button>

                <button
                  onClick={() => {
                    setTimerWarning(false);
                    playWarningSound();
                  }}
                  className="py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-5 h-5" />
                  Test Sound
                </button>
              </div>

              {/* Draft Progress */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Draft Progress</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{currentRoundState}</div>
                    <div className="text-sm text-gray-600">Current Round</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{Array.from(draftedPlayers).length}</div>
                    <div className="text-sm text-gray-600">Players Drafted</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{draftSettings.totalTeams * draftSettings.rounds - Array.from(draftedPlayers).length}</div>
                    <div className="text-sm text-gray-600">Picks Remaining</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Original Draft Tracking */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Live Draft Tracker
                </h3>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Ready</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg text-gray-900">SUNDAY, AUGUST 24 • 9:00 PM EDT</div>
                    <div className="text-sm text-gray-600">Injustice League Draft • {draftSettings.timePerPick} seconds per pick</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">3</div>
                    <div className="text-xs text-gray-600">Days Away</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsDraftTracking(!isDraftTracking)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      isDraftTracking
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isDraftTracking ? (
                      <>
                        <X className="w-4 h-4" />
                        Stop Tracking
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start Tracking
                      </>
                    )}
                  </button>

                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Connect to Draft Room
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <Camera className="w-4 h-4" />
                    Auto Screenshots
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Player Comparison Tab */}
        {currentView === 'compare' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <GitCompare className="w-5 h-5" />
                  Player Comparison Tool
                </h3>
                <div className="flex gap-2">
                  {selectedPlayers.size > 0 && (
                    <button
                      onClick={clearPlayerSelection}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Clear All
                    </button>
                  )}
                  {selectedPlayers.size >= 2 && (
                    <button
                      onClick={exportComparison}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  )}
                </div>
              </div>

              {selectedPlayers.size === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">No Players Selected</h4>
                  <p className="text-gray-500 mb-4">
                    Go to the Draft Board and enable "Compare Mode" to select players for comparison.
                  </p>
                  <button
                    onClick={() => setCurrentView('draft')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Go to Draft Board
                  </button>
                </div>
              ) : selectedPlayers.size === 1 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Select at least 2 players to compare</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Comparison View Tabs */}
                  <div className="border-b border-gray-200">
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
                            onClick={() => setComparisonView(tab.id)}
                            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                              comparisonView === tab.id
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
                  {comparisonView === 'stats' && <StatsComparisonView players={players.filter(p => selectedPlayers.has(p.id))} scoringSystem={scoringSystem} />}
                  {comparisonView === 'tiers' && <TierAnalysisView players={players.filter(p => selectedPlayers.has(p.id))} />}
                  {comparisonView === 'value' && <ValueADPView players={players.filter(p => selectedPlayers.has(p.id))} scoringSystem={scoringSystem} />}
                  {comparisonView === 'recommendations' && <RecommendationView players={players.filter(p => selectedPlayers.has(p.id))} scoringSystem={scoringSystem} />}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Draft Simulation Tab */}
        {currentView === 'simulation' && (
          <div className="space-y-6">
            {/* Simulation Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Draft Simulation Engine
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isDraftSimulationActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium">
                    {isDraftSimulationActive ? 'LIVE' : 'READY'}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Current Draft Status */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-900">Round {currentRoundState}</div>
                    <div className="text-sm text-gray-600">Pick {currentOverallPick} of {draftSettings.totalTeams * draftSettings.rounds}</div>
                  </div>
                  
                  {isDraftSimulationActive && (
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-1">
                        {isUserTurn ? 'YOUR PICK!' : `${teams.find(t => t.id === currentPicker)?.name} picking...`}
                      </div>
                      <div className={`text-sm ${isUserTurn ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                        {isUserTurn ? 'Select a player below' : 'AI is deciding...'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulation Controls */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {!isDraftSimulationActive ? (
                      <button
                        onClick={startDraftSimulation}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Start Simulation
                      </button>
                    ) : (
                      <button
                        onClick={pauseDraftTimer}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </button>
                    )}
                    
                    <button
                      onClick={resetDraftSimulation}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">AI Speed</label>
                    <select
                      value={simulationSpeed}
                      onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={500}>Very Fast (0.5s)</option>
                      <option value={1000}>Fast (1s)</option>
                      <option value={1500}>Normal (1.5s)</option>
                      <option value={2500}>Slow (2.5s)</option>
                      <option value={4000}>Very Slow (4s)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Draft Order & Teams */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Draft Order & Teams
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team, index) => {
                  const isCurrentPicker = isDraftSimulationActive && team.id === currentPicker;
                  const isUser = team.id === draftSettings.position;
                  const teamPicks = draftHistory.filter(pick => pick.teamId === team.id);
                  
                  return (
                    <div
                      key={team.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isCurrentPicker 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : isUser 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900">
                          {index + 1}. {team.name}
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                          {teamPicks.length} picks
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {team.owner} • {team.strategy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      
                      {teamPicks.length > 0 && (
                        <div className="text-xs text-gray-500">
                          Latest: {teamPicks[teamPicks.length - 1]?.player.name}
                        </div>
                      )}
                      
                      {isCurrentPicker && (
                        <div className="mt-2 text-xs font-medium text-blue-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          On the clock
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Picks */}
            {draftHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent Picks
                </h3>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {draftHistory.slice(-10).reverse().map((pick) => (
                    <div key={pick.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {pick.overallPick}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{pick.player.name}</div>
                          <div className="text-sm text-gray-600">
                            {pick.player.position} • {pick.team?.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        R{pick.round}.{pick.pickInRound}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Rankings Tab */}
        {currentView === 'rankings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Custom Player Rankings
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetCustomRankings}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    Reset Rankings
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4 inline mr-1" />
                    Export Data
                  </button>
                </div>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <Target className="w-4 h-4 inline mr-1" />
                  Drag and drop players to reorder your custom rankings. Your personal rankings will override default projections in the draft board.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg">
                <div className="p-3 border-b border-gray-200">
                  <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-gray-600 uppercase">
                    <div>Rank & Player</div>
                    <div className="text-center">Custom Rank</div>
                    <div className="text-center">Original ADP</div>
                    <div className="text-center">{scoringSystem.toUpperCase()} Proj</div>
                    <div className="text-center">Actions</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredPlayers?.slice(0, 50).map((player, index) => {
                    const customRank = customRankings[player.id];
                    const hasCustomRank = customRank !== undefined;
                    
                    return (
                      <div
                        key={player.id}
                        draggable
                        onDragStart={() => handleDragStart(player)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, player)}
                        className={`p-3 hover:bg-gray-100 cursor-move transition-colors ${
                          hasCustomRank ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                        } ${draggedPlayer?.id === player.id ? 'opacity-50' : ''}`}
                      >
                        <div className="grid grid-cols-5 gap-4 items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
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
                              onChange={(e) => updateCustomRanking(player.id, parseFloat(e.target.value) || undefined)}
                              placeholder={player.adp.toFixed(1)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
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
                          </div>
                          
                          <div className="text-center">
                            {hasCustomRank && (
                              <button
                                onClick={() => updateCustomRanking(player.id, undefined)}
                                className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {Object.keys(customRankings).length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-800">
                    <Award className="w-4 h-4 inline mr-1" />
                    You have {Object.keys(customRankings).length} custom rankings that will affect your draft board sorting.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Export Draft Data</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="csv">CSV (Excel/Sheets)</option>
                    <option value="json">JSON (Structured Data)</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      exportDraftData();
                      setShowExportModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Export Player Data
                  </button>
                  <button
                    onClick={() => {
                      exportDraftResults();
                      setShowExportModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Export Draft Results
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Player Data:</strong> All players with rankings, projections, and custom data</p>
                  <p><strong>Draft Results:</strong> Your picks, league settings, and current draft state</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced AI Tab */}
        {currentView === 'enhanced-ai' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Enhanced AI Assistant
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <button className="p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 text-sm">
                  <TrendingUp className="w-4 h-4 mb-1" />
                  Tier Analysis
                </button>
                
                <button className="p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200 text-sm">
                  <Target className="w-4 h-4 mb-1" />
                  PPR Specialists
                </button>
                
                <button className="p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200 text-sm">
                  <Shield className="w-4 h-4 mb-1" />
                  Scarcity Alert
                </button>
                
                <button className="p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 text-sm">
                  <Zap className="w-4 h-4 mb-1" />
                  Strategy Plan
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                <div className="p-3 rounded-lg bg-gray-100 text-gray-900 mr-6">
                  <div className="text-sm">Enhanced AI Assistant activated! I now provide advanced PPR analytics, tier-based strategy, positional scarcity analysis, and real-time draft adjustments for the Injustice League. Ready to dominate your draft!</div>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask for advanced draft analysis..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <GitCompare className="w-6 h-6" />
                Player Comparison
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={exportComparison}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-[80vh] overflow-y-auto">
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
                        onClick={() => setComparisonView(tab.id)}
                        className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                          comparisonView === tab.id
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
              {comparisonView === 'stats' && <StatsComparisonView players={players.filter(p => selectedPlayers.has(p.id))} scoringSystem={scoringSystem} />}
              {comparisonView === 'tiers' && <TierAnalysisView players={players.filter(p => selectedPlayers.has(p.id))} />}
              {comparisonView === 'value' && <ValueADPView players={players.filter(p => selectedPlayers.has(p.id))} scoringSystem={scoringSystem} />}
              {comparisonView === 'recommendations' && <RecommendationView players={players.filter(p => selectedPlayers.has(p.id))} scoringSystem={scoringSystem} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FantasyFootballAnalyzer;