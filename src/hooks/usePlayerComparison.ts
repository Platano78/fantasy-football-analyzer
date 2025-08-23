import { useCallback, useMemo } from 'react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { Player } from '@/types';

export function usePlayerComparison() {
  const { state, dispatch } = useFantasyFootball();

  const selectedPlayersList = useMemo(() => {
    return state.players.filter(player => state.selectedPlayers.has(player.id));
  }, [state.players, state.selectedPlayers]);

  const togglePlayer = useCallback((playerId: number) => {
    if (state.selectedPlayers.has(playerId)) {
      dispatch({ type: 'DESELECT_PLAYER', payload: playerId });
    } else {
      dispatch({ type: 'SELECT_PLAYER', payload: playerId });
    }
  }, [state.selectedPlayers, dispatch]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_PLAYERS' });
  }, [dispatch]);

  const toggleCompareMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_COMPARE_MODE' });
  }, [dispatch]);

  const openComparisonModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_EXPORT_MODAL' }); // Reuse for comparison modal
  }, [dispatch]);

  const compareStats = useMemo(() => {
    if (selectedPlayersList.length < 2) return null;

    const scoringField = state.scoringSystem as keyof Pick<Player, 'ppr' | 'standard' | 'halfPpr'>;
    
    return selectedPlayersList.map(player => ({
      ...player,
      projectedPoints: player[scoringField],
      adpValue: player.adp,
      tier: player.tier,
    })).sort((a, b) => b.projectedPoints - a.projectedPoints);
  }, [selectedPlayersList, state.scoringSystem]);

  const getComparisonSummary = useMemo(() => {
    if (!compareStats || compareStats.length < 2) return null;

    const [best] = compareStats;
    const avgADP = compareStats.reduce((sum, p) => sum + p.adp, 0) / compareStats.length;
    const avgPoints = compareStats.reduce((sum, p) => sum + p.projectedPoints, 0) / compareStats.length;
    
    return {
      bestPlayer: best,
      averageADP: avgADP,
      averagePoints: avgPoints,
      pointsSpread: best.projectedPoints - compareStats[compareStats.length - 1].projectedPoints,
      adpSpread: Math.max(...compareStats.map(p => p.adp)) - Math.min(...compareStats.map(p => p.adp)),
    };
  }, [compareStats]);

  const getPositionalComparison = useMemo(() => {
    if (!selectedPlayersList.length) return {};

    return selectedPlayersList.reduce((acc, player) => {
      if (!acc[player.position]) {
        acc[player.position] = [];
      }
      acc[player.position].push(player);
      return acc;
    }, {} as Record<string, Player[]>);
  }, [selectedPlayersList]);

  const exportComparison = useCallback(() => {
    if (!compareStats) return;

    const csvData = [
      ['Name', 'Position', 'Team', 'ADP', 'PPR', 'Standard', 'Half PPR', 'Tier', 'News'],
      ...compareStats.map(player => [
        player.name,
        player.position,
        player.team,
        player.adp.toString(),
        player.ppr.toString(),
        player.standard.toString(),
        player.halfPpr.toString(),
        player.tier.toString(),
        player.news,
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `player-comparison-${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [compareStats]);

  return {
    // State
    isCompareMode: state.isCompareMode,
    selectedPlayers: state.selectedPlayers,
    selectedPlayersList,
    comparisonView: state.comparisonView,
    
    // Computed data
    compareStats,
    comparisonSummary: getComparisonSummary,
    positionalComparison: getPositionalComparison,
    canCompare: selectedPlayersList.length >= 2,
    maxSelections: selectedPlayersList.length >= 6, // Limit to 6 for UI purposes
    
    // Actions
    togglePlayer,
    clearSelection,
    toggleCompareMode,
    openComparisonModal,
    exportComparison,
  };
}