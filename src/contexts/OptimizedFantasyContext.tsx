/**
 * Optimized Fantasy Football Context Architecture
 * Splits monolithic context into focused, performance-optimized contexts
 */
import React, { createContext, useContext, useReducer, ReactNode, useMemo, useCallback } from 'react';
import { Player, Team, DraftSettings, DraftRoomState } from '@/types';

// ============================================================================
// DRAFT STATE CONTEXT - High frequency updates, isolated from UI state
// ============================================================================

interface DraftState {
  draftedPlayers: Set<number>;
  draftHistory: Array<{
    round: number;
    pick: number;
    overallPick: number;
    teamId: number;
    playerId: number;
    timestamp: Date;
  }>;
  currentOverallPick: number;
  currentRoundState: number;
  currentPicker: number;
  isUserTurn: boolean;
  isDraftSimulationActive: boolean;
  draftTimer: number;
  isTimerActive: boolean;
  timerWarning: boolean;
  showTimerExpired: boolean;
}

type DraftAction = 
  | { type: 'DRAFT_PLAYER'; payload: { playerId: number; teamId: number } }
  | { type: 'NEXT_PICK' }
  | { type: 'START_DRAFT_SIMULATION' }
  | { type: 'STOP_DRAFT_SIMULATION' }
  | { type: 'START_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'TICK_TIMER' }
  | { type: 'RESET_DRAFT' }
  | { type: 'BATCH_DRAFT_UPDATE'; payload: Partial<DraftState> };

const initialDraftState: DraftState = {
  draftedPlayers: new Set(),
  draftHistory: [],
  currentOverallPick: 1,
  currentRoundState: 1,
  currentPicker: 1,
  isUserTurn: false,
  isDraftSimulationActive: false,
  draftTimer: 60,
  isTimerActive: false,
  timerWarning: false,
  showTimerExpired: false,
};

// Optimized reducer with batched updates
function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'BATCH_DRAFT_UPDATE':
      return { ...state, ...action.payload };
      
    case 'DRAFT_PLAYER':
      // Batch multiple state updates for performance
      const newDraftedPlayers = new Set(state.draftedPlayers);
      newDraftedPlayers.add(action.payload.playerId);
      
      return {
        ...state,
        draftedPlayers: newDraftedPlayers,
        draftHistory: [...state.draftHistory, {
          round: state.currentRoundState,
          pick: state.currentPicker,
          overallPick: state.currentOverallPick,
          teamId: action.payload.teamId,
          playerId: action.payload.playerId,
          timestamp: new Date(),
        }],
        currentOverallPick: state.currentOverallPick + 1,
      };
    
    case 'TICK_TIMER':
      const newTimer = Math.max(0, state.draftTimer - 1);
      return {
        ...state,
        draftTimer: newTimer,
        timerWarning: newTimer <= 15 && newTimer > 0,
        showTimerExpired: newTimer === 0,
      };
    
    case 'RESET_DRAFT':
      return { ...initialDraftState };
    
    default:
      return state;
  }
}

const DraftContext = createContext<{
  state: DraftState;
  dispatch: React.Dispatch<DraftAction>;
  // Memoized selectors for performance
  isDraftActive: boolean;
  availablePlayersCount: number;
  userTeamSize: number;
} | undefined>(undefined);

// ============================================================================
// UI STATE CONTEXT - Low frequency updates, UI-focused state
// ============================================================================

interface UIState {
  currentView: string;
  scoringSystem: 'standard' | 'ppr' | 'half-ppr';
  searchTerm: string;
  positionFilter: string;
  isCompareMode: boolean;
  selectedPlayers: Set<number>;
  showComparisonModal: boolean;
  comparisonView: string;
  exportFormat: string;
  showExportModal: boolean;
}

type UIAction = 
  | { type: 'SET_CURRENT_VIEW'; payload: string }
  | { type: 'SET_SCORING_SYSTEM'; payload: 'standard' | 'ppr' | 'half-ppr' }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_POSITION_FILTER'; payload: string }
  | { type: 'TOGGLE_COMPARE_MODE' }
  | { type: 'SELECT_PLAYER'; payload: number }
  | { type: 'DESELECT_PLAYER'; payload: number }
  | { type: 'CLEAR_SELECTED_PLAYERS' }
  | { type: 'BATCH_UI_UPDATE'; payload: Partial<UIState> };

const initialUIState: UIState = {
  currentView: 'draft',
  scoringSystem: 'ppr',
  searchTerm: '',
  positionFilter: 'ALL',
  isCompareMode: false,
  selectedPlayers: new Set(),
  showComparisonModal: false,
  comparisonView: 'stats',
  exportFormat: 'csv',
  showExportModal: false,
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'BATCH_UI_UPDATE':
      return { ...state, ...action.payload };
      
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
      
    case 'TOGGLE_COMPARE_MODE':
      return { 
        ...state, 
        isCompareMode: !state.isCompareMode,
        selectedPlayers: new Set(), // Clear on toggle
      };
      
    case 'SELECT_PLAYER':
      const newSelected = new Set(state.selectedPlayers);
      newSelected.add(action.payload);
      return { ...state, selectedPlayers: newSelected };
      
    case 'DESELECT_PLAYER':
      const updatedSelected = new Set(state.selectedPlayers);
      updatedSelected.delete(action.payload);
      return { ...state, selectedPlayers: updatedSelected };
      
    default:
      return state;
  }
}

const UIContext = createContext<{
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
} | undefined>(undefined);

// ============================================================================
// DATA CONTEXT - Static/semi-static data with intelligent caching
// ============================================================================

interface DataState {
  players: Player[];
  teams: Team[];
  draftSettings: DraftSettings;
  customRankings: Record<number, number>;
  lastUpdated: number;
}

const DataContext = createContext<{
  players: Player[];
  teams: Team[];
  draftSettings: DraftSettings;
  customRankings: Record<number, number>;
  updatePlayers: (players: Player[]) => void;
  updateRanking: (playerId: number, ranking: number) => void;
} | undefined>(undefined);

// ============================================================================
// OPTIMIZED PROVIDERS WITH INTELLIGENT RE-RENDER PREVENTION
// ============================================================================

export function OptimizedFantasyProvider({ children }: { children: ReactNode }) {
  const [draftState, draftDispatch] = useReducer(draftReducer, initialDraftState);
  const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);
  const [dataState, setDataState] = React.useState<DataState>({
    players: [],
    teams: [],
    draftSettings: {
      position: 6,
      totalTeams: 12,
      rounds: 17,
      leagueName: "Injustice",
      draftTime: "Sunday, Aug 24, 2025 9:00pm EDT",
      timePerPick: 60
    },
    customRankings: {},
    lastUpdated: Date.now()
  });

  // Memoized draft context value to prevent unnecessary re-renders
  const draftContextValue = useMemo(() => ({
    state: draftState,
    dispatch: draftDispatch,
    // Performance-optimized selectors
    isDraftActive: draftState.isDraftSimulationActive,
    availablePlayersCount: dataState.players.length - draftState.draftedPlayers.size,
    userTeamSize: draftState.draftHistory.filter(pick => 
      pick.teamId === dataState.draftSettings.position
    ).length
  }), [draftState, dataState.players.length, dataState.draftSettings.position]);

  // Memoized UI context value
  const uiContextValue = useMemo(() => ({
    state: uiState,
    dispatch: uiDispatch,
  }), [uiState]);

  // Memoized data context with update functions
  const dataContextValue = useMemo(() => ({
    players: dataState.players,
    teams: dataState.teams,
    draftSettings: dataState.draftSettings,
    customRankings: dataState.customRankings,
    updatePlayers: useCallback((players: Player[]) => {
      setDataState(prev => ({ ...prev, players, lastUpdated: Date.now() }));
    }, []),
    updateRanking: useCallback((playerId: number, ranking: number) => {
      setDataState(prev => ({
        ...prev,
        customRankings: { ...prev.customRankings, [playerId]: ranking },
        lastUpdated: Date.now()
      }));
    }, [])
  }), [dataState]);

  return (
    <DataContext.Provider value={dataContextValue}>
      <DraftContext.Provider value={draftContextValue}>
        <UIContext.Provider value={uiContextValue}>
          {children}
        </UIContext.Provider>
      </DraftContext.Provider>
    </DataContext.Provider>
  );
}

// ============================================================================
// OPTIMIZED HOOKS WITH PERFORMANCE SELECTORS
// ============================================================================

export function useDraftState() {
  const context = useContext(DraftContext);
  if (context === undefined) {
    throw new Error('useDraftState must be used within OptimizedFantasyProvider');
  }
  return context;
}

export function useUIState() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within OptimizedFantasyProvider');
  }
  return context;
}

export function useDataState() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataState must be used within OptimizedFantasyProvider');
  }
  return context;
}

// Performance-optimized selectors to prevent unnecessary re-renders
export function useDraftSelector<T>(selector: (state: DraftState) => T): T {
  const { state } = useDraftState();
  return useMemo(() => selector(state), [selector, state]);
}

export function useUISelector<T>(selector: (state: UIState) => T): T {
  const { state } = useUIState();
  return useMemo(() => selector(state), [selector, state]);
}

// Batch update hooks for performance
export function useBatchedDraftUpdate() {
  const { dispatch } = useDraftState();
  return useCallback((updates: Partial<DraftState>) => {
    dispatch({ type: 'BATCH_DRAFT_UPDATE', payload: updates });
  }, [dispatch]);
}

export function useBatchedUIUpdate() {
  const { dispatch } = useUIState();
  return useCallback((updates: Partial<UIState>) => {
    dispatch({ type: 'BATCH_UI_UPDATE', payload: updates });
  }, [dispatch]);
}