import { useCallback, useEffect, useRef } from 'react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { Player } from '@/types';

export function useDraftSimulation() {
  const { state, dispatch } = useFantasyFootball();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getAvailablePlayers = useCallback(() => {
    return state.players.filter(player => !state.draftedPlayers.has(player.id));
  }, [state.players, state.draftedPlayers]);

  const getCurrentTeam = useCallback(() => {
    return state.teams.find(team => team.id === state.currentPicker);
  }, [state.teams, state.currentPicker]);

  const simulateAIPick = useCallback(() => {
    const availablePlayers = getAvailablePlayers();
    const currentTeam = getCurrentTeam();
    
    if (availablePlayers.length === 0 || !currentTeam) return;

    // Simple AI logic: pick best available player by ADP with some strategy
    let bestPlayer: Player;
    
    if (currentTeam.strategy === 'value_based') {
      // Pick best value (lowest ADP)
      bestPlayer = availablePlayers.reduce((best, player) => 
        player.adp < best.adp ? player : best
      );
    } else if (currentTeam.strategy === 'rb_zero') {
      // Avoid RBs early
      const nonRBs = availablePlayers.filter(p => p.position !== 'RB');
      bestPlayer = nonRBs.length > 0 ? 
        nonRBs.reduce((best, player) => player.adp < best.adp ? player : best) :
        availablePlayers.reduce((best, player) => player.adp < best.adp ? player : best);
    } else {
      // Default: best available
      bestPlayer = availablePlayers.reduce((best, player) => 
        player.adp < best.adp ? player : best
      );
    }

    dispatch({ type: 'DRAFT_PLAYER', payload: { playerId: bestPlayer.id, teamId: currentTeam.id } });
    dispatch({ type: 'NEXT_PICK' });
  }, [getAvailablePlayers, getCurrentTeam, dispatch]);

  const startSimulation = useCallback(() => {
    dispatch({ type: 'START_DRAFT_SIMULATION' });
    dispatch({ type: 'START_TIMER' });
  }, [dispatch]);

  const stopSimulation = useCallback(() => {
    dispatch({ type: 'STOP_DRAFT_SIMULATION' });
    dispatch({ type: 'STOP_TIMER' });
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [dispatch]);

  const draftPlayer = useCallback((playerId: number) => {
    const currentTeam = getCurrentTeam();
    if (!currentTeam) return;

    dispatch({ type: 'DRAFT_PLAYER', payload: { playerId, teamId: currentTeam.id } });
    dispatch({ type: 'NEXT_PICK' });
  }, [getCurrentTeam, dispatch]);

  const resetDraft = useCallback(() => {
    stopSimulation();
    dispatch({ type: 'RESET_DRAFT' });
  }, [stopSimulation, dispatch]);

  // Auto-simulation effect
  useEffect(() => {
    if (state.isDraftSimulationActive && !state.isUserTurn) {
      intervalRef.current = setTimeout(() => {
        simulateAIPick();
      }, state.simulationSpeed);
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [state.isDraftSimulationActive, state.isUserTurn, state.simulationSpeed, simulateAIPick]);

  // Timer effect
  useEffect(() => {
    if (state.isTimerActive) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isTimerActive, dispatch]);

  // Auto-pick when timer expires
  useEffect(() => {
    if (state.showTimerExpired && state.isDraftSimulationActive) {
      if (state.isUserTurn) {
        // Auto-pick best available for user
        const availablePlayers = getAvailablePlayers();
        if (availablePlayers.length > 0) {
          const bestPlayer = availablePlayers.reduce((best, player) => 
            player.adp < best.adp ? player : best
          );
          draftPlayer(bestPlayer.id);
        }
      } else {
        simulateAIPick();
      }
    }
  }, [state.showTimerExpired, state.isDraftSimulationActive, state.isUserTurn, getAvailablePlayers, draftPlayer, simulateAIPick]);

  return {
    // State
    isDraftActive: state.isDraftSimulationActive,
    isUserTurn: state.isUserTurn,
    currentPicker: state.currentPicker,
    currentRound: state.currentRoundState,
    currentOverallPick: state.currentOverallPick,
    draftTimer: state.draftTimer,
    isTimerActive: state.isTimerActive,
    timerWarning: state.timerWarning,
    showTimerExpired: state.showTimerExpired,
    draftHistory: state.draftHistory,
    simulationSpeed: state.simulationSpeed,
    
    // Computed values
    availablePlayers: getAvailablePlayers(),
    currentTeam: getCurrentTeam(),
    
    // Actions
    startSimulation,
    stopSimulation,
    draftPlayer,
    resetDraft,
    simulateAIPick,
    
    // Speed control
    setSimulationSpeed: (speed: number) => dispatch({ type: 'SET_SIMULATION_SPEED', payload: speed }),
  };
}