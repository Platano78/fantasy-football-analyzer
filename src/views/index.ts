// Lazy-loaded views for optimal bundle splitting and performance
import { lazy } from 'react';

// Core views - loaded immediately
export { default as DraftView } from './DraftView';
export { default as ComparisonView } from './ComparisonView';
export { default as RankingsView } from './RankingsView';

// Heavy/complex views - lazy loaded for better performance
export const SimulationView = lazy(() => import('./SimulationView'));
export const LiveDataView = lazy(() => import('./LiveDataView'));
export const TrackerView = lazy(() => import('./TrackerView'));
export const AIView = lazy(() => import('./AIView'));
export const NewsView = lazy(() => import('./NewsView'));
export const AdvancedAnalyticsView = lazy(() => import('./AdvancedAnalyticsView'));
export const NFLLeagueSyncView = lazy(() => import('./NFLLeagueSyncView'));

// Legacy view - always lazy loaded
export const LegacyView = lazy(() => import('./LegacyFantasyFootballAnalyzer'));

// Preload functions for eager loading when needed
export const preloadViews = {
  simulation: () => import('./SimulationView'),
  liveData: () => import('./LiveDataView'), 
  tracker: () => import('./TrackerView'),
  ai: () => import('./AIView'),
  news: () => import('./NewsView'),
  analytics: () => import('./AdvancedAnalyticsView'),
  nflSync: () => import('./NFLLeagueSyncView'),
  legacy: () => import('./LegacyFantasyFootballAnalyzer')
};