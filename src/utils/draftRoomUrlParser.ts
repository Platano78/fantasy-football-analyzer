/**
 * Draft Room URL Parser and Validator
 * 
 * Comprehensive utility for parsing and validating fantasy football
 * draft room URLs from multiple platforms. Supports URL normalization,
 * parameter extraction, and platform detection with robust error handling.
 */

import {
  DraftPlatform,
  DraftRoomURL,
  PlatformURLConfig,
  isDraftPlatform,
  PLATFORM_URL_PATTERNS
} from '../types/DraftRoomTypes';

// ========================================
// PLATFORM URL CONFIGURATIONS
// ========================================

/**
 * Comprehensive platform URL configurations with extractors and validators
 */
export const PLATFORM_CONFIGS: Record<DraftPlatform, PlatformURLConfig> = {
  espn: {
    platform: 'espn',
    baseUrl: 'https://fantasy.espn.com',
    urlPatterns: [
      /https?:\/\/fantasy\.espn\.com\/football\/league\?leagueId=(\d+)(?:&seasonId=(\d+))?/i,
      /https?:\/\/fantasy\.espn\.com\/football\/draft\?leagueId=(\d+)(?:&seasonId=(\d+))?/i,
      /https?:\/\/fantasy\.espn\.com\/football\/league\/settings\?leagueId=(\d+)/i
    ],
    requiredParams: ['leagueId'],
    optionalParams: ['seasonId', 'teamId', 'scoringPeriodId'],
    extractors: {
      leagueId: (url: string) => {
        const match = url.match(/leagueId=(\d+)/i);
        return match ? match[1] : null;
      },
      seasonYear: (url: string) => {
        const match = url.match(/seasonId=(\d{4})/i);
        return match ? parseInt(match[1], 10) : new Date().getFullYear();
      },
      draftId: (url: string) => {
        const match = url.match(/draftTeamId=(\d+)/i);
        return match ? match[1] : null;
      }
    },
    validators: {
      leagueId: (id: string) => /^\d{6,8}$/.test(id),
      seasonYear: (year: number) => year >= 2010 && year <= new Date().getFullYear() + 1
    }
  },

  nfl: {
    platform: 'nfl',
    baseUrl: 'https://fantasy.nfl.com',
    urlPatterns: [
      /https?:\/\/fantasy\.nfl\.com\/league\/(\d+)(?:\/(\d+))?/i,
      /https?:\/\/fantasy\.nfl\.com\/draft\/(\d+)/i,
      /https?:\/\/fantasy\.nfl\.com\/league\/(\d+)\/team\/(\d+)/i
    ],
    requiredParams: ['leagueId'],
    optionalParams: ['teamId', 'week'],
    extractors: {
      leagueId: (url: string) => {
        const match = url.match(/\/league\/(\d+)/i);
        return match ? match[1] : null;
      },
      seasonYear: (url: string) => {
        // NFL.com typically uses current year, may be in path or query
        const match = url.match(/\/(\d{4})\//);
        return match ? parseInt(match[1], 10) : new Date().getFullYear();
      },
      draftId: (url: string) => {
        const match = url.match(/\/draft\/(\d+)/i);
        return match ? match[1] : null;
      }
    },
    validators: {
      leagueId: (id: string) => /^\d{6,10}$/.test(id),
      seasonYear: (year: number) => year >= 2010 && year <= new Date().getFullYear() + 1
    }
  },

  yahoo: {
    platform: 'yahoo',
    baseUrl: 'https://football.fantasysports.yahoo.com',
    urlPatterns: [
      /https?:\/\/football\.fantasysports\.yahoo\.com\/f1\/(\d+)/i,
      /https?:\/\/football\.fantasysports\.yahoo\.com\/league\/([a-zA-Z0-9_-]+)/i,
      /https?:\/\/sports\.yahoo\.com\/fantasy\/football\/(\d+)/i
    ],
    requiredParams: ['leagueId'],
    optionalParams: ['teamKey', 'week'],
    extractors: {
      leagueId: (url: string) => {
        const patterns = [
          /\/f1\/(\d+)/i,
          /\/league\/([a-zA-Z0-9_-]+)/i,
          /football\/(\d+)/i
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      },
      seasonYear: (url: string) => {
        const match = url.match(/season=(\d{4})/i);
        return match ? parseInt(match[1], 10) : new Date().getFullYear();
      }
    },
    validators: {
      leagueId: (id: string) => /^[a-zA-Z0-9_-]{4,20}$/.test(id),
      seasonYear: (year: number) => year >= 2010 && year <= new Date().getFullYear() + 1
    }
  },

  sleeper: {
    platform: 'sleeper',
    baseUrl: 'https://sleeper.app',
    urlPatterns: [
      /https?:\/\/sleeper\.app\/leagues\/([a-zA-Z0-9]+)(?:\/(\d+))?/i,
      /https?:\/\/sleeper\.app\/draft\/([a-zA-Z0-9]+)/i,
      /https?:\/\/sleeper\.com\/leagues\/([a-zA-Z0-9]+)/i
    ],
    requiredParams: ['leagueId'],
    optionalParams: ['season', 'week'],
    extractors: {
      leagueId: (url: string) => {
        const patterns = [
          /\/leagues\/([a-zA-Z0-9]+)/i,
          /\/draft\/([a-zA-Z0-9]+)/i
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      },
      seasonYear: (url: string) => {
        const match = url.match(/\/(\d{4})/);
        return match ? parseInt(match[1], 10) : new Date().getFullYear();
      },
      draftId: (url: string) => {
        const match = url.match(/\/draft\/([a-zA-Z0-9]+)/i);
        return match ? match[1] : null;
      }
    },
    validators: {
      leagueId: (id: string) => /^[a-zA-Z0-9]{10,20}$/.test(id),
      seasonYear: (year: number) => year >= 2017 && year <= new Date().getFullYear() + 1
    }
  },

  cbs: {
    platform: 'cbs',
    baseUrl: 'https://www.cbssports.com/fantasy/football',
    urlPatterns: [
      /https?:\/\/(?:www\.)?cbssports\.com\/fantasy\/football\/leagues\/(\d+)/i,
      /https?:\/\/(?:www\.)?cbssports\.com\/fantasy\/football\/draft\/(\d+)/i
    ],
    requiredParams: ['leagueId'],
    optionalParams: ['teamId'],
    extractors: {
      leagueId: (url: string) => {
        const match = url.match(/\/leagues\/(\d+)/i);
        return match ? match[1] : null;
      },
      seasonYear: (url: string) => {
        const match = url.match(/season\/(\d{4})/i);
        return match ? parseInt(match[1], 10) : new Date().getFullYear();
      },
      draftId: (url: string) => {
        const match = url.match(/\/draft\/(\d+)/i);
        return match ? match[1] : null;
      }
    },
    validators: {
      leagueId: (id: string) => /^\d{6,10}$/.test(id),
      seasonYear: (year: number) => year >= 2010 && year <= new Date().getFullYear() + 1
    }
  },

  fleaflicker: {
    platform: 'fleaflicker',
    baseUrl: 'https://www.fleaflicker.com',
    urlPatterns: [
      /https?:\/\/(?:www\.)?fleaflicker\.com\/nfl\/leagues\/(\d+)/i,
      /https?:\/\/(?:www\.)?fleaflicker\.com\/nfl\/leagues\/(\d+)\/drafts\/(\d+)/i
    ],
    requiredParams: ['leagueId'],
    optionalParams: ['draftId', 'season'],
    extractors: {
      leagueId: (url: string) => {
        const match = url.match(/\/leagues\/(\d+)/i);
        return match ? match[1] : null;
      },
      seasonYear: (url: string) => {
        const match = url.match(/season=(\d{4})/i);
        return match ? parseInt(match[1], 10) : new Date().getFullYear();
      },
      draftId: (url: string) => {
        const match = url.match(/\/drafts\/(\d+)/i);
        return match ? match[1] : null;
      }
    },
    validators: {
      leagueId: (id: string) => /^\d{4,8}$/.test(id),
      seasonYear: (year: number) => year >= 2010 && year <= new Date().getFullYear() + 1
    }
  }
};

// ========================================
// URL PARSING FUNCTIONS
// ========================================

/**
 * Auto-detect platform from URL
 */
export function detectPlatform(url: string): DraftPlatform | null {
  const normalizedUrl = url.toLowerCase();
  
  if (normalizedUrl.includes('fantasy.espn.com')) return 'espn';
  if (normalizedUrl.includes('fantasy.nfl.com')) return 'nfl';
  if (normalizedUrl.includes('fantasysports.yahoo.com') || normalizedUrl.includes('sports.yahoo.com/fantasy')) return 'yahoo';
  if (normalizedUrl.includes('sleeper.app') || normalizedUrl.includes('sleeper.com')) return 'sleeper';
  if (normalizedUrl.includes('cbssports.com/fantasy')) return 'cbs';
  if (normalizedUrl.includes('fleaflicker.com')) return 'fleaflicker';
  
  return null;
}

/**
 * Parse URL with automatic platform detection
 */
export function parseURL(url: string, expectedPlatform?: DraftPlatform): DraftRoomURL {
  const detectedPlatform = expectedPlatform || detectPlatform(url);
  
  if (!detectedPlatform) {
    return {
      platform: 'espn', // fallback
      leagueId: '',
      seasonYear: new Date().getFullYear(),
      originalUrl: url,
      normalizedUrl: url,
      isValid: false,
      validationErrors: ['Unable to detect platform from URL'],
      platformParams: {},
      metadata: {}
    };
  }

  return parsePlatformURL(url, detectedPlatform);
}

/**
 * Parse URL for specific platform
 */
export function parsePlatformURL(url: string, platform: DraftPlatform): DraftRoomURL {
  const config = PLATFORM_CONFIGS[platform];
  const normalizedUrl = normalizeURL(url);
  const result: DraftRoomURL = {
    platform,
    leagueId: '',
    seasonYear: new Date().getFullYear(),
    originalUrl: url,
    normalizedUrl,
    isValid: false,
    validationErrors: [],
    platformParams: {},
    metadata: {}
  };

  try {
    // Test URL against platform patterns
    let patternMatched = false;
    for (const pattern of config.urlPatterns) {
      if (pattern.test(normalizedUrl)) {
        patternMatched = true;
        break;
      }
    }

    if (!patternMatched) {
      result.validationErrors.push(`URL does not match ${platform} patterns`);
      return result;
    }

    // Extract required parameters
    const leagueId = config.extractors.leagueId(normalizedUrl);
    if (!leagueId) {
      result.validationErrors.push('League ID not found in URL');
      return result;
    }

    const seasonYear = config.extractors.seasonYear(normalizedUrl);
    const draftId = config.extractors.draftId?.(normalizedUrl);

    // Validate extracted data
    if (!config.validators.leagueId(leagueId)) {
      result.validationErrors.push('Invalid league ID format');
    }

    if (seasonYear && !config.validators.seasonYear(seasonYear)) {
      result.validationErrors.push('Invalid season year');
    }

    // Extract platform-specific parameters
    const platformParams = extractPlatformParams(normalizedUrl, platform);

    // Extract metadata
    const metadata = extractMetadata(normalizedUrl, platform, leagueId);

    // Build result
    result.leagueId = leagueId;
    result.seasonYear = seasonYear || new Date().getFullYear();
    result.draftId = draftId || undefined;
    result.platformParams = platformParams;
    result.metadata = metadata;
    result.isValid = result.validationErrors.length === 0;

    return result;

  } catch (error) {
    result.validationErrors.push(`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Normalize URL for consistent parsing
 */
export function normalizeURL(url: string): string {
  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    
    // Normalize domain
    urlObj.hostname = urlObj.hostname.toLowerCase();
    
    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'referrer'];
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    // Sort query parameters for consistency
    urlObj.searchParams.sort();

    // Remove trailing slash from pathname
    if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }

    return urlObj.toString();
  } catch (error) {
    // Return original URL if normalization fails
    return url;
  }
}

/**
 * Extract platform-specific parameters from URL
 */
function extractPlatformParams(url: string, platform: DraftPlatform): Record<string, string> {
  const params: Record<string, string> = {};
  
  try {
    const urlObj = new URL(url);
    
    switch (platform) {
      case 'espn':
        // ESPN-specific parameters
        ['seasonId', 'teamId', 'scoringPeriodId', 'view'].forEach(param => {
          const value = urlObj.searchParams.get(param);
          if (value) params[param] = value;
        });
        break;
        
      case 'yahoo':
        // Yahoo-specific parameters
        ['teamkey', 'week', 'stat_cat'].forEach(param => {
          const value = urlObj.searchParams.get(param);
          if (value) params[param] = value;
        });
        break;
        
      case 'sleeper':
        // Sleeper-specific parameters (mostly in path)
        const pathMatch = url.match(/\/leagues\/[^\/]+\/(\d+)/);
        if (pathMatch) params.season = pathMatch[1];
        break;
        
      case 'nfl':
        // NFL.com parameters
        ['week', 'teamId'].forEach(param => {
          const value = urlObj.searchParams.get(param);
          if (value) params[param] = value;
        });
        break;
        
      case 'cbs':
        // CBS parameters
        ['teamId', 'period'].forEach(param => {
          const value = urlObj.searchParams.get(param);
          if (value) params[param] = value;
        });
        break;
        
      case 'fleaflicker':
        // Fleaflicker parameters
        ['season', 'scoringSystem'].forEach(param => {
          const value = urlObj.searchParams.get(param);
          if (value) params[param] = value;
        });
        break;
    }
  } catch (error) {
    console.warn('Failed to extract platform parameters:', error);
  }
  
  return params;
}

/**
 * Extract metadata from URL and make educated guesses about league info
 */
function extractMetadata(url: string, platform: DraftPlatform, leagueId: string): DraftRoomURL['metadata'] {
  const metadata: DraftRoomURL['metadata'] = {};
  
  try {
    // Determine if this is a live draft URL
    metadata.isLive = url.includes('/draft') || url.includes('draft');
    
    // Try to guess draft type from URL patterns
    if (url.includes('auction')) {
      metadata.draftType = 'auction';
    } else if (url.includes('snake') || url.includes('serpentine')) {
      metadata.draftType = 'snake';
    } else if (url.includes('linear') || url.includes('straight')) {
      metadata.draftType = 'linear';
    }
    
    // Platform-specific metadata extraction
    switch (platform) {
      case 'espn':
        // ESPN leagues often have predictable team counts
        if (leagueId.length >= 7) {
          // Larger league IDs often indicate newer, potentially larger leagues
          metadata.teamCount = 12;
        } else {
          metadata.teamCount = 10;
        }
        break;
        
      case 'sleeper':
        // Sleeper is newer platform, often has more teams
        metadata.teamCount = 12;
        break;
        
      case 'yahoo':
      case 'nfl':
      case 'cbs':
      case 'fleaflicker':
        // Standard team counts for these platforms
        metadata.teamCount = 10;
        break;
    }
    
    // Try to extract league name from URL if present
    const nameMatch = url.match(/name=([^&]+)/i);
    if (nameMatch) {
      metadata.leagueName = decodeURIComponent(nameMatch[1]);
    }
    
  } catch (error) {
    console.warn('Failed to extract metadata:', error);
  }
  
  return metadata;
}

// ========================================
// VALIDATION FUNCTIONS
// ========================================

/**
 * Comprehensive URL validation
 */
export function validateURL(url: string, platform?: DraftPlatform): DraftRoomURL {
  return parseURL(url, platform);
}

/**
 * Quick validation check (boolean result)
 */
export function isValidDraftURL(url: string, platform?: DraftPlatform): boolean {
  const result = validateURL(url, platform);
  return result.isValid;
}

/**
 * Validate multiple URLs in batch
 */
export function validateURLs(urls: string[]): DraftRoomURL[] {
  return urls.map(url => validateURL(url));
}

/**
 * Get supported URL formats for a platform
 */
export function getSupportedFormats(platform: DraftPlatform): string[] {
  const config = PLATFORM_CONFIGS[platform];
  return config.urlPatterns.map(pattern => {
    // Convert regex to human-readable format
    return pattern.toString()
      .replace(/\\\./g, '.')
      .replace(/\(\?\:/g, '')
      .replace(/\)\?/g, '[optional]')
      .replace(/\(\\d\+\)/g, '{league-id}')
      .replace(/\[.*?\]/g, '')
      .replace(/\/i$/, '');
  });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Build URL for platform with given parameters
 */
export function buildURL(platform: DraftPlatform, leagueId: string, options: {
  seasonYear?: number;
  draftId?: string;
  teamId?: string;
  view?: 'league' | 'draft' | 'team' | 'settings';
} = {}): string {
  const config = PLATFORM_CONFIGS[platform];
  let url = config.baseUrl;
  
  switch (platform) {
    case 'espn':
      url += `/football/${options.view || 'league'}?leagueId=${leagueId}`;
      if (options.seasonYear) url += `&seasonId=${options.seasonYear}`;
      if (options.teamId) url += `&teamId=${options.teamId}`;
      break;
      
    case 'nfl':
      url += `/league/${leagueId}`;
      if (options.teamId) url += `/team/${options.teamId}`;
      break;
      
    case 'yahoo':
      if (leagueId.match(/^\d+$/)) {
        url += `/f1/${leagueId}`;
      } else {
        url += `/league/${leagueId}`;
      }
      break;
      
    case 'sleeper':
      url += `/leagues/${leagueId}`;
      if (options.seasonYear) url += `/${options.seasonYear}`;
      break;
      
    case 'cbs':
      url += `/leagues/${leagueId}`;
      break;
      
    case 'fleaflicker':
      url += `/nfl/leagues/${leagueId}`;
      if (options.draftId) url += `/drafts/${options.draftId}`;
      break;
  }
  
  return url;
}

/**
 * Extract league information from URL without full parsing
 */
export function extractLeagueInfo(url: string): {
  platform: DraftPlatform | null;
  leagueId: string | null;
  seasonYear: number | null;
} {
  const platform = detectPlatform(url);
  if (!platform) {
    return { platform: null, leagueId: null, seasonYear: null };
  }
  
  const config = PLATFORM_CONFIGS[platform];
  const leagueId = config.extractors.leagueId(url);
  const seasonYear = config.extractors.seasonYear(url);
  
  return { platform, leagueId, seasonYear };
}

/**
 * Check if URL is for a live draft
 */
export function isLiveDraftURL(url: string): boolean {
  const keywords = ['draft', 'live', 'drafting', 'draft-room'];
  const lowerUrl = url.toLowerCase();
  return keywords.some(keyword => lowerUrl.includes(keyword));
}

/**
 * Get all supported platforms
 */
export function getSupportedPlatforms(): DraftPlatform[] {
  return Object.keys(PLATFORM_CONFIGS) as DraftPlatform[];
}

/**
 * Convert platform-specific URL to universal format
 */
export function toUniversalFormat(parsedUrl: DraftRoomURL): string {
  return `fantasy-draft://${parsedUrl.platform}/${parsedUrl.leagueId}/${parsedUrl.seasonYear}${
    parsedUrl.draftId ? `?draft=${parsedUrl.draftId}` : ''
  }`;
}

/**
 * Parse universal format URL
 */
export function fromUniversalFormat(universalUrl: string): DraftRoomURL | null {
  const match = universalUrl.match(/^fantasy-draft:\/\/([^\/]+)\/([^\/]+)\/(\d+)(\?.*)?$/);
  if (!match) return null;
  
  const [, platformStr, leagueId, seasonStr, query] = match;
  const platform = isDraftPlatform(platformStr) ? platformStr : null;
  
  if (!platform) return null;
  
  const seasonYear = parseInt(seasonStr, 10);
  const draftId = query && new URLSearchParams(query.substring(1)).get('draft');
  
  const standardUrl = buildURL(platform, leagueId, { seasonYear, draftId: draftId || undefined });
  
  return parseURL(standardUrl, platform);
}