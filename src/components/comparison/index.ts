/**
 * Comparison Components - Barrel exports for fantasy football player comparison features
 * 
 * This module exports all components related to player comparisons, statistical analysis,
 * and recommendation systems for fantasy football decision making.
 */

// Statistical comparison component for side-by-side player analysis
export { default as StatsComparisonView } from './StatsComparisonView';

// Tier analysis component (temporarily housed in ValueADPView file)
export { default as TierAnalysisView } from './ValueADPView';

// Value and ADP analysis component (will be separated from TierAnalysisView in future)
export { default as ValueADPView } from './ValueADPView';

// AI-driven recommendation component for draft decisions
export { default as RecommendationView } from './RecommendationView';

// Type exports for component props (to be added as components are refactored)
// TODO: Export individual component prop types when available
// export type { StatsComparisonViewProps } from './StatsComparisonView';
// export type { TierAnalysisViewProps, ValueADPViewProps } from './ValueADPView';
// export type { RecommendationViewProps } from './RecommendationView';