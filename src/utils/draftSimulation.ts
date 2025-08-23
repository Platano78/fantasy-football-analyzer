/**
 * Draft Simulation Utilities
 * 
 * This module provides comprehensive draft simulation functionality including:
 * - Snake draft order generation
 * - AI pick calculation based on team strategies
 * - Draft flow management utilities
 * 
 * All functions are pure and testable, designed for scalability and maintainability.
 */

import { Player, Team, DraftStrategy, ScoringSystem, Position } from '../types/index';

// ================================
// Type Definitions
// ================================

/**
 * Represents a single pick in the draft order
 */
export interface DraftOrderPick {
  /** The round number (1-based) */
  round: number;
  /** The pick within the round (1-based) */
  pick: number;
  /** The team making this pick */
  teamId: number;
  /** The overall pick number in the draft */
  overallPick: number;
}

/**
 * Represents a completed draft pick with player information
 */
export interface CompletedDraftPick extends DraftOrderPick {
  /** The selected player */
  player: Player;
  /** Timestamp when the pick was made */
  timestamp?: Date;
}

/**
 * Position counts for roster tracking
 */
export interface PositionCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  DEF: number;
  K: number;
}

/**
 * Parameters for AI pick calculation
 */
export interface AIPickCalculationParams {
  /** Available players to choose from */
  availablePlayers: Player[];
  /** The team making the pick */
  team: Team;
  /** History of all completed picks */
  draftHistory: CompletedDraftPick[];
  /** Current round number */
  currentRound: number;
  /** Scoring system for player evaluation */
  scoringSystem: ScoringSystem;
}

/**
 * Result of position need calculation
 */
export interface PositionNeedResult {
  /** The position with the highest need */
  position: Position;
  /** The numerical need value (positive = need, negative = surplus) */
  needValue: number;
}

// ================================
// Core Draft Simulation Functions
// ================================

/**
 * Generates a complete snake draft order for fantasy football
 * 
 * In a snake draft:
 * - Odd rounds go 1, 2, 3, ..., totalTeams
 * - Even rounds go totalTeams, totalTeams-1, ..., 2, 1
 * 
 * @param totalTeams - Number of teams in the league (default: 12)
 * @param rounds - Number of rounds in the draft (default: 17)
 * @returns Array of DraftOrderPick objects representing the complete draft order
 * 
 * @example
 * ```typescript
 * const draftOrder = generateSnakeDraftOrder(12, 16);
 * console.log(draftOrder[0]); // { round: 1, pick: 1, teamId: 1, overallPick: 1 }
 * console.log(draftOrder[12]); // { round: 2, pick: 1, teamId: 12, overallPick: 13 }
 * ```
 */
export function generateSnakeDraftOrder(
  totalTeams: number = 12,
  rounds: number = 17
): DraftOrderPick[] {
  if (totalTeams < 2 || totalTeams > 20) {
    throw new Error('Total teams must be between 2 and 20');
  }
  
  if (rounds < 1 || rounds > 25) {
    throw new Error('Rounds must be between 1 and 25');
  }

  const order: DraftOrderPick[] = [];
  
  for (let round = 1; round <= rounds; round++) {
    if (round % 2 === 1) {
      // Odd rounds: 1, 2, 3, ..., totalTeams
      for (let pick = 1; pick <= totalTeams; pick++) {
        order.push({
          round,
          pick,
          teamId: pick,
          overallPick: (round - 1) * totalTeams + pick
        });
      }
    } else {
      // Even rounds: totalTeams, totalTeams-1, ..., 2, 1
      for (let pick = totalTeams; pick >= 1; pick--) {
        order.push({
          round,
          pick: totalTeams - pick + 1,
          teamId: pick,
          overallPick: (round - 1) * totalTeams + (totalTeams - pick + 1)
        });
      }
    }
  }
  
  return order;
}

/**
 * Calculates the AI's pick selection based on team strategy, roster needs, and available players
 * 
 * This function implements sophisticated draft logic including:
 * - Position scarcity analysis
 * - Team strategy adherence
 * - Roster need evaluation
 * - Value-based drafting principles
 * 
 * @param params - Configuration object containing all necessary parameters
 * @returns The selected Player, or null if no suitable player is found
 * 
 * @throws Error if required parameters are missing or invalid
 * 
 * @example
 * ```typescript
 * const selectedPlayer = calculateAIPick({
 *   availablePlayers: [player1, player2, player3],
 *   team: myTeam,
 *   draftHistory: completedPicks,
 *   currentRound: 3,
 *   scoringSystem: 'ppr'
 * });
 * ```
 */
export function calculateAIPick(params: AIPickCalculationParams): Player | null {
  const { availablePlayers, team, draftHistory, currentRound, scoringSystem } = params;
  
  // Validate parameters
  if (!availablePlayers?.length) {
    throw new Error('Available players array cannot be empty');
  }
  
  if (!team || !team.strategy || !team.rosterNeeds) {
    throw new Error('Team must have a valid strategy and roster needs');
  }
  
  if (currentRound < 1) {
    throw new Error('Current round must be positive');
  }
  
  if (!['ppr', 'standard', 'halfPpr'].includes(scoringSystem)) {
    throw new Error('Invalid scoring system');
  }

  // Calculate current roster composition
  const teamRoster = draftHistory.filter(pick => pick.teamId === team.id);
  const positionCounts = calculatePositionCounts(teamRoster);

  // Filter players based on basic availability and strategy
  let candidates = filterAvailableCandidates(
    availablePlayers,
    team,
    positionCounts,
    currentRound
  );

  // If no candidates after filtering, fall back to any healthy players
  if (candidates.length === 0) {
    candidates = availablePlayers.filter(
      player => player && player.injury !== 'Out'
    );
  }

  // Apply team-specific strategy filters
  candidates = applyStrategyFilters(candidates, team.strategy, currentRound, positionCounts);

  // Final fallback to prevent empty candidate pool
  if (candidates.length === 0) {
    candidates = availablePlayers
      .filter(player => player && player.injury !== 'Out')
      .slice(0, 10);
  }

  // Sort candidates by value with randomization for realistic AI behavior
  const sortedCandidates = sortCandidatesByValue(candidates, scoringSystem);

  return sortedCandidates[0] || availablePlayers[0] || null;
}

/**
 * Determines the current team that should be making a pick
 * 
 * @param overallPick - The current overall pick number (1-based)
 * @param draftOrder - The complete draft order
 * @returns The team ID that should pick, or null if pick number is invalid
 * 
 * @example
 * ```typescript
 * const currentPicker = getCurrentPicker(13, draftOrder);
 * console.log(currentPicker); // Returns team ID for pick 13
 * ```
 */
export function getCurrentPicker(
  overallPick: number,
  draftOrder: DraftOrderPick[]
): number | null {
  if (overallPick < 1 || !draftOrder?.length) {
    return null;
  }

  const currentPick = draftOrder.find(pick => pick.overallPick === overallPick);
  return currentPick ? currentPick.teamId : null;
}

/**
 * Checks if it's currently the user's turn to pick
 * 
 * @param currentTeamId - The ID of the team currently picking
 * @param userTeamId - The ID of the user's team (default: 6)
 * @returns True if it's the user's turn, false otherwise
 * 
 * @example
 * ```typescript
 * const isMyTurn = isUserTurn(6, 6); // true
 * const notMyTurn = isUserTurn(3, 6); // false
 * ```
 */
export function isUserTurn(currentTeamId: number, userTeamId: number = 6): boolean {
  return currentTeamId === userTeamId;
}

/**
 * Calculates the greatest positional need for a team
 * 
 * @param team - The team to analyze
 * @param currentRoster - Array of completed picks for the team
 * @returns Object containing the position of greatest need and its value
 * 
 * @example
 * ```typescript
 * const need = getPositionNeed(team, teamRoster);
 * console.log(need); // { position: 'RB', needValue: 2 }
 * ```
 */
export function getPositionNeed(
  team: Team,
  currentRoster: CompletedDraftPick[]
): PositionNeedResult {
  const positionCounts = calculatePositionCounts(currentRoster);
  
  let maxNeed = -Infinity;
  let neededPosition: Position = 'QB';
  
  // Check each position for need (required - current)
  const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'];
  
  for (const position of positions) {
    const required = team.rosterNeeds[position] || 0;
    const current = positionCounts[position];
    const need = required - current;
    
    if (need > maxNeed) {
      maxNeed = need;
      neededPosition = position;
    }
  }
  
  return {
    position: neededPosition,
    needValue: maxNeed
  };
}

// ================================
// Helper Functions
// ================================

/**
 * Calculates position counts from a roster of completed picks
 */
function calculatePositionCounts(roster: CompletedDraftPick[]): PositionCounts {
  return roster.reduce((counts, pick) => {
    const position = pick.player.position;
    counts[position] = (counts[position] || 0) + 1;
    return counts;
  }, {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    DEF: 0,
    K: 0
  } as PositionCounts);
}

/**
 * Filters available players based on basic availability and roster needs
 */
function filterAvailableCandidates(
  availablePlayers: Player[],
  team: Team,
  positionCounts: PositionCounts,
  currentRound: number
): Player[] {
  return availablePlayers.filter(player => {
    // Basic availability check
    if (!player || player.injury === 'Out') {
      return false;
    }
    
    // Position scarcity logic - don't draft unneeded positions early
    const positionNeed = (team.rosterNeeds[player.position] || 0) - 
                        (positionCounts[player.position] || 0);
    
    if (positionNeed <= 0 && currentRound <= 10) {
      return false;
    }
    
    return true;
  });
}

/**
 * Applies team-specific strategy filters to candidate players
 */
function applyStrategyFilters(
  candidates: Player[],
  strategy: DraftStrategy,
  currentRound: number,
  positionCounts: PositionCounts
): Player[] {
  switch (strategy) {
    case 'value_based':
      return candidates.filter(player => player.adp <= currentRound * 1.2);
      
    case 'position_scarcity':
      if (currentRound <= 3) {
        return candidates.filter(player => 
          ['RB', 'WR', 'TE'].includes(player.position)
        );
      }
      break;
      
    case 'rb_zero':
      if (currentRound <= 6) {
        return candidates.filter(player => player.position !== 'RB');
      }
      break;
      
    case 'early_qb':
      if (currentRound <= 3 && !(positionCounts.QB > 0)) {
        return candidates.filter(player => player.position === 'QB');
      }
      break;
      
    case 'high_upside':
      return candidates.filter(player => 
        player.tier <= 2 || player.adp >= currentRound
      );
      
    case 'balanced':
    case 'user_controlled':
    case 'adp_based':
    case 'contrarian':
    case 'positional_runs':
    case 'analytics_based':
    case 'stars_and_scrubs':
    default:
      // No additional filtering for these strategies
      break;
  }
  
  return candidates;
}

/**
 * Sorts candidates by projected value with randomization for realistic AI behavior
 */
function sortCandidatesByValue(candidates: Player[], scoringSystem: ScoringSystem): Player[] {
  return candidates.sort((a, b) => {
    // Add randomization to make AI picks more realistic and less predictable
    const aValue = a[scoringSystem] + (Math.random() - 0.5) * 2;
    const bValue = b[scoringSystem] + (Math.random() - 0.5) * 2;
    return bValue - aValue;
  });
}

// ================================
// Draft Recommendation Functions
// ================================

/**
 * Generates draft recommendations for the user based on current situation
 * 
 * @param availablePlayers - Players available for drafting
 * @param userTeam - The user's team configuration
 * @param draftHistory - Complete draft history
 * @param currentRound - Current draft round
 * @param scoringSystem - League scoring system
 * @param recommendationCount - Number of recommendations to return (default: 5)
 * @returns Array of recommended players with reasoning
 */
export function generateRecommendations(
  availablePlayers: Player[],
  userTeam: Team,
  draftHistory: CompletedDraftPick[],
  currentRound: number,
  scoringSystem: ScoringSystem,
  recommendationCount: number = 5
): Array<{
  player: Player;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const userRoster = draftHistory.filter(pick => pick.teamId === userTeam.id);
  const positionCounts = calculatePositionCounts(userRoster);
  const positionNeed = getPositionNeed(userTeam, userRoster);
  
  // Filter to healthy, available players
  const candidates = availablePlayers.filter(player => 
    player && player.injury !== 'Out'
  );
  
  // Sort by projected points
  const sortedCandidates = candidates.sort((a, b) => 
    b[scoringSystem] - a[scoringSystem]
  );
  
  const recommendations = sortedCandidates
    .slice(0, recommendationCount * 2) // Get more candidates than needed
    .map(player => {
      const isPositionNeeded = positionNeed.position === player.position;
      const currentAtPosition = positionCounts[player.position];
      const neededAtPosition = userTeam.rosterNeeds[player.position] - currentAtPosition;
      
      let reasoning = '';
      let priority: 'high' | 'medium' | 'low' = 'medium';
      
      if (isPositionNeeded && neededAtPosition > 0) {
        reasoning = `Addresses your biggest need at ${player.position}. `;
        priority = 'high';
      } else if (neededAtPosition > 0) {
        reasoning = `Fills roster need at ${player.position}. `;
        priority = 'medium';
      } else {
        reasoning = `Best available player. `;
        priority = 'low';
      }
      
      // Add value-based reasoning
      if (player.adp > currentRound + 5) {
        reasoning += 'Potential value pick - ADP suggests later availability.';
      } else if (player.adp < currentRound - 5) {
        reasoning += 'May be reaching, but high upside.';
      } else {
        reasoning += 'Good ADP value for current round.';
      }
      
      return {
        player,
        reasoning: reasoning.trim(),
        priority
      };
    })
    .slice(0, recommendationCount);
  
  return recommendations;
}

/**
 * Gets information about the current draft picker
 * 
 * @param overallPick - Current overall pick number
 * @param draftOrder - Complete draft order
 * @param teams - Array of all teams
 * @returns Information about the current picker or null
 */
export function getDraftPicker(
  overallPick: number,
  draftOrder: DraftOrderPick[],
  teams: Team[]
): {
  team: Team;
  pick: DraftOrderPick;
  isUser: boolean;
} | null {
  const currentPick = draftOrder.find(pick => pick.overallPick === overallPick);
  if (!currentPick) {
    return null;
  }
  
  const team = teams.find(t => t.id === currentPick.teamId);
  if (!team) {
    return null;
  }
  
  return {
    team,
    pick: currentPick,
    isUser: team.strategy === 'user_controlled'
  };
}