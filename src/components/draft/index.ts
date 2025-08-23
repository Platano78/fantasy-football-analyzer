/**
 * Draft Components - Barrel exports for fantasy football draft management features
 * 
 * This module exports all components related to draft boards, timers, AI assistance,
 * and draft workflow management for fantasy football drafts.
 */

// Main draft board component for player selection and draft tracking
export { default as DraftBoard } from './DraftBoard';

// Draft timer component for managing draft clock and turn timing
export { default as DraftTimer } from './DraftTimer';

// AI chat assistant component for draft advice and recommendations
export { default as AIChat } from './AIChat';

// Draft status component for comprehensive draft tracking and progress
export { default as DraftStatus } from './DraftStatus';

// Named exports for AIChat interfaces and types
export type { 
  ChatMessage, 
  DraftContext, 
  AIChatProps 
} from './AIChat';

// Named exports for DraftStatus interfaces and types
export type {
  DraftStatusProps,
  TimerControlsProps,
  DraftProgressProps,
  RecentPicksProps,
  NextUpProps
} from './DraftStatus';

// Named exports for individual DraftStatus components
export {
  TimerDisplay,
  TimerControls,
  CurrentPickerCard,
  DraftProgress,
  RecentPicks,
  NextUp
} from './DraftStatus';

// TODO: Add type exports for other components when available
// export type { DraftBoardProps } from './DraftBoard';
// export type { DraftTimerProps } from './DraftTimer';