import { useMemo } from 'react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { Player, Position, FilteredPlayersResult } from '@/types';

export function usePlayerFiltering() {
  const { state, dispatch } = useFantasyFootball();

  const filteredPlayers = useMemo((): FilteredPlayersResult => {
    let players = [...state.players];

    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      players = players.filter(player => 
        player.name.toLowerCase().includes(searchLower) ||
        player.team.toLowerCase().includes(searchLower) ||
        player.position.toLowerCase().includes(searchLower)
      );
    }

    // Apply position filter
    if (state.positionFilter !== 'ALL') {
      players = players.filter(player => player.position === state.positionFilter);
    }

    // Filter out drafted players in draft mode
    if (state.currentView === 'draft') {
      players = players.filter(player => !state.draftedPlayers.has(player.id));
    }

    // Apply custom rankings sort
    players.sort((a, b) => {
      const aCustomRank = state.customRankings[a.id];
      const bCustomRank = state.customRankings[b.id];
      
      // If both have custom rankings, sort by those
      if (aCustomRank !== undefined && bCustomRank !== undefined) {
        return aCustomRank - bCustomRank;
      }
      
      // If only one has custom ranking, prioritize it
      if (aCustomRank !== undefined) return -1;
      if (bCustomRank !== undefined) return 1;
      
      // Default sort by ADP
      return a.adp - b.adp;
    });

    // Calculate position counts
    const positionCounts = players.reduce((counts, player) => {
      counts[player.position] = (counts[player.position] || 0) + 1;
      return counts;
    }, {} as Record<Position, number>);

    return {
      players,
      totalCount: players.length,
      positionCounts,
    };
  }, [
    state.players,
    state.searchTerm,
    state.positionFilter,
    state.currentView,
    state.draftedPlayers,
    state.customRankings,
  ]);

  const setSearchTerm = (term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  };

  const setPositionFilter = (position: Position | 'ALL') => {
    dispatch({ type: 'SET_POSITION_FILTER', payload: position });
  };

  const clearFilters = () => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: '' });
    dispatch({ type: 'SET_POSITION_FILTER', payload: 'ALL' });
  };

  const getPlayersByPosition = (position: Position): Player[] => {
    return filteredPlayers.players.filter(player => player.position === position);
  };

  const getPlayersByTier = (tier: number): Player[] => {
    return filteredPlayers.players.filter(player => player.tier === tier);
  };

  const getTopPlayers = (count: number = 50): Player[] => {
    return filteredPlayers.players.slice(0, count);
  };

  const searchPlayers = (query: string): Player[] => {
    if (!query) return [];
    
    const searchLower = query.toLowerCase();
    return state.players.filter(player => 
      player.name.toLowerCase().includes(searchLower) ||
      player.team.toLowerCase().includes(searchLower) ||
      player.position.toLowerCase().includes(searchLower)
    );
  };

  return {
    // Filtered results
    ...filteredPlayers,
    filteredPlayers: filteredPlayers.players, // Add this for backward compatibility
    
    // Current filters
    searchTerm: state.searchTerm,
    positionFilter: state.positionFilter,
    
    // Actions
    setSearchTerm,
    setPositionFilter,
    clearFilters,
    
    // Utility functions
    getPlayersByPosition,
    getPlayersByTier,
    getTopPlayers,
    searchPlayers,
  };
}