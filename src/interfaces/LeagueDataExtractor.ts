import { NFLLeague, NFLLeagueCollection } from '../types/NFLLeagueTypes';
import { EnvironmentCapabilities } from '../utils/environmentDetection';

/**
 * Strategy interface for league data extraction
 * Supports both automated (Browser MCP) and manual (Claude Desktop) extraction
 */
export interface LeagueDataExtractor {
  /**
   * Extract league data using the appropriate method for the environment
   */
  extractLeagues(credentials: NFLCredentials): Promise<ExtractionResult>;

  /**
   * Check if this extractor can handle the current environment
   */
  canExtract(capabilities: EnvironmentCapabilities): boolean;

  /**
   * Get human-readable description of extraction method
   */
  getDescription(): string;

  /**
   * Get any additional setup instructions for this extraction method
   */
  getInstructions(): string[];
}

export interface NFLCredentials {
  email?: string;
  password?: string;
  sessionData?: any;
}

export interface ExtractionResult {
  success: boolean;
  leagues: Record<string, NFLLeague>;
  errors: string[];
  warnings: string[];
  extractionMethod: 'automated' | 'manual';
  timestamp: Date;
}

export interface ExtractionProgress {
  stage: 'initializing' | 'authenticating' | 'navigating' | 'extracting' | 'processing' | 'complete';
  message: string;
  progress: number; // 0-100
  currentLeague?: string;
  totalLeagues?: number;
  extractedLeagues?: number;
}

/**
 * Browser MCP Automated Extractor
 * Uses Playwright functions to automatically navigate NFL.com and extract data
 */
export class BrowserMCPExtractor implements LeagueDataExtractor {
  constructor(
    private onProgress?: (progress: ExtractionProgress) => void,
    private onError?: (error: string) => void
  ) {}

  canExtract(capabilities: EnvironmentCapabilities): boolean {
    return capabilities.hasBrowserMCP && capabilities.hasPlaywright;
  }

  getDescription(): string {
    return 'Automated NFL.com extraction using Browser MCP';
  }

  getInstructions(): string[] {
    return [
      'Ensure you have valid NFL.com credentials',
      'Claude will automatically navigate to NFL.com',
      'Claude will log in and extract all league data',
      'This process may take 1-2 minutes per league'
    ];
  }

  async extractLeagues(credentials: NFLCredentials): Promise<ExtractionResult> {
    const startTime = new Date();
    const result: ExtractionResult = {
      success: false,
      leagues: {},
      errors: [],
      warnings: [],
      extractionMethod: 'automated',
      timestamp: startTime
    };

    try {
      this.reportProgress('initializing', 'Starting automated extraction...', 0);

      // Check if we have Browser MCP functions available
      if (typeof window === 'undefined' || typeof (window as any).mcp__playwright__browser_navigate !== 'function') {
        throw new Error('Browser MCP functions not available');
      }

      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password required for automated extraction');
      }

      this.reportProgress('authenticating', 'Navigating to NFL.com...', 10);
      
      // Navigate to NFL.com
      await (window as any).mcp__playwright__browser_navigate({ url: 'https://fantasy.nfl.com' });
      
      this.reportProgress('authenticating', 'Logging in...', 30);
      
      // Perform login (simplified - actual implementation would be more complex)
      // This is a placeholder for the actual Browser MCP automation logic
      await this.performLogin(credentials);
      
      this.reportProgress('extracting', 'Finding leagues...', 50);
      
      // Extract league data (placeholder implementation)
      const leagues = await this.extractAllLeagues();
      
      this.reportProgress('processing', 'Processing league data...', 90);
      
      result.leagues = leagues;
      result.success = true;
      
      this.reportProgress('complete', `Successfully extracted ${Object.keys(leagues).length} leagues`, 100);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during extraction';
      result.errors.push(errorMessage);
      this.onError?.(errorMessage);
    }

    return result;
  }

  private reportProgress(stage: ExtractionProgress['stage'], message: string, progress: number) {
    this.onProgress?.({
      stage,
      message,
      progress
    });
  }

  private async performLogin(credentials: NFLCredentials): Promise<void> {
    // Placeholder for actual Browser MCP login implementation
    // This would use the existing NFLLeagueSyncer login logic
    throw new Error('Browser MCP login implementation needed');
  }

  private async extractAllLeagues(): Promise<Record<string, NFLLeague>> {
    // Placeholder for actual Browser MCP extraction implementation
    // This would use the existing NFLLeagueSyncer extraction logic
    return {};
  }
}

/**
 * Claude Desktop Manual Extractor
 * Provides interface for users to manually paste league data
 */
export class ClaudeDesktopExtractor implements LeagueDataExtractor {
  constructor(
    private onProgress?: (progress: ExtractionProgress) => void,
    private onManualEntry?: () => void
  ) {}

  canExtract(capabilities: EnvironmentCapabilities): boolean {
    return capabilities.requiresManualEntry;
  }

  getDescription(): string {
    return 'Manual league data entry for Claude Desktop';
  }

  getInstructions(): string[] {
    return [
      'Navigate to fantasy.nfl.com in your browser',
      'Log in to your NFL Fantasy account',
      'Copy league information from each league page',
      'Ask Claude to help format the data into JSON',
      'Paste the formatted JSON into the entry field below'
    ];
  }

  async extractLeagues(credentials: NFLCredentials): Promise<ExtractionResult> {
    const result: ExtractionResult = {
      success: false,
      leagues: {},
      errors: [],
      warnings: ['Manual entry required - automated extraction not available'],
      extractionMethod: 'manual',
      timestamp: new Date()
    };

    try {
      this.reportProgress('initializing', 'Preparing manual entry interface...', 0);
      
      // Trigger manual entry UI
      this.onManualEntry?.();
      
      this.reportProgress('complete', 'Manual entry interface ready', 100);
      
      // The actual data will be provided through the manual entry component
      // This extractor serves as a bridge to the manual entry UI
      result.success = true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
    }

    return result;
  }

  private reportProgress(stage: ExtractionProgress['stage'], message: string, progress: number) {
    this.onProgress?.({
      stage,
      message,
      progress
    });
  }
}

/**
 * Factory for creating appropriate extractor based on environment
 */
export class LeagueDataExtractorFactory {
  static createExtractor(
    capabilities: EnvironmentCapabilities,
    onProgress?: (progress: ExtractionProgress) => void,
    onError?: (error: string) => void,
    onManualEntry?: () => void
  ): LeagueDataExtractor {
    if (capabilities.hasBrowserMCP) {
      return new BrowserMCPExtractor(onProgress, onError);
    } else {
      return new ClaudeDesktopExtractor(onProgress, onManualEntry);
    }
  }

  static getAllExtractors(): LeagueDataExtractor[] {
    return [
      new BrowserMCPExtractor(),
      new ClaudeDesktopExtractor()
    ];
  }
}