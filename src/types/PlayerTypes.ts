// Player Types for Fantasy Football Analyzer

export interface Player {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
  team: string;
  projectedPoints: number;
  adp: number;
  tier: number;
  value: number;
  stats?: PlayerStats;
}

export interface PlayerStats {
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  fumbles?: number;
  targets?: number;
}

export type ScoringSystem = 'standard' | 'ppr' | 'half-ppr' | 'superflex';

export interface ComparisonData {
  players: Player[];
  scoringSystem: ScoringSystem;
  comparisonMetrics: ComparisonMetric[];
}

export interface ComparisonMetric {
  id: string;
  label: string;
  value: number;
  category: 'offense' | 'consistency' | 'value' | 'tier';
}

export type ComparisonViewType = 'stats' | 'tiers' | 'value' | 'recommendations';