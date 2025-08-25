import { useMemo } from 'react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { Player } from '@/types';

/**
 * Basic draft data hook - replacement for useDraftSimulation
 * Provides essential draft state without simulation functionality
 */
export function useDraftData() {
  const { state } = useFantasyFootball();

  const availablePlayers = useMemo(() => {
    return state.players.filter(player => !state.draftedPlayers.has(player.id));
  }, [state.players, state.draftedPlayers]);

  const currentRound = useMemo(() => {
    const totalDrafted = state.draftedPlayers.size;
    return Math.floor(totalDrafted / 12) + 1; // Assuming 12 teams
  }, [state.draftedPlayers.size]);

  const currentPick = useMemo(() => {
    return state.draftedPlayers.size + 1;
  }, [state.draftedPlayers.size]);

  return {
    availablePlayers,
    currentRound,
    currentPick,
    // Simplified values for components that expect simulation data
    isDraftActive: false,
    isUserTurn: false,
    currentPicker: state.currentPicker,
    draftTimer: state.draftTimer,
    isTimerActive: state.isTimerActive,
    timerWarning: state.timerWarning,
    showTimerExpired: state.showTimerExpired,
    draftPlayer: () => {}, // No-op function
    startSimulation: () => {}, // No-op function
    stopSimulation: () => {}, // No-op function
    resetDraft: () => {}, // No-op function
  };
}