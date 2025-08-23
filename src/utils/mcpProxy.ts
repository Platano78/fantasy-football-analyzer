/**
 * Mock Data for Fantasy Football Analyzer
 * 
 * NOTE: This file should be moved to src/data/mockData.ts in the future
 * Currently placed here temporarily due to file creation limitations
 * 
 * This module contains extracted mock data from LegacyFantasyFootballAnalyzer.tsx
 * providing comprehensive player and team data for draft simulation.
 */

import { Player, Team } from '../types/index';

/**
 * Mock player data for Fantasy Football Analyzer
 * 
 * Expanded player database for realistic draft simulation featuring:
 * - Multi-tier players across all positions (QB, RB, WR, TE, DEF, K)
 * - Complete scoring projections (PPR, Standard, Half-PPR)
 * - Real ADP (Average Draft Position) values
 * - Current injury status and news updates
 * - Tier classifications for strategy analysis
 */
export const MOCK_PLAYERS: Player[] = [
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

/**
 * Mock team data for Fantasy Football Analyzer
 * 
 * Diverse team configurations for draft simulation featuring:
 * - Varied draft strategies (value-based, position scarcity, balanced, etc.)
 * - Realistic team tendencies and behaviors
 * - Different roster construction preferences
 * - Strategic depth for AI simulation engine
 */
export const MOCK_TEAMS: Team[] = [
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