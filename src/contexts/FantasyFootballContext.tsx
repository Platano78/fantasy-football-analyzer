import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { FantasyFootballState, FantasyFootballAction, Player, Team, DraftSettings } from '@/types';
// Import comprehensive mock data from extracted data module
import { MOCK_PLAYERS, MOCK_TEAMS } from '../utils/mcpProxy';

const initialDraftSettings: DraftSettings = {
  position: 6, 
  totalTeams: 12, 
  rounds: 17, 
  leagueName: "Injustice",
  draftTime: "Sunday, Aug 24, 2025 9:00pm EDT",
  timePerPick: 60
};

const initialState: FantasyFootballState = {
  // Core data
  players: MOCK_PLAYERS,
  teams: MOCK_TEAMS,
  draftSettings: initialDraftSettings,
  
  // UI state
  currentView: 'draft',
  scoringSystem: 'ppr',
  searchTerm: '',
  positionFilter: 'ALL',
  
  // Draft state
  draftedPlayers: new Set(),
  draftHistory: [],
  currentOverallPick: 1,
  currentRoundState: 1,
  currentPicker: 1,
  isUserTurn: false,
  isDraftSimulationActive: false,
  
  // Timer state
  draftTimer: 60,
  isTimerActive: false,
  timerWarning: false,
  showTimerExpired: false,
  
  // Comparison state
  isCompareMode: false,
  selectedPlayers: new Set(),
  showComparisonModal: false,
  comparisonView: 'stats',
  
  // Rankings state
  customRankings: {},
  draggedPlayer: null,
  
  // AI state
  aiMessages: [],
  aiInput: '',
  
  // Live data state
  isUpdatingData: false,
  isDraftTracking: false,
  
  // Export state
  exportFormat: 'csv',
  showExportModal: false,
  
  // Simulation state
  simulationSpeed: 1500,
  draftOrder: [],
};

function fantasyFootballReducer(state: FantasyFootballState, action: FantasyFootballAction): FantasyFootballState {
  switch (action.type) {
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    
    case 'SET_SCORING_SYSTEM':
      return { ...state, scoringSystem: action.payload };
    
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    
    case 'SET_POSITION_FILTER':
      return { ...state, positionFilter: action.payload };
    
    case 'DRAFT_PLAYER':
      const newDraftedPlayers = new Set(state.draftedPlayers);
      newDraftedPlayers.add(action.payload.playerId);
      
      const newDraftPick = {
        round: state.currentRoundState,
        pick: state.currentPicker,
        overallPick: state.currentOverallPick,
        teamId: action.payload.teamId,
        playerId: action.payload.playerId,
        timestamp: new Date(),
      };
      
      return {
        ...state,
        draftedPlayers: newDraftedPlayers,
        draftHistory: [...state.draftHistory, newDraftPick],
        currentOverallPick: state.currentOverallPick + 1,
      };
    
    case 'NEXT_PICK':
      const nextPicker = state.currentPicker === state.draftSettings.totalTeams ? 1 : state.currentPicker + 1;
      const nextRound = state.currentPicker === state.draftSettings.totalTeams ? state.currentRoundState + 1 : state.currentRoundState;
      const isUserTurn = nextPicker === state.draftSettings.position;
      
      return {
        ...state,
        currentPicker: nextPicker,
        currentRoundState: nextRound,
        isUserTurn,
        draftTimer: state.draftSettings.timePerPick,
      };
    
    case 'START_DRAFT_SIMULATION':
      return { ...state, isDraftSimulationActive: true };
    
    case 'STOP_DRAFT_SIMULATION':
      return { ...state, isDraftSimulationActive: false };
    
    case 'START_TIMER':
      return { ...state, isTimerActive: true };
    
    case 'STOP_TIMER':
      return { ...state, isTimerActive: false };
    
    case 'TICK_TIMER':
      const newTimer = Math.max(0, state.draftTimer - 1);
      const timerWarning = newTimer <= 15 && newTimer > 0;
      const showTimerExpired = newTimer === 0;
      
      return {
        ...state,
        draftTimer: newTimer,
        timerWarning,
        showTimerExpired,
      };
    
    case 'TOGGLE_COMPARE_MODE':
      return { 
        ...state, 
        isCompareMode: !state.isCompareMode,
        selectedPlayers: new Set(), // Clear selections when toggling
      };
    
    case 'SELECT_PLAYER':
      const newSelectedPlayers = new Set(state.selectedPlayers);
      newSelectedPlayers.add(action.payload);
      return { ...state, selectedPlayers: newSelectedPlayers };
    
    case 'DESELECT_PLAYER':
      if (typeof action.payload === 'number') {
        // For comparison mode - just deselect from selected players
        const updatedSelectedPlayers = new Set(state.selectedPlayers);
        updatedSelectedPlayers.delete(action.payload);
        return { ...state, selectedPlayers: updatedSelectedPlayers };
      } else {
        // For draft mode - remove from drafted players
        const newDraftedPlayers = new Set(state.draftedPlayers);
        newDraftedPlayers.delete(action.payload.playerId);
        return { ...state, draftedPlayers: newDraftedPlayers };
      }
    
    case 'CLEAR_SELECTED_PLAYERS':
      return { ...state, selectedPlayers: new Set() };
    
    case 'UPDATE_CUSTOM_RANKING':
      const newCustomRankings = { ...state.customRankings };
      if (action.payload.ranking === undefined) {
        delete newCustomRankings[action.payload.playerId];
      } else {
        newCustomRankings[action.payload.playerId] = action.payload.ranking;
      }
      return { ...state, customRankings: newCustomRankings };
    
    case 'SET_DRAGGED_PLAYER':
      return { ...state, draggedPlayer: action.payload };
    
    case 'ADD_AI_MESSAGE':
      return { ...state, aiMessages: [...state.aiMessages, action.payload] };
    
    case 'SET_AI_INPUT':
      return { ...state, aiInput: action.payload };
    
    case 'SET_UPDATING_DATA':
      return { ...state, isUpdatingData: action.payload };
    
    case 'SET_DRAFT_TRACKING':
      return { ...state, isDraftTracking: action.payload };
    
    case 'SET_EXPORT_FORMAT':
      return { ...state, exportFormat: action.payload };
    
    case 'TOGGLE_EXPORT_MODAL':
      return { ...state, showExportModal: !state.showExportModal };
    
    case 'SET_SIMULATION_SPEED':
      return { ...state, simulationSpeed: action.payload };
    
    case 'RESET_DRAFT':
      return {
        ...state,
        draftedPlayers: new Set(),
        draftHistory: [],
        currentOverallPick: 1,
        currentRoundState: 1,
        currentPicker: 1,
        isUserTurn: false,
        isDraftSimulationActive: false,
        draftTimer: state.draftSettings.timePerPick,
        isTimerActive: false,
        timerWarning: false,
        showTimerExpired: false,
      };
    
    default:
      return state;
  }
}

interface FantasyFootballContextType {
  state: FantasyFootballState;
  dispatch: React.Dispatch<FantasyFootballAction>;
}

const FantasyFootballContext = createContext<FantasyFootballContextType | undefined>(undefined);

export function FantasyFootballProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(fantasyFootballReducer, initialState);

  return (
    <FantasyFootballContext.Provider value={{ state, dispatch }}>
      {children}
    </FantasyFootballContext.Provider>
  );
}

export function useFantasyFootball() {
  const context = useContext(FantasyFootballContext);
  if (context === undefined) {
    throw new Error('useFantasyFootball must be used within a FantasyFootballProvider');
  }
  return context;
}