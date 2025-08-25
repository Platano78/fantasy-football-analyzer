/**
 * Draft Room Connection Utilities
 * 
 * This module provides utilities for connecting to various fantasy football
 * draft room platforms and extracting league information from URLs.
 */

import { DraftRoomProvider, DraftRoomConnection, ConnectionStatus } from '@/types';

/**
 * Extracts league ID from draft room URLs for different providers
 */
export function extractLeagueId(provider: DraftRoomProvider, url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    switch (provider) {
      case 'espn':
        return urlObj.searchParams.get('leagueId');
      
      case 'nfl':
        // NFL.com format: fantasy.nfl.com/league/{leagueId}/draftroom OR draftclient with leagueId param
        if (url.includes('draftclient') && urlObj.searchParams.has('leagueId')) {
          return urlObj.searchParams.get('leagueId');
        }
        const nflParts = urlObj.pathname.split('/');
        return nflParts[2] || null;
      
      case 'yahoo':
        // Yahoo format: football.fantasysports.yahoo.com/league/{leagueId}/draft
        const yahooParts = urlObj.pathname.split('/');
        return yahooParts[2] || null;
      
      case 'sleeper':
        // Sleeper format: sleeper.app/draft/{draftId}
        const sleeperParts = urlObj.pathname.split('/');
        return sleeperParts[2] || null;
      
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Validates if a URL is compatible with the specified provider
 */
export function validateDraftRoomUrl(provider: DraftRoomProvider, url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    switch (provider) {
      case 'espn':
        return hostname.includes('fantasy.espn.com') && url.includes('leagueId');
      
      case 'nfl':
        return hostname.includes('fantasy.nfl.com') && (url.includes('draftroom') || url.includes('draftclient'));
      
      case 'yahoo':
        return hostname.includes('fantasysports.yahoo.com') && url.includes('draft');
      
      case 'sleeper':
        return hostname.includes('sleeper.app') && url.includes('draft');
      
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Gets the display name for a provider
 */
export function getProviderDisplayName(provider: DraftRoomProvider): string {
  const names: Record<DraftRoomProvider, string> = {
    espn: 'ESPN Fantasy',
    nfl: 'NFL.com Fantasy',
    yahoo: 'Yahoo Fantasy',
    sleeper: 'Sleeper Fantasy'
  };
  
  return names[provider] || provider.toUpperCase();
}

/**
 * Gets example URL for a provider
 */
export function getProviderExampleUrl(provider: DraftRoomProvider): string {
  const examples: Record<DraftRoomProvider, string> = {
    espn: 'https://fantasy.espn.com/football/draft?leagueId=123456',
    nfl: 'https://fantasy.nfl.com/draftclient?leagueId=123456&teamId=1',
    yahoo: 'https://football.fantasysports.yahoo.com/league/123456/draft',
    sleeper: 'https://sleeper.app/draft/123456'
  };
  
  return examples[provider] || '';
}

/**
 * Creates a connection object with default values
 */
export function createDraftRoomConnection(
  provider: DraftRoomProvider,
  url: string,
  leagueId: string
): DraftRoomConnection {
  return {
    provider,
    url,
    leagueId,
    status: 'disconnected',
    lastSync: null,
    retryCount: 0
  };
}

/**
 * Simulates a connection attempt (in production, this would make actual API calls)
 */
export async function simulateConnection(connection: DraftRoomConnection): Promise<{
  success: boolean;
  error?: string;
}> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  // Simulate occasional connection failures
  if (Math.random() < 0.1) {
    return {
      success: false,
      error: `Failed to connect to ${getProviderDisplayName(connection.provider)} - please check your URL and try again`
    };
  }
  
  return { success: true };
}

/**
 * Simulates data synchronization (in production, this would fetch actual draft data)
 */
export async function simulateSync(connection: DraftRoomConnection): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  // Simulate sync delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
  
  // Simulate occasional sync failures
  if (Math.random() < 0.05) {
    return {
      success: false,
      error: 'Sync failed - draft room may be temporarily unavailable'
    };
  }
  
  // Mock draft room data
  const mockData = {
    currentPick: Math.floor(Math.random() * 10) + 1,
    currentRound: Math.floor(Math.random() * 3) + 1,
    isDraftActive: Math.random() > 0.7,
    recentPicks: [
      { player: 'Christian McCaffrey', team: 'Team 1', position: 'RB' },
      { player: 'Travis Kelce', team: 'Team 2', position: 'TE' },
      { player: 'Cooper Kupp', team: 'Team 3', position: 'WR' }
    ],
    timeRemaining: Math.floor(Math.random() * 90)
  };
  
  return {
    success: true,
    data: mockData
  };
}

/**
 * Gets status color class for UI display
 */
export function getConnectionStatusColor(status: ConnectionStatus): string {
  const colors: Record<ConnectionStatus, string> = {
    disconnected: 'text-gray-600 bg-gray-100',
    connecting: 'text-blue-600 bg-blue-100',
    connected: 'text-green-600 bg-green-100',
    syncing: 'text-purple-600 bg-purple-100',
    error: 'text-red-600 bg-red-100'
  };
  
  return colors[status] || colors.disconnected;
}

/**
 * Formats time since last sync for display
 */
export function formatTimeSince(date: Date | null): string {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  
  return date.toLocaleDateString();
}