import { useState, useEffect, useCallback } from 'react';
import { mcpIntegration } from '@/utils/mcpIntegration';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import type { Player } from '@/types';

export function useMCPIntegration() {
  const { state } = useFantasyFootball();
  const [isInitialized, setIsInitialized] = useState(false);
  const [healthStatus, setHealthStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize MCP services
  useEffect(() => {
    const initMCP = async () => {
      setIsLoading(true);
      try {
        const success = await mcpIntegration.initialize();
        setIsInitialized(success);
        
        if (success) {
          const health = await mcpIntegration.healthCheck();
          setHealthStatus(health);
        }
      } catch (error) {
        console.error('MCP initialization failed:', error);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initMCP();
  }, []);

  // Periodic health checks
  useEffect(() => {
    if (!isInitialized) return;

    const healthCheckInterval = setInterval(async () => {
      try {
        const health = await mcpIntegration.healthCheck();
        setHealthStatus(health);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [isInitialized]);

  // DeepSeek AI Analysis
  const analyzePlayerValue = useCallback(async (players: Player[]) => {
    if (!isInitialized || !healthStatus.deepseek) {
      return null;
    }

    try {
      setIsLoading(true);
      return await mcpIntegration.deepSeek.analyzePlayerValue(
        players,
        state.scoringSystem
      );
    } catch (error) {
      console.error('Player value analysis failed:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, healthStatus.deepseek, state.scoringSystem]);

  // Get draft recommendations
  const getDraftRecommendations = useCallback(async (
    availablePlayers: Player[],
    teamNeeds: any
  ) => {
    if (!isInitialized || !healthStatus.deepseek) {
      return null;
    }

    try {
      setIsLoading(true);
      return await mcpIntegration.deepSeek.getDraftRecommendations(
        availablePlayers,
        state.currentRoundState,
        state.draftSettings.position,
        teamNeeds
      );
    } catch (error) {
      console.error('Draft recommendations failed:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [
    isInitialized, 
    healthStatus.deepseek, 
    state.currentRoundState, 
    state.draftSettings.position
  ]);

  // Live data fetching
  const fetchLiveData = useCallback(async (source?: 'fantasypros' | 'espn' | 'sleeper') => {
    if (!isInitialized || !healthStatus.liveData) {
      return [];
    }

    try {
      setIsLoading(true);
      return await mcpIntegration.liveData.fetchPlayerData(source);
    } catch (error) {
      console.error('Live data fetch failed:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, healthStatus.liveData]);

  // Get injury reports
  const getInjuryReports = useCallback(async () => {
    if (!isInitialized || !healthStatus.liveData) {
      return [];
    }

    try {
      return await mcpIntegration.liveData.getInjuryReports();
    } catch (error) {
      console.error('Injury reports fetch failed:', error);
      return [];
    }
  }, [isInitialized, healthStatus.liveData]);

  // Session management
  const saveSession = useCallback(async () => {
    if (!isInitialized) return false;

    try {
      await mcpIntegration.session.saveSession({
        draftState: {
          currentView: state.currentView,
          scoringSystem: state.scoringSystem,
          currentRound: state.currentRoundState,
          draftedPlayers: Array.from(state.draftedPlayers),
          draftHistory: state.draftHistory
        },
        customRankings: state.customRankings,
        userPreferences: {
          positionFilter: state.positionFilter,
          searchTerm: state.searchTerm
        }
      });
      return true;
    } catch (error) {
      console.error('Session save failed:', error);
      return false;
    }
  }, [isInitialized, state]);

  const loadSession = useCallback(async () => {
    if (!isInitialized) return null;

    try {
      return await mcpIntegration.session.loadSession();
    } catch (error) {
      console.error('Session load failed:', error);
      return null;
    }
  }, [isInitialized]);

  // Development context capture
  const captureDecision = useCallback(async (
    decision: string,
    context: string,
    impact: string
  ) => {
    if (!isInitialized) return;

    try {
      await mcpIntegration.context.captureDecision(decision, context, impact);
    } catch (error) {
      console.error('Decision capture failed:', error);
    }
  }, [isInitialized]);

  const recordBreakthrough = useCallback(async (
    breakthrough: string,
    details: string
  ) => {
    if (!isInitialized) return;

    try {
      await mcpIntegration.context.recordBreakthrough(breakthrough, details);
    } catch (error) {
      console.error('Breakthrough record failed:', error);
    }
  }, [isInitialized]);

  // Auto-save session on state changes
  useEffect(() => {
    if (!isInitialized) return;

    const autoSaveTimeout = setTimeout(() => {
      saveSession();
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimeout);
  }, [state, isInitialized, saveSession]);

  return {
    // Status
    isInitialized,
    isLoading,
    healthStatus,
    
    // DeepSeek AI
    analyzePlayerValue,
    getDraftRecommendations,
    
    // Live Data
    fetchLiveData,
    getInjuryReports,
    
    // Session Management
    saveSession,
    loadSession,
    
    // Development Context
    captureDecision,
    recordBreakthrough,
    
    // Utilities
    refreshHealthStatus: () => mcpIntegration.healthCheck().then(setHealthStatus),
    reinitialize: () => mcpIntegration.initialize().then(setIsInitialized),
  };
}