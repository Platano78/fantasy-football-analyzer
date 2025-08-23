/**
 * UI Components - Barrel exports for reusable user interface components
 * 
 * This module exports all general-purpose UI components including modals, navigation,
 * tabs, and other interface elements used throughout the fantasy football application.
 */

// Navigation and tab management components
export { default as NavigationTabs } from './NavigationTabs';

// NavigationTabs component interfaces and exports
export type { 
  NavigationTabsProps,
  TabConfig
} from './NavigationTabs';

// Named component exports from NavigationTabs
export { 
  DRAFT_TAB_CONFIG,
  ANALYSIS_TAB_CONFIG,
  DEFAULT_TAB_CONFIG,
  createTabConfig
} from './NavigationTabs';

// Player comparison modal for detailed player analysis
export { default as PlayerComparisonModal } from './PlayerComparisonModal';
export type { 
  ComparisonViewType, 
  PlayerComparisonModalProps 
} from './PlayerComparisonModal';