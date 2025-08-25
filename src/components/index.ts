/**
 * Fantasy Football Analyzer - Component Library Main Entry Point
 * 
 * This module provides a centralized export point for all components in the application,
 * organized by feature domains and functionality. Enables clean imports throughout
 * the application with consistent patterns.
 */

// ===== CORE UTILITY COMPONENTS =====
// Error handling and application health monitoring
export { default as ErrorBoundary } from './ErrorBoundary';
export { HealthCheck } from './HealthCheck';

// Performance monitoring and draft controls
export { DraftProgressIndicator } from './DraftProgressIndicator';

// Legacy direct exports (to be organized into subdirectories)
export { default as DraftTimer } from './DraftTimer';
export { default as DraftBoardFilters } from './DraftBoardFilters';
export { default as PlayerComparisonModal } from './PlayerComparisonModal';
export { default as TeamDetailModal } from './TeamDetailModal';

// ===== ORGANIZED FEATURE COMPONENTS =====
// Re-export all comparison components
export * from './comparison';

// Re-export all draft components  
export * from './draft';

// Re-export all UI components
export * from './ui';

// ===== AI COMPONENTS =====
// AI backend status and hybrid coaching components
export { default as AIBackendStatus } from './ai/AIBackendStatus';

// ===== PERFORMANCE OPTIMIZATION COMPONENTS =====
// Lazy loading and code splitting utilities
export { LazyWrapper, withLazyLoading, createLazyComponent } from './LazyWrapper';
export { LoadingSpinner, SkeletonCard, TableSkeleton } from './LoadingSpinner';